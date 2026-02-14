// 配置项：通过环境变量配置（Deno Deploy 仪表盘设置）
const OWNER = Deno.env.get("GITHUB_OWNER") || "monbed";
const REPO = Deno.env.get("GITHUB_REPO") || "wife";
const BRANCH = Deno.env.get("GITHUB_BRANCH") || "main";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") || "";

// 主请求处理函数
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\//, "");

  // 处理根路径 / 或列表接口 /list
  if (path === "list" || !path) {
    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
    const resp = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${GITHUB_TOKEN}`,
        "User-Agent": "Deno/1.0",
      },
    });

    if (!resp.ok) {
      return new Response(`列表获取失败: ${resp.status} ${resp.statusText}`, {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const { tree } = await resp.json();
    const names = tree
      .filter((e: any) => e.type === "blob")
      .filter((e: any) => e.path.startsWith("img1/") || e.path.startsWith("img2/"))
      .map((e: any) => e.path.replace(/^img[12]\//, ""));

    return new Response(names.join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 处理图片代理
  const imgPaths = [
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/img1/${path}`,
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/img2/${path}`,
  ];

  // 尝试获取图片
  for (const imgUrl of imgPaths) {
    const response = await fetch(imgUrl);
    if (response.ok) {
      return new Response(response.body, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  return new Response("未找到该图片", { status: 404 });
}

// 启动服务
Deno.serve((req) => handleRequest(req));
