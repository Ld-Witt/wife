## Aastrbot抽二次元老婆插件图床仓库

**如果需要快速响应，请下载全部图片放入AstrBot\data\plugin_data\astrbot_plugin_animewifex\img\wife目录。**

## GitHub 获取

**如果你的BOT能够正常访问GitHub获取图片，图片服务器基础 URL填写：https://raw.githubusercontent.com/monbed/wife/main/ 图片列表 URL填写：https://animewife.dpdns.org/list.txt**

## Deno Deploy部署
**相比Cloudflare Workers，优点是免代理访问。**

**首先Fork本仓库**

首页：https://deno.com/deploy 

先注册登陆，点击`New Playground`
![D1](/D1.png)
复制粘贴 [Deno Deploy.ts](https://raw.githubusercontent.com/monbed/wife/refs/heads/main/Deno%20Deploy.ts) 中的代码，然后点击`Save Deploy`。
![D2](/D2.png)
返回面板点击`Settings`。
![D3](/D3.png)
在`Environment Variables`中添加

根据你的实际情况修改下列配置

GITHUB_OWNER=monbed

GITHUB_REPO=wife

GITHUB_BRANCH=main

GITHUB_TOKEN=你的GITHUB_TOKEN

GITHUB_TOKEN在这申请https://github.com/settings/tokens
![D4](/D4.png)
点击`Save`。

图片服务器基础 URL，在结尾加上"/"，如https://clever-toad-16.deno.dev/
图片列表 URL为空即可

## 致谢
本仓库大部分图片出自（本人也添加了些）：   

https://github.com/Rinco304/AnimeWife

https://github.com/zgojin/astrbot_plugin_AW

https://t.me/WaifuP1c
