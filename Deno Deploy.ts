// GitHub Pages 上的 list.txt 地址
const LIST_URL = "https://animewife.dpdns.org/list.txt";
// 图片的基础 URL（GitHub Raw）
const IMG_BASE_URL = "https://raw.githubusercontent.com/monbed/wife/main/";
// 缓存过期时间（秒）
const CACHE_TTL = 600;

// ========== 缓存 ==========

// 文件路径映射：文件名 -> 完整路径（如 "img1/xxx.jpg"）
let fileMap: Map<string, string> | null = null;
let cacheTimestamp = 0;

// 根据扩展名返回正确的 Content-Type
function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

// CORS 响应头
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function corsResponse(body: BodyInit | null, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(body, { ...init, headers });
}

// 从 GitHub Pages 的 list.txt 获取文件列表
async function fetchFileMap(): Promise<Map<string, string>> {
  const resp = await fetch(LIST_URL);
  if (!resp.ok) {
    throw new Error(`获取 list.txt 失败: ${resp.status} ${resp.statusText}`);
  }

  const text = await resp.text();
  const map = new Map<string, string>();

  for (const line of text.split("\n")) {
    const path = line.trim();
    if (!path) continue;
    // list.txt 格式: "img1/作品!角色.jpg" 或 "img2/作品!角色.jpg"
    const name = path.replace(/^img[12]\//, "");
    if (!map.has(name)) {
      map.set(name, path);
    }
  }

  return map;
}

// 获取缓存的文件映射（带 TTL 自动过期）
async function getFileMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (fileMap && now - cacheTimestamp < CACHE_TTL * 1000) {
    return fileMap;
  }
  console.log("[Cache] 刷新文件列表缓存...");
  fileMap = await fetchFileMap();
  cacheTimestamp = now;
  console.log(`[Cache] 已缓存 ${fileMap.size} 个文件`);
  return fileMap;
}

// 清空缓存
function invalidateCache() {
  fileMap = null;
  cacheTimestamp = 0;
  console.log("[Cache] 缓存已清除");
}

// ========== 请求处理 ==========

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\//, "");

  // CORS 预检
  if (request.method === "OPTIONS") {
    return corsResponse(null, { status: 204 });
  }

  // 刷新缓存端点（可用于 GitHub Webhook 或手动刷新）
  if (path === "refresh" && request.method === "POST") {
    invalidateCache();
    return corsResponse("缓存已刷新", { status: 200 });
  }

  // 列表接口
  if (path === "list" || path === "list.txt" || !path) {
    try {
      const map = await getFileMap();
      const names = Array.from(map.keys());
      return corsResponse(names.join("\n"), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch (e) {
      console.error("[List] 获取文件列表失败:", e);
      return corsResponse(`列表获取失败: ${e}`, {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  // 缓存状态（调试用）
  if (path === "status") {
    const cacheAge = fileMap
      ? Math.round((Date.now() - cacheTimestamp) / 1000)
      : -1;
    return corsResponse(
      JSON.stringify(
        {
          cached: !!fileMap,
          fileCount: fileMap?.size ?? 0,
          cacheAgeSec: cacheAge,
          cacheTTLSec: CACHE_TTL,
        },
        null,
        2
      ),
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  // 图片代理
  try {
    const map = await getFileMap();
    const decodedPath = decodeURIComponent(path);
    const fullPath = map.get(decodedPath);

    if (!fullPath) {
      return corsResponse("未找到该图片", { status: 404 });
    }

    const imgUrl =
      IMG_BASE_URL +
      encodeURIComponent(fullPath).replace(/%2F/g, "/");
    const response = await fetch(imgUrl);

    if (!response.ok) {
      console.error(`[Proxy] 获取图片失败: ${imgUrl} -> ${response.status}`);
      return corsResponse("图片获取失败", { status: 502 });
    }

    return corsResponse(response.body, {
      headers: {
        "Content-Type": getMimeType(fullPath),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("[Proxy] 代理错误:", e);
    return corsResponse("服务器内部错误", { status: 500 });
  }
}

// 启动服务
console.log(`[Server] 启动中... 列表: ${LIST_URL}`);
Deno.serve((req) => handleRequest(req));
