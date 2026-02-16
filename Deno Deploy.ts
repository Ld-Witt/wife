// 配置项：通过环境变量配置（Deno Deploy 仪表盘设置）
const OWNER = Deno.env.get("GITHUB_OWNER") || "monbed";
const REPO = Deno.env.get("GITHUB_REPO") || "wife";
const BRANCH = Deno.env.get("GITHUB_BRANCH") || "main";

// 主请求处理函数
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\//, "");

  if (!path) {
    return new Response("图片代理服务运行中", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 图片代理
  // const imgUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
  const imgUrl = `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}/${path}`;
  const response = await fetch(imgUrl);

  if (response.ok) {
    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return new Response("未找到该图片", { status: 404 });
}

// 启动服务
Deno.serve((req) => handleRequest(req));

