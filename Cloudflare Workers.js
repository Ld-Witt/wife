addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

/** 配置项：根据实际情况修改 */
const LIST_URL = 'https://animewife.dpdns.org/list.txt'
const OWNER    = 'monbed'
const REPO     = 'wife'
const BRANCH   = 'main'

/**
 * 主请求处理函数
 * @param {FetchEvent} event
 */
async function handleRequest(event) {
  const request = event.request
  const url     = new URL(request.url)
  const path    = decodeURIComponent(url.pathname.replace(/^\//, ''))

  // —— 根路径 / 或列表接口 /list ——  
  if (path === 'list' || !path) {
    const resp = await fetch(LIST_URL)
    if (!resp.ok) {
      const err = await resp.text()
      return new Response(
        `列表获取失败: ${resp.status} ${resp.statusText}\n${err}`,
        { status: 502, headers: {'Content-Type':'text/plain; charset=utf-8'} }
      )
    }
    const text = await resp.text()
    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }

  // —— 图片代理 /{filename} ——  
  const cache    = caches.default
  const cacheKey = new Request(request.url, request)
  let response   = await cache.match(cacheKey)
  if (response) return response

  // 从 GitHub 获取图片
  const imageUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`
  response = await fetch(imageUrl)
  
  if (!response.ok) {
    return new Response('未找到该图片', { status: 404 })
  }

  // 将响应克隆以便缓存，并设置缓存 86400 秒（1 天）
  const cached = new Response(response.body, response)
  cached.headers.set('Cache-Control', 's-maxage=86400')
  event.waitUntil(cache.put(cacheKey, cached.clone()))

  return cached
}
