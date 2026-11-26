
import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import UserAutomation from "../models/userAutomationData.js";

const PROFILES_BASE = path.resolve(process.cwd(), "browser-profiles");
const sessions = new Map();

const profileDir = (userId) => path.join(PROFILES_BASE, `user_${String(userId)}`);

const updateBrowserStatus = async (userId, status, extra = {}) => {
  await UserAutomation.updateOne(
    { userId },
    { $set: { "browserSession.status": status, ...extra } }
  );
};

const checkLinkedInLogin = async (page) => {
  try {
    if (page.isClosed()) return "closed";

    const url = page.url().toLowerCase();

    if (/checkpoint|challenge|authwall/.test(url)) return "verification_required";
    if (/\/login|\/signup/.test(url)) return "waiting_for_login";

    const selectors = [
      "#global-nav",
      "header.global-nav",
      "a[href*='/feed/']"
    ];

    for (const selector of selectors) {
      const element = page.locator(selector).first();

      if (await element.count() && await element.isVisible()) {
        return "connected";
      }
    }

    return "waiting_for_login";
  } catch (error) {
    console.error("[BROWSER] Login check failed:", error.message);
    return page.isClosed() ? "closed" : "error";
  }
};

// Open or reuse the persistent browser for a user.
const launchUserBrowser = async (userId) => {
  const key = String(userId);
  const existing = sessions.get(key);

  if (existing && !existing.context.pages().every(page => page.isClosed())) {
    const page = existing.page;

    if (!page.isClosed()) return existing;
  }

  // Remove stale in-memory sessions.
  sessions.delete(key);

  const dir = profileDir(userId);
  fs.mkdirSync(dir, { recursive: true });

  const context = await chromium.launchPersistentContext(dir, {
    headless: false,
    viewport: { width: 1280, height: 800 }
  });

  const page = context.pages()[0] || await context.newPage();

  const session = { context, page };
  sessions.set(key, session);

  context.on("close", async () => {
    if (sessions.get(key) === session) {
      sessions.delete(key);
    }

    await updateBrowserStatus(userId, "closed", {
      "browserSession.lastDisconnectedAt": new Date()
    }).catch(error => console.error("[BROWSER] Close update:", error.message));
  });

  return session;
};

const openLinkedInPage = async (page) => {
  await page.goto("https://www.linkedin.com/feed/", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });
};

// Initial login flow.
export const openBrowser = async (req, res) => {
  const userId = req.authenticatedUserId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "No logged in user" });
  }

  try {
    await UserAutomation.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (sessions.has(String(userId))) {
      return res.status(409).json({
        success: false,
        message: "Browser already open for this user"
      });
    }

    await updateBrowserStatus(userId, "opening", {
      "browserSession.lastError": null,
      "browserSession.userConfirmedLogin": false
    });

    const session = await launchUserBrowser(userId);

    await openLinkedInPage(session.page);

    const status = await checkLinkedInLogin(session.page);

    await updateBrowserStatus(userId, status);

    return res.status(201).json({
      success: true,
      message: "Browser opened. Log in manually.",
      data: { status }
    });
  } catch (error) {
    console.error("[BROWSER] Open error:", error);

    await updateBrowserStatus(userId, "error", {
      "browserSession.lastError": error.message
    }).catch(() => {});

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check status of the current browser.
export const getBrowserStatus = async (req, res) => {
  const userId = req.authenticatedUserId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "No logged in user" });
  }

  const session = sessions.get(String(userId));

  if (!session || session.page.isClosed()) {
    const profile = await UserAutomation.findOne({ userId }).select("browserSession");

    return res.json({
      success: true,
      data: {
        status: "closed",
        browserOpen: false,
        profileExists: fs.existsSync(profileDir(userId)),
        browserSession: profile?.browserSession ?? null
      }
    });
  }

  const status = await checkLinkedInLogin(session.page);

  await updateBrowserStatus(userId, status, status === "connected" ? {
    "browserSession.lastConnectedAt": new Date()
  } : {});

  return res.json({
    success: true,
    data: { status, browserOpen: true }
  });
};

// User explicitly clicks confirm.
// Reopens browser if closed and verifies the saved LinkedIn session.
export const confirmBrowserLogin = async (req, res) => {
  const userId = req.authenticatedUserId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "No logged in user" });
  }

  try {
    let session = sessions.get(String(userId));

    if (!session || session.page.isClosed()) {
      await updateBrowserStatus(userId, "opening");

      session = await launchUserBrowser(userId);

      await openLinkedInPage(session.page);
    }

    // Allow LinkedIn to redirect and render its authenticated page.
    await session.page.waitForTimeout(2500);

    const status = await checkLinkedInLogin(session.page);

    if (status !== "connected") {
      await updateBrowserStatus(userId, status, {
        "browserSession.userConfirmedLogin": false
      });

      return res.status(400).json({
        success: false,
        message: status === "verification_required"
          ? "LinkedIn requires additional verification."
          : "LinkedIn login was not detected. Please log in first.",
        data: { status, browserOpen: true }
      });
    }

    await updateBrowserStatus(userId, "connected", {
      "browserSession.userConfirmedLogin": true,
      "browserSession.lastConnectedAt": new Date(),
      "browserSession.lastError": null
    });

    return res.json({
      success: true,
      message: "LinkedIn account connected successfully",
      data: { status: "connected", browserOpen: true }
    });
  } catch (error) {
    console.error("[BROWSER] Confirmation error:", error);

    await updateBrowserStatus(userId, "error", {
      "browserSession.lastError": error.message
    }).catch(() => {});

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const closeBrowser = async (req, res) => {
  const userId = req.authenticatedUserId;
  const key = String(userId);
  const session = sessions.get(key);

  if (!session) {
    return res.json({ success: true, message: "No browser session is open" });
  }

  try {
    sessions.delete(key);
    await session.context.close();

    await updateBrowserStatus(userId, "closed", {
      "browserSession.lastDisconnectedAt": new Date()
    });

    return res.json({ success: true, message: "Browser closed" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
