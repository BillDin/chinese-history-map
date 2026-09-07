# Deployment / 线上部署

[English](#english) · [中文](#中文) · [README](../README.md) · [API reference](chgis-api.md)

Provider documentation checked on **2026-09-07**. These are setup instructions, not a claim that a production deployment has already been tested. Free-plan limits and terms can change.

## English

### Choose a host

For a personal, non-commercial instance, **Vercel Hobby** is the recommended starting point for this Next.js repository. The application needs a runtime for the dynamic `/api/places` route, outbound HTTPS access to CHGIS, and browser access to the basemap provider. It needs no database, persistent volume, or CHGIS API key.

| Platform | Free option and fit |
| --- | --- |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Free for personal, non-commercial use, within usage limits. Uses the existing Next.js build; see the pnpm setting below. |
| [Netlify Free](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) | 300 credits/month with a hard limit. Its [Next.js adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) supports Route Handlers. Builds and traffic consume the allowance. |
| [Cloudflare Workers Free](https://developers.cloudflare.com/workers/platform/pricing/) | 100,000 dynamic requests/day and 10 ms CPU time per invocation. Requires a Workers-compatible build and runtime validation; this repository does not include that setup. Network wait and CPU time are different limits. |
| [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Static hosting only. Cannot run this application's dynamic API; pushing the repository to GitHub does not deploy the website. |

Cloudflare currently recommends [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) for new Next.js deployments on Workers and documents [OpenNext](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) for existing integrations. Choosing that route requires a separate compatibility change, so Vercel or Netlify involves less setup for this repository.

### Vercel: recommended setup

1. Sign in to Vercel, select the **Hobby** plan for eligible personal use, and import this GitHub repository into a new project.
2. Use the repository root and the following build settings.
3. Add `ENABLE_EXPERIMENTAL_COREPACK=1` to each environment you intend to deploy, including Production and Preview. Vercel's [Corepack support](https://vercel.com/docs/builds/configure-a-build#corepack) reads the existing `packageManager: pnpm@11.19.0` pin. Its default [pnpm detection](https://vercel.com/docs/package-managers) may select an older version from the lockfile, so this setting matters.
4. Add optional application variables from [`.env.example`](../.env.example) only if changing the defaults. Deploy, then perform the checks below.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Repository root (`./`) |
| Node.js | `24.x` (the toolchain requires at least 22.13) |
| Install command | Leave automatic; enable Corepack as above |
| Build command | `pnpm build` |
| Output directory | Leave the Next.js default; do not set it to `out` or `public` |

Keep the `pnpm build` command: its `prebuild` hook copies both MapLibre worker modules into `public/maplibre/`. Calling `next build` directly skips that hook and can leave the map blank at higher zoom levels. Generated worker files should stay out of Git.

The build log should show pnpm **11.19.0** and `Prepared the MapLibre vector-tile worker in public/maplibre.` If installation reports a lockfile/version mismatch, check Corepack and Node settings before changing dependencies or the lockfile. Use the linked plan page to check the current allowance and what happens when it is exhausted.

### Netlify: alternative setup

Import the GitHub repository, use `pnpm build`, and keep the detected Next.js publish directory (`.next`) and automatic adapter. Set `NODE_VERSION=24`. Netlify's [dependency settings](https://docs.netlify.com/build/configure-builds/manage-dependencies/#pnpm) use `package.json` to select pnpm 11.19.0 and recommend `PNPM_FLAGS=--shamefully-hoist` for Next.js. Check the build log for the pinned pnpm version and worker-copy message, then run the same post-deployment checks.

### Environment and runtime

The defaults work without an environment file. Copy values into the host's environment settings when needed; do not upload `.env.local` to GitHub.

| Variable | When it takes effect |
| --- | --- |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Build time; changing it requires a fresh build/deployment |
| `CHGIS_API_URL` | Server process environment; restart or redeploy after changing |
| `CHGIS_TIMEOUT_MS` | Server process environment; default `8000` ms |

Allow the function/server request to run longer than the configured CHGIS timeout plus processing overhead. Preserve the dynamic API and its `no-store` policy. Do not add persistent CHGIS caches or response-body logs to reduce hosting costs. Keep map attribution visible and follow [THIRD_PARTY_DATA.md](../THIRD_PARTY_DATA.md); the software license does not license the historical data.

### Docker or an existing server

The existing [Dockerfile](../Dockerfile) builds the Next.js standalone output, includes `public` and `.next/static`, and runs the application as a non-root user:

```bash
docker build -t chinese-history-map .
docker run --rm -p 3000:3000 --env CHGIS_TIMEOUT_MS=8000 chinese-history-map
```

Open [http://localhost:3000](http://localhost:3000). To change the browser's map style, supply `--build-arg NEXT_PUBLIC_MAP_STYLE_URL=<style-url>` to `docker build`. CHGIS settings can be passed with `--env` to `docker run`. A container does not itself provide free hosting; a public instance still needs a host and HTTPS configuration.

For a Node.js server without Docker, use `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm start` as described in the README. The standalone output is intended for `node server.js` deployments such as the Docker image; `.next/standalone` alone does not include `public` or `.next/static`, so copy those assets when assembling it manually.

### Check the deployed instance

1. Open the page and confirm that map attribution remains visible. Zoom in enough to confirm vector tiles and labels load. Both `/maplibre/maplibre-gl-worker.mjs` and `/maplibre/maplibre-gl-shared.mjs` must return JavaScript, not a 404 or HTML fallback.
2. Submit one narrow live search, such as `长安` in `742`, and inspect `/api/places` in the browser's Network panel. Expect JSON and `Cache-Control: no-store`; results depend on the current upstream service. Do not save or commit the response.
3. Open `/api/places?q=test&year=1912`. It should return `400` JSON without contacting CHGIS. See [the API contract](chgis-api.md#application-api-get-apiplaces) for the response format.
4. If the map loads but search fails, inspect the API status: `502` indicates an upstream connection/status/JSON problem, and `504` indicates its timeout. If search works but the map is blank, check the generated worker modules and the browser's access to the style and tile provider.

## 中文

### 选择平台

个人、非商业用途推荐 **Vercel Hobby**。项目的 `/api/places` 需要服务端运行环境和访问 CHGIS 的 HTTPS 出站连接；访问者的浏览器还需连接底图服务。不需要数据库、持久磁盘或 CHGIS API 密钥。

| 平台 | 免费方案与适配情况 |
| --- | --- |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | 个人、非商业用途在额度内免费；可使用现有 Next.js 构建，需按下文设置 pnpm。 |
| [Netlify Free](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) | 每月 300 credits，设有硬性上限；构建和流量都会消耗额度。[Next.js 适配器](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)支持本项目使用的 Route Handlers。 |
| [Cloudflare Workers Free](https://developers.cloudflare.com/workers/platform/pricing/) | 每天 10 万次动态请求，每次调用限 10 ms CPU 时间；需要适配 Workers 构建并验证运行时，仓库目前尚未配置。等待网络响应的时间不等同于 CPU 时间。 |
| [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | 只托管静态文件，不能运行当前动态 API；把代码推送到 GitHub 不等于部署网站。 |

Cloudflare 当前对新的 Next.js Workers 部署推荐 [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)，对已有集成提供 [OpenNext](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) 文档。采用该方案需要另行做兼容性改动；本仓库用 Vercel 或 Netlify 所需配置更少。

### Vercel 部署步骤（推荐）

1. 登录 Vercel，为符合条件的个人用途选择 **Hobby**，新建项目并导入本 GitHub 仓库。
2. 项目根目录选 `./`，框架选 **Next.js**，Node.js 选 **24.x**，构建命令为 `pnpm build`。安装命令和输出目录保持自动识别，不要把输出目录改成 `out` 或 `public`。
3. 在准备部署的环境中（包括 Production、Preview）设置 `ENABLE_EXPERIMENTAL_COREPACK=1`。[Vercel 的 Corepack 支持](https://vercel.com/docs/builds/configure-a-build#corepack)会读取 `package.json` 中锁定的 `pnpm@11.19.0`；只靠[锁文件自动识别](https://vercel.com/docs/package-managers)可能选中旧版 pnpm。
4. 应用默认配置可直接使用。需要更换底图、上游地址或超时值时，再根据 [`.env.example`](../.env.example)填写平台环境变量，然后部署并执行下方检查。

请保留 `pnpm build`：它会先执行 `prebuild`，把 MapLibre 的两个 worker 模块复制到 `public/maplibre/`。直接执行 `next build` 会跳过此步骤，可能导致放大地图后底图空白。生成的 worker 文件无需提交到 Git。

构建日志应显示 pnpm **11.19.0** 和 `Prepared the MapLibre vector-tile worker in public/maplibre.`。如果出现锁文件或包管理器版本不兼容，先检查 Corepack 与 Node.js 配置。免费额度及用尽后的行为以平台方案页面为准。

### Netlify 备选步骤

导入 GitHub 仓库，构建命令使用 `pnpm build`，保留自动识别的 Next.js 发布目录 `.next` 和适配器。设置 `NODE_VERSION=24`。Netlify 的[依赖配置](https://docs.netlify.com/build/configure-builds/manage-dependencies/#pnpm)会依据 `package.json` 选择 pnpm 11.19.0，并建议 Next.js 项目设置 `PNPM_FLAGS=--shamefully-hoist`。确认构建日志中的 pnpm 版本和 worker 复制提示后，执行相同的部署检查。

### 环境变量与运行要求

- `NEXT_PUBLIC_MAP_STYLE_URL` 在构建时写入浏览器代码，修改后需要重新构建、部署。
- `CHGIS_API_URL` 和 `CHGIS_TIMEOUT_MS` 由服务端读取，修改后需重启进程或重新部署。默认上游超时为 `8000` ms。
- 平台的请求执行时限应大于 CHGIS 超时值，并留出处理响应的余量。保持接口动态执行和 `no-store`，不要通过持久缓存、记录完整响应或批量预取来节省托管费用。
- 默认无需环境文件；需要的配置填入托管平台，不要提交 `.env.local`。保留地图署名，遵守[第三方数据许可](../THIRD_PARTY_DATA.md)；代码开源许可不覆盖历史数据。

### Docker 或自有服务器

现有 [Dockerfile](../Dockerfile) 会打包 Next.js standalone 产物、`public` 和 `.next/static`，并以非 root 用户运行：

```bash
docker build -t chinese-history-map .
docker run --rm -p 3000:3000 --env CHGIS_TIMEOUT_MS=8000 chinese-history-map
```

访问 [http://localhost:3000](http://localhost:3000)。自定义底图需在 `docker build` 时传入 `--build-arg NEXT_PUBLIC_MAP_STYLE_URL=<style-url>`；CHGIS 配置可通过 `docker run --env` 传入。容器本身不提供免费服务器，公开访问仍需要主机和 HTTPS 配置。

不用 Docker 时，可按 README 执行 `pnpm install --frozen-lockfile`、`pnpm build`、`pnpm start`。如果手动打包 standalone 并使用 `node server.js`，应另行复制 `public` 与 `.next/static`；仅复制 `.next/standalone` 会缺少这些静态资源。

### 部署后检查

1. 打开页面，确认地图署名可见，放大后仍有矢量瓦片和文字标签。`/maplibre/maplibre-gl-worker.mjs` 与 `/maplibre/maplibre-gl-shared.mjs` 都应返回 JavaScript，而非 404 或 HTML 页面。
2. 手动提交一次范围较小的实时搜索，例如“长安”、年份 `742`。在浏览器 Network 面板确认 `/api/places` 返回 JSON 和 `Cache-Control: no-store`。结果取决于实时 CHGIS 状态，不要把响应保存或提交为数据文件。
3. 打开 `/api/places?q=test&year=1912`，应返回 `400` JSON，且不会访问 CHGIS。返回结构见[接口契约](chgis-api.md#application-api-get-apiplaces)。
4. 底图正常但搜索失败时，检查 API 状态：`502` 对应上游连接、状态或 JSON 问题，`504` 对应上游超时。搜索正常但底图空白时，检查 worker 文件和浏览器到样式、瓦片服务的连接。

平台说明核对于 **2026-09-07**；本页提供配置指导，不代表已在这些平台完成生产部署验证。
