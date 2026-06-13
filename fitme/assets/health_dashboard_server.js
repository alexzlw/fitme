const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const root = __dirname;
const dataPath = path.join(root, "health_dashboard_data.json");
const legacyJsPath = path.join(root, "health_dashboard_data.js");
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";

const mimes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store"
  });
  res.end(body);
}

async function readData() {
  const raw = await fs.readFile(dataPath, "utf8");
  return JSON.parse(raw);
}

function validateData(data) {
  if (!data || typeof data !== "object") return "data must be an object";
  if (!Array.isArray(data.days)) return "data.days must be an array";
  if (!data.profile || typeof data.profile !== "object") return "data.profile is required";
  if (!data.targets || typeof data.targets !== "object") return "data.targets is required";
  return null;
}

async function writeData(data) {
  const error = validateData(data);
  if (error) throw new Error(error);

  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(`${dataPath}.tmp`, json, "utf8");
  await fs.rename(`${dataPath}.tmp`, dataPath);

  const legacyJs = `window.HEALTH_DASHBOARD_DATA = ${JSON.stringify(data, null, 2)};\n`;
  await fs.writeFile(legacyJsPath, legacyJs, "utf8");
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("request body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/health_progress_dashboard.html" : url.pathname);
  const resolved = path.resolve(root, `.${pathname}`);
  if (!resolved.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(resolved);
    send(res, 200, file, mimes[path.extname(resolved)] || "application/octet-stream");
  } catch (error) {
    send(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not found" : "Server error");
  }
}

async function serveLocalImage(url, res) {
  const source = url.searchParams.get("path");
  if (!source) {
    send(res, 400, "Missing image path");
    return;
  }

  const resolved = path.isAbsolute(source) ? path.resolve(source) : path.resolve(root, source);
  const ext = path.extname(resolved).toLowerCase();
  if (!path.isAbsolute(source) && !resolved.startsWith(root)) {
    send(res, 403, "Forbidden image path");
    return;
  }
  if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
    send(res, 415, "Unsupported image type");
    return;
  }

  try {
    const file = await fs.readFile(resolved);
    send(res, 200, file, mimes[ext] || "application/octet-stream");
  } catch (error) {
    send(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Image not found" : "Image read error");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/health-data" && req.method === "GET") {
      send(res, 200, JSON.stringify(await readData()), "application/json; charset=utf-8");
      return;
    }

    if (url.pathname === "/api/status" && req.method === "GET") {
      send(res, 200, JSON.stringify({
        ok: true,
        root,
        dataPath,
        url: `http://${host}:${port}/health_progress_dashboard.html`
      }), "application/json; charset=utf-8");
      return;
    }

    if (url.pathname === "/api/local-image" && (req.method === "GET" || req.method === "HEAD")) {
      await serveLocalImage(url, res);
      return;
    }

    if (url.pathname === "/api/health-data" && req.method === "POST") {
      const body = await readBody(req);
      const data = JSON.parse(body);
      await writeData(data);
      send(res, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(req, res);
      return;
    }

    send(res, 405, "Method not allowed");
  } catch (error) {
    send(res, 400, JSON.stringify({ ok: false, error: error.message }), "application/json; charset=utf-8");
  }
});

server.listen(port, host, () => {
  console.log(`Health dashboard running at http://${host}:${port}/health_progress_dashboard.html`);
  console.log(`Persistent data file: ${dataPath}`);
});
