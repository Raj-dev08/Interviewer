
import axios from "axios";

const getWorkerClient = () =>
    axios.create({
        baseURL: process.env.AUTOMATION_WORKER_URL || "http://localhost:8001",
        timeout: 30000,
        headers: {
            "x-worker-api-key": process.env.WORKER_API_KEY || "",
            "Content-Type": "application/json"
        }
    });

const handleWorkerError = (res, error) => {
    console.error("[AUTOMATION PROXY]", error.response?.data || error.message);

    if (error.response) {
        return res.status(error.response.status).json(error.response.data);
    }

    return res.status(502).json({
        success: false,
        message: "Automation service is unavailable"
    });
};

// Generic worker request. Always forwards the authenticated user's ID.
const proxyRequest = async (req, res, method, url, data = undefined) => {
    try {
        const userId = req.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const worker = getWorkerClient();

        const response = await worker.request({
            method,
            url,
            headers: {
                "x-user-id": userId
            },
            data,
            params: req.query
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        return handleWorkerError(res, error);
    }
};

// Automation profile
export const getAutomationProfile = (req, res) =>
    proxyRequest(req, res, "GET", "/api/automation/profile");

export const updateAutomationPreferences = (req, res) =>
    proxyRequest(req, res, "PATCH", "/api/automation/preferences", req.body);

export const getLinkedInStatus = (req, res) =>
    proxyRequest(req, res, "GET", "/api/automation/linkedin/status");

// Browser session
export const openBrowser = (req, res) =>
    proxyRequest(req, res, "POST", "/api/automation/browser/open");

export const getBrowserStatus = (req, res) =>
    proxyRequest(req, res, "GET", "/api/automation/browser/status");

export const confirmBrowserLogin = (req, res) =>
    proxyRequest(req, res, "POST", "/api/automation/browser/confirm");

export const closeBrowser = (req, res) =>
    proxyRequest(req, res, "POST", "/api/automation/browser/close");

// User jobs
export const getUserJobs = (req, res) =>
    proxyRequest(req, res, "GET", "/api/userjob");
