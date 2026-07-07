import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";
import { gamesPage } from "./games-page.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 8080);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".mjs", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".ico", "image/x-icon"],
  [".wasm", "application/wasm"],
]);

const scramjet = await bootstrap({ transport: "libcurl" });

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/ui.html";

  const filePath = path.resolve(__dirname, `.${pathname}`);
  if (!filePath.startsWith(__dirname)) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const data = await fs.readFile(finalPath);
    const type = contentTypes.get(path.extname(finalPath).toLowerCase()) || "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(data);
  } catch {
    send(res, 404, "Not found");
  }
}

const server = http.createServer(async (req, res) => {
  if (scramjet.routeRequest(req, res)) return;

  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (requestUrl.pathname === "/games/lumin") {
    send(res, 200, gamesPage("lumin"), "text/html; charset=utf-8");
    return;
  }
  if (requestUrl.pathname === "/games/gnmath") {
    send(res, 200, gamesPage("gnmath"), "text/html; charset=utf-8");
    return;
  }
  if (requestUrl.pathname === "/games/nikehub") {
    send(res, 200, gamesPage("nikehub"), "text/html; charset=utf-8");
    return;
  }

  await serveStatic(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (scramjet.routeUpgrade(req, socket, head)) return;
  socket.destroy();
});

server.listen(PORT, () => {
  console.log(`Snipershot Scramjet running at http://localhost:${PORT}/ui.html`);
});


