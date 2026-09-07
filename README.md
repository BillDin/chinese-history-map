# Chinese Historical Place Browser / 中国历史地名浏览器

A small, open-source research interface for locating Chinese historical placenames on a modern map. Search a Chinese name or pinyin, choose a historical period or a custom year, compare every matching record, and select a result to locate its historical point coordinate.

一个轻量、开源的中国历史地名检索界面。你可以输入中文地名或拼音，选择时代或自定义年份，逐条比较所有匹配记录，并在现代地图上定位其历史点坐标。

[English](#english) · [中文](#中文)

**Documentation / 文档：** [Deployment / 线上部署](docs/deployment.md) · [API reference / 接口说明](docs/chgis-api.md) · [Data licenses / 数据许可](THIRD_PARTY_DATA.md) · [Apache-2.0](LICENSE)

---

## English

### What this application does

The application queries the live CHGIS Temporal Gazetteer and presents ambiguous placenames as separate records. It does not guess which result the user intended. Records with coordinates appear as selectable points on a modern MapLibre basemap; records without usable point geometry remain visible in the result list.

The scope is intentionally narrow. This is not a historical GIS suite: it has no historical polygons or basemaps, calendar conversion, modern-place matching, automatic disambiguation, accounts, annotations, routing, analytics, database, or offline CHGIS copy.

### Starter guide

#### 1. Prerequisites

Install the following software:

- Node.js 22.13 or later; Node.js 24 LTS is recommended. The pinned pnpm 11 toolchain requires this minimum, even though Next.js itself supports older Node.js versions.
- pnpm 11.19.0, as pinned in `package.json`.
- Git, if you are cloning the repository.

The application needs internet access while running. The server calls CHGIS for each search, and the browser loads the default map style, vector tiles, fonts, and related assets from OpenFreeMap.

#### 2. Install the project

Clone the repository, then install from its root:

```bash
git clone https://github.com/BillDin/chinese-history-map.git
cd chinese-history-map
corepack enable
pnpm install --frozen-lockfile
```

If pnpm 11.19.0 is already installed, skip `corepack enable`. If Corepack is unavailable, install the pinned package manager with `npm install --global pnpm@11.19.0`. Check `node --version` and `pnpm --version` before installing dependencies. No database or API key is required.

Keep `pnpm-workspace.yaml` with the package manifest and lockfile: it permits the native setup script for the lint toolchain's `unrs-resolver` dependency, so a fresh pnpm 11 install can finish without an interactive build-approval prompt. It also keeps the package cache in `.pnpm-store/`, which Git and Docker ignore.

#### 3. Optional configuration

The defaults work without an environment file. To override them, copy `.env.example` to `.env.local` before starting or building the application:

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

```bash
# macOS or Linux
cp .env.example .env.local
```

| Variable | Scope | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Browser, build-time | OpenFreeMap Liberty | Any MapLibre-compatible style URL |
| `CHGIS_API_URL` | Server | `https://chgis.hudci.org/tgaz/placename` | CHGIS faceted-search endpoint override |
| `CHGIS_TIMEOUT_MS` | Server | `8000` | Positive upstream timeout in milliseconds |

`NEXT_PUBLIC_MAP_STYLE_URL` is compiled into the browser bundle. Set it before `pnpm dev` or `pnpm build`, then restart or rebuild after changing it. CHGIS settings are read on the server; apply changes by restarting a self-hosted process or redeploying on a managed host. Keep local environment files out of Git.

Any replacement map style must supply its required attribution. The additional province-boundary and Chinese-first label layers expect an `openmaptiles` vector source; another compatible style will still load, but those extra context layers are skipped if that source is absent.

#### 4. Host it locally

For development with automatic reload:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Keep the terminal open while using the site. Press `Ctrl+C` in that terminal to stop the service.

To test the optimized production build locally:

```bash
pnpm build
pnpm start
```

Open the same address, [http://localhost:3000](http://localhost:3000). Run `pnpm build` again after changing source code or any `NEXT_PUBLIC_*` variable.

To let another device on the same trusted local network open the development site:

```bash
pnpm dev --hostname 0.0.0.0
```

Then visit `http://<your-computer-lan-ip>:3000` from that device. Your operating-system firewall may ask for permission. Do not expose the development server directly to the public internet; use a production build and an appropriate reverse proxy or managed host for public deployment.

#### 5. Use the interface

1. **Enter a placename.** In **历史地名**, type a Chinese name or pinyin—for example `长安`, `洛阳`, `金陵`, or a supported romanization returned by CHGIS.
2. **Choose a period.** The **时代** dropdown offers stages organized around the administrative framework of dynasties governing the Central Plains. Each preset shows its representative year and a short explanation; searches use that single year. For example, Tang Kaiyuan (`741`) and Tianbao (`742`) are separate choices. **不限年代** (the default) searches across dates. Choose **自定义年代** to reveal the original year input, accepting integers from `-222` through `1911`; enter `-221` for 221 BCE, or leave it blank for no year filter. Switching modes preserves your custom entry. Changing the dropdown alone does not run a search; the result panel retains the date used by the last submitted query.
3. **Select Search.** The browser calls this application's `/api/places` route, which performs a live CHGIS request. A new search cancels an earlier in-progress search.
4. **Compare every match.** The left panel reports the total number of matches and how many can be mapped. Each row can show the placename, pinyin, feature type, parent place, and date range. Same-name records remain separate; choose one based on the supplied metadata.
5. **Understand coordinate status.** **地图点** means CHGIS returned a usable point. **无点坐标** means the record is valid but cannot be plotted in this version. It is still available for comparison and inspection.
6. **Collect pins for comparison.** Select **加入** beside any result with coordinates. Collected records stay in the pin collection across later searches and appear together on the map. Select a collected item to inspect it, remove pins individually, or clear the collection. The collection lasts only for the current page session and does not persist CHGIS data.
7. **Select a record or marker.** Selecting a result highlights the corresponding marker and moves the map to it. Selecting a marker chooses the same record in the result panel. The map fits the current results and collected pins into one view; duplicate records appear only once.
8. **Inspect the details.** The selected-record card shows the available type, date range, administrative parents, coordinates, and source. **查看 CHGIS 原始记录** opens the upstream record in a new tab. The adapter uses a CHGIS URL supplied by the service or constructs the canonical link from its record ID.
9. **Navigate the map.** Drag to pan, use the mouse wheel or trackpad to zoom, and use the `+`/`−` buttons in the upper-right corner. The map supports zoom levels 2–18. Province-level boundaries and province/major-city labels provide modern geographic context.

The basemap is modern. Its dashed province-level boundaries and city labels are orientation aids, not reconstructions of historical jurisdictions. Only the CHGIS result markers represent historical gazetteer coordinates. Always preserve the attribution displayed along the bottom of the map.

The presets are navigation aids for relatively stable administrative frameworks, not assertions that every local boundary stayed fixed. They are not a complete chronology or a filter by ruling dynasty; unlisted years remain available through **自定义年代**. See the [period catalogue and rationale](docs/chgis-api.md#period-presets-and-custom-years).

If a search returns nothing, try a simplified/traditional variant, pinyin, or choose **不限年代**. If the map is blank, confirm that the browser can reach OpenFreeMap and that `/maplibre/maplibre-gl-worker.mjs` returns successfully. A custom raster-only style may also stop providing tiles beyond its own maximum zoom.

### Deploy online

For a personal, non-commercial project, **Vercel Hobby** is the recommended starting point. This is a Next.js application with a dynamic `/api/places` route, so it needs a server or serverless runtime. GitHub Pages alone cannot run it.

The [deployment guide](docs/deployment.md#english) covers Vercel settings (including Corepack for pnpm 11), Netlify, Cloudflare Workers tradeoffs, the existing Dockerfile, and checks to perform after deployment. No database or CHGIS API key is needed. Hosting plan details were checked on **2026-09-07**; linked provider terms are authoritative.

### Commands and tests

```bash
pnpm lint       # ESLint and Next.js rules
pnpm typecheck  # Strict TypeScript, no JavaScript emitted
pnpm test       # Synthetic unit and interaction tests
pnpm build      # Optimized production build
pnpm start      # Run the built application
```

Tests never depend on CHGIS availability and use small fictional records. Live verification is documented in [docs/chgis-api.md](docs/chgis-api.md), which also records the observed schema and normalization choices.

### Data and licensing

Historical records are fetched live, one user query at a time, from the official [CHGIS Temporal Gazetteer API](https://chgis.hudci.org/tgw/). Results are not persisted. CHGIS coverage and precision vary by period and region, and some records have no usable point geometry.

The original source code is Apache-2.0 licensed. CHGIS, OpenStreetMap, and OpenFreeMap resources are separate third-party works and are **not** covered by that license. Read [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md) before deploying or reusing the application.

### Architecture

```text
browser
  └─ GET /api/places?q=长安&year=742
       └─ src/lib/chgis/client.ts
            ├─ query validation and URL construction
            ├─ live CHGIS faceted request (no cache/persistence)
            └─ defensive normalization to HistoricalPlace
```

The App Router page keeps search, ambiguity, selection, and the session-only pin collection in React. `MapView` owns the MapLibre instance and markers. MapLibre 6's module worker URL is configured explicitly so vector tiles continue rendering beyond the low-zoom raster relief layer in bundled Next.js builds. The `predev` and `prebuild` scripts copy the worker and its shared module from the installed `maplibre-gl` package to a same-origin runtime path; generated copies are ignored by Git. All CHGIS-specific URLs, upstream keys, parsing, timeouts, and source filtering are isolated under `src/lib/chgis/`.

The API adapter returns 400 for invalid user input, 504 for an upstream timeout, and 502 for other CHGIS failures. Searches have no automatic retry. A result without a usable `POINT` remains in the list and is labeled **无点坐标**.

### Limitations

- CHGIS documents historical years approximately `-222` through `1911`; the application enforces that range.
- Search behavior, spellings, dates, coordinates, and administrative relationships are those returned by CHGIS. The application does not infer corrections or modern equivalents.
- The API's compact search schema does not label its single name as simplified or traditional; the UI displays it without guessing.
- Non-point CHGIS records are not plotted in v1.
- The default modern basemap and live CHGIS search require network access.

### Contributing

Keep the scope focused on rapid placename lookup and selection. Read [AGENTS.md](AGENTS.md), preserve the CHGIS adapter boundary and third-party attribution, add synthetic tests for changed behavior, update the API notes when upstream assumptions change, and run lint, typecheck, tests, and the production build before opening a contribution.

---

## 中文

### 这个应用能做什么

本应用实时查询 CHGIS 时间地名库，并把有歧义的同名地点作为独立记录逐条展示，不会替用户猜测某一条就是“正确答案”。带有可用点坐标的记录会显示在现代 MapLibre 底图上；没有可用点坐标的记录仍会保留在结果列表中。

项目刻意保持较小的功能边界。它不是一套完整的历史 GIS：目前不提供历史行政区多边形、历史底图、历法换算、古今地名自动匹配、自动消歧、账户、批注、路线、统计分析、数据库或离线 CHGIS 副本。

### 入门指南（Starter Guide）

#### 1. 准备运行环境

请先安装：

- Node.js 22.13 或更高版本，建议使用 Node.js 24 LTS。项目锁定的 pnpm 11 工具链要求这一最低版本，即使 Next.js 本身支持更旧的 Node.js。
- pnpm 11.19.0，与 `package.json` 中锁定的版本一致。
- 如果需要克隆仓库，还需要 Git。

网站运行时需要联网：服务端会在每次搜索时访问 CHGIS，浏览器则会从 OpenFreeMap 加载默认地图样式、矢量瓦片、字体和相关资源。

#### 2. 安装项目

克隆仓库，然后在仓库根目录安装依赖：

```bash
git clone https://github.com/BillDin/chinese-history-map.git
cd chinese-history-map
corepack enable
pnpm install --frozen-lockfile
```

如果已经安装 pnpm 11.19.0，可以跳过 `corepack enable`。若系统没有 Corepack，可执行 `npm install --global pnpm@11.19.0` 安装指定版本。安装依赖前可用 `node --version` 和 `pnpm --version` 检查版本。本项目不需要数据库或 API 密钥。

请保留与依赖清单、锁文件一起提交的 `pnpm-workspace.yaml`：它允许检查工具依赖 `unrs-resolver` 的原生模块安装脚本，使全新的 pnpm 11 安装无需交互式确认即可完成。依赖缓存保存在项目内的 `.pnpm-store/`，由 Git 和 Docker 忽略。

#### 3. 可选配置

不创建环境文件也可以直接使用默认配置。如需修改配置，请在启动或构建前把 `.env.example` 复制为 `.env.local`：

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

```bash
# macOS 或 Linux
cp .env.example .env.local
```

| 环境变量 | 生效范围 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_MAP_STYLE_URL` | 浏览器端，构建时写入 | OpenFreeMap Liberty | 任意兼容 MapLibre 的样式地址 |
| `CHGIS_API_URL` | 服务端 | `https://chgis.hudci.org/tgaz/placename` | 覆盖 CHGIS 分面搜索接口地址 |
| `CHGIS_TIMEOUT_MS` | 服务端 | `8000` | 上游请求超时毫秒数，必须为正数 |

`NEXT_PUBLIC_MAP_STYLE_URL` 会被编译进浏览器代码。请在执行 `pnpm dev` 或 `pnpm build` 前设置；修改后需要重启或重新构建。CHGIS 变量由服务端读取；自行托管时修改后需重启进程，使用托管平台时需重新部署。请勿把本地环境文件提交到 Git。

替换底图时必须保留该地图服务要求的署名。项目额外添加的省级边界和中文优先标签依赖名为 `openmaptiles` 的矢量数据源；如果自定义样式没有该数据源，底图仍可正常加载，但不会添加这些辅助图层。

#### 4. 在本机托管网站

开发模式支持修改代码后自动刷新：

```bash
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。使用网站期间需要保持终端窗口运行；在该终端按 `Ctrl+C` 即可关闭服务。

如需在本机验证优化后的生产版本：

```bash
pnpm build
pnpm start
```

仍然访问 [http://localhost:3000](http://localhost:3000)。修改源代码或任何 `NEXT_PUBLIC_*` 变量后，需要重新执行 `pnpm build`。

如果希望同一可信局域网内的手机或另一台电脑访问开发网站：

```bash
pnpm dev --hostname 0.0.0.0
```

然后在其他设备访问 `http://<运行网站电脑的局域网IP>:3000`。操作系统防火墙可能会弹出放行提示。不要把开发服务器直接暴露到公网；公开部署应使用生产构建，并配置合适的反向代理或托管服务。

#### 5. 操作界面详解

1. **输入历史地名。** 在“历史地名”框输入中文或拼音，例如“长安”“洛阳”“金陵”，也可以使用 CHGIS 返回记录所支持的罗马字拼写。
2. **选择时代。** “时代”下拉框按治理中原的王朝及其行政格局分期，每项会显示代表年份和简短说明，查询使用该单一年份。例如唐代开元十五道（`741`）与天宝郡制（`742`）分别列出。默认“不限年代”；选择“自定义年代”才展开年份输入框，可输入 `-222` 到 `1911` 之间的任意整数，公元前 221 年填 `-221`，留空也表示不限年代。切换选项会保留自定义年份。更换时代后点击“搜索”才会查询，结果区会继续标注上一次实际提交的年代。
3. **点击“搜索”。** 浏览器会请求本项目的 `/api/places` 接口，再由服务端实时访问 CHGIS。若上一次搜索还未完成，新搜索会自动取消上一次请求。
4. **比较全部匹配记录。** 左侧面板会显示匹配总数和“可定位”数量。每条记录可能包含地名、拼音、要素类型、上级地名和年代范围。同名地点会分开显示，请依据这些元数据自行选择，系统不会自动猜测。
5. **理解坐标状态。** “地图点”表示 CHGIS 返回了可用点坐标；“无点坐标”表示记录本身有效，但当前版本无法把它画在地图上。这类记录仍然可以查看和比较。
6. **收藏图钉进行对照。** 点击带坐标结果旁的“加入”，即可把记录放进图钉收藏。收藏会跨后续搜索保留，并始终一起显示在地图上；可点击收藏项查看详情、逐个移除，或一键清空。收藏仅存在于当前页面会话，不会持久化 CHGIS 数据。
7. **选择结果或地图标记。** 点击列表记录后，对应地图标记会高亮，地图也会移动到该位置；点击地图标记同样会选中记录。地图会把当前结果和已收藏图钉纳入同一视野，相同记录只显示一次。
8. **查看记录详情。** “已选记录”卡片会展示可用的类型、年代、隶属关系、坐标和来源。点击“查看 CHGIS 原始记录”会在新标签页打开上游记录。适配层优先采用服务提供的 CHGIS 链接，否则根据记录 ID 构造规范链接。
9. **操作地图。** 拖动地图可平移，滚轮或触控板可缩放，也可使用右上角的 `+`、`−` 按钮。地图支持 2–18 级缩放；省一级边界、省级名称和主要城市名称用于提供现代地理参照。

请注意，底图是**现代地图**。虚线省级边界和城市标签只用于帮助辨认方位，并不是历史行政区划复原；只有 CHGIS 搜索结果标记代表历史地名库坐标。地图底部的第三方署名必须始终保留。

时代预设选取行政格局相对稳定的阶段作为检索入口，不表示各地边界在整个时期内完全不变。预设不是完整年代分期，也不会按政权归属过滤记录；未列出的年代可用“自定义年代”查询。具体选择及依据见[时代预设说明](docs/chgis-api.md#period-presets-and-custom-years)。

如果没有搜索结果，可以尝试简繁体变体、拼音，或选择“不限年代”后重试。如果底图空白，请确认浏览器能访问 OpenFreeMap，并检查 `/maplibre/maplibre-gl-worker.mjs` 是否能正常返回。使用自定义纯栅格样式时，超过该样式自身的最大缩放级别后也可能没有瓦片。

### 线上部署

如果用于个人、非商业项目，推荐从 **Vercel Hobby** 开始。本项目是包含动态 `/api/places` 接口的 Next.js 应用，需要服务端或 Serverless 运行环境；单独使用 GitHub Pages 无法运行完整应用。

[部署指南](docs/deployment.md#中文)提供 Vercel 配置（含 pnpm 11 所需的 Corepack 设置）、Netlify、Cloudflare Workers 的取舍、现有 Dockerfile 的用法和部署后检查步骤。不需要数据库或 CHGIS API 密钥。免费套餐信息核对于 **2026-09-07**，具体条款以链接中的平台说明为准。

### 常用命令与测试

```bash
pnpm lint       # ESLint 与 Next.js 规则检查
pnpm typecheck  # 严格 TypeScript 类型检查，不生成 JavaScript
pnpm test       # 使用虚构数据运行单元测试和交互测试
pnpm build      # 创建优化后的生产构建
pnpm start      # 运行已构建的网站
```

自动测试不依赖 CHGIS 是否在线，只使用少量虚构记录。[docs/chgis-api.md](docs/chgis-api.md) 记录了实时验证方法、已观察到的接口结构和数据标准化规则。

### 数据与许可

历史地名记录由应用在每次用户搜索时从官方 [CHGIS Temporal Gazetteer API](https://chgis.hudci.org/tgw/) 实时获取，结果不会持久化保存。CHGIS 在不同时期、地区的覆盖范围和精度有所差异，部分记录没有可用点坐标。

本仓库的原创源代码使用 Apache-2.0 许可证。CHGIS、OpenStreetMap 和 OpenFreeMap 属于独立的第三方作品，**不在**该许可证的授权范围内。部署或复用本项目之前，请阅读 [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md)。

### 架构

```text
浏览器
  └─ GET /api/places?q=长安&year=742
       └─ src/lib/chgis/client.ts
            ├─ 校验查询参数并构造上游 URL
            ├─ 实时请求 CHGIS 分面搜索接口（无缓存、无持久化）
            └─ 防御性解析为 HistoricalPlace
```

App Router 页面使用 React 管理搜索、歧义结果、选择、仅限当前会话的图钉收藏和错误状态；`MapView` 管理 MapLibre 实例和地图标记。项目显式配置 MapLibre 6 模块 worker 的地址，确保 Next.js 打包后在较高缩放级别仍能渲染矢量瓦片。`predev` 和 `prebuild` 会把已安装 `maplibre-gl` 包中的 worker 及其共享模块复制到同源运行路径，生成文件由 Git 忽略。CHGIS 上游地址、字段、解析、超时和来源过滤都集中在 `src/lib/chgis/` 中。

API 适配层对无效输入返回 400，上游超时返回 504，其他 CHGIS 故障返回 502。搜索不会自动重试。没有可用 `POINT` 的记录仍会出现在列表中，并标记为“无点坐标”。

### 已知限制

- CHGIS 文档覆盖的历史年份约为 `-222` 到 `1911`，应用会强制限制在此范围内。
- 搜索行为、拼写、年代、坐标和行政隶属关系都以 CHGIS 返回内容为准；应用不会推断修正或现代对应地点。
- CHGIS 的紧凑搜索结构没有说明唯一名称字段是简体还是繁体，因此界面会原样显示，不作猜测。
- 当前版本不会绘制非点要素。
- 默认现代底图和 CHGIS 实时搜索都需要网络连接。

### 参与贡献

请继续围绕“快速检索并选择历史地名”这一核心范围开发。贡献前请阅读 [AGENTS.md](AGENTS.md)，保持 CHGIS 适配层边界和第三方署名，为行为变化添加虚构测试，在上游假设变化时更新 API 文档，并运行 lint、类型检查、测试和生产构建。
