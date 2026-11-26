# Automation Worker

`automation-worker` handles both **Mode A (Headless Browser Automation)** and **Mode B (Interactive Remote Browser Streaming)** in a single Express + WebSocket service.

## Browser Modes

- **Mode A (`browserManager.js`)**: Uses Playwright headless Chromium with isolated per-user `BrowserContext`s for permitted public job-source discovery. Never starts Xvfb, x11vnc, or websockify. Remains active even when `ENABLE_REMOTE_BROWSER` is unset.
- **Mode B (`remoteBrowserManager.js` + `vncManager.js`)**: Spawns `Xvfb`, `x11vnc` (loopback-only), `websockify`, and headed Chromium on demand when a user requests an interactive browser session. Protected behind `ENABLE_REMOTE_BROWSER=true`, internal worker auth, user ownership checks, and short-lived HMAC-signed viewer tokens.

## Environment Variables

### Local Development (Interactive + Headless)

```env
PORT=8001
MONGODB_URI=mongodb+srv://...
WORKER_API_KEY=your-internal-worker-key
ENABLE_REMOTE_BROWSER=true
# Optional: VIEWER_TOKEN_SECRET=separate-random-secret
# Optional: SESSION_STORAGE_KEY=encryption-key-for-permitted-sites
```

### Production Headless-Only (e.g., Render)

```env
PORT=8001
MONGODB_URI=mongodb+srv://...
WORKER_API_KEY=your-internal-worker-key
# ENABLE_REMOTE_BROWSER intentionally absent
```

When `ENABLE_REMOTE_BROWSER` is missing or set to anything other than `"true"`, all `/api/automation/browser/*` HTTP and WebSocket routes return HTTP `403` with:

```json
{
  "success": false,
  "enabled": false,
  "message": "Remote browser functionality is disabled on this deployment."
}
```

## Local Development vs. Render Deployment

- **Local Development**: Run inside the included `Dockerfile` (`docker build` + `docker run`) on Windows/macOS/Linux to enable `xvfb`, `x11vnc`, `novnc`, `websockify`, and headed Chromium. On Windows directly, `automation-worker` still starts and runs headless Playwright (Mode A), while interactive VNC session creation returns a clear error explaining Linux/Docker is required.
- **Render Deployment**:
  - **Headless-only production**: Leave `ENABLE_REMOTE_BROWSER` unset. Mode A headless Playwright runs without starting Xvfb/VNC.
  - **Known Render Free Tier Limitations**: Render's free tier does not provide sufficient RAM (~512 MB), continuous process lifetime (free instances spin down on idle), or persistent disk storage for multi-process interactive Xvfb + x11vnc + headed Chromium sessions. Furthermore, Render's container filesystem is ephemeral — local files and encrypted profile directories do not survive restarts or redeploys. Enabling `ENABLE_REMOTE_BROWSER=true` on a free tier instance will not overcome these memory, lifecycle, or ephemeral-storage limits.
