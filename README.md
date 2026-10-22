# Cueboard

A local-first **Vue 3 single-page application** for planning content by theme. Uses Vue Router, Vite, Dexie/IndexedDB, Vitest and Vue Test Utils. The YouTube integration is optional; no backend or shared developer credentials are included.

## Develop

Use Node.js **22.22.2 or newer** (tested on 22.22.2). `.nvmrc` pins the tested runtime.

```sh
nvm use # if you use nvm
npm ci
npm run dev
```

Open <http://127.0.0.1:8775/>. The previous Python server and opening `index.html` directly are no longer supported development methods: Vue files require Vite.

| Command | Result |
| --- | --- |
| `npm run dev` | Vite development server with hot reload on 8775 |
| `npm test` | Unit, Vue component and Dexie/API integration tests |
| `npm run test:watch` | Interactive Vitest watch mode |
| `npm run test:coverage` | V8 coverage report in `coverage/` |
| `npm run build` | Optimized production assets in `dist/` |
| `npm run preview` | Serve the production build locally on 8776 |
| `npm run check` | Tests, then production build |
| `npm run package` | Tests/build, then source and deployment ZIPs in `release/` |
| `npm run deploy:pages` | Tests/build, then publishes only `dist/` to `gh-pages` using your Git credentials |

`npm ci` uses the committed lockfile. Do not commit `node_modules/`, `dist/`, `release/`, credentials, environment files or personal JSON backups. The source package has an explicit file allowlist, refuses symlinks and checks for common credential formats. Build artifacts contain application code and generic examples only, never browser data.

## Board features

- Editable theme columns and idea cards with title, demonstration, viewer value, notes, format and YouTube video link.
- Statuses: Not started, In progress (moving border) and Complete. Completed cards sit below a horizontal divider.
- First-use samples: two themes and three clearly labelled ideas in `src/data/demo.js`. There are no required theme/idea IDs.
- **Start empty** or **Remove demo data** at the bottom removes samples and unused sample themes. Your own content and edited/saved samples stay. Changes offer a short Undo window.
- Validated JSON export/restore, search, theme filtering, light/dark/system appearance and a monthly YouTube calendar.
- Up to 50 themes and 2,000 ideas. The app supports an empty board without reseeding it.

## IndexedDB storage and migration

The Dexie database is **`content-board`**, version 1. Inspect it under Chrome DevTools > Application > IndexedDB.

| Table | Stored data |
| --- | --- |
| `themes` | Theme names, colors, descriptions, ordering and sample flags |
| `ideas` | Idea content, status, selection, ordering and video links |
| `settings` | Appearance and nonsecret YouTube configuration |
| `youtubeCache` | Dated upload metadata and public/private reports |
| `credentials` | An API key only when Remember is explicitly enabled |
| `meta` | Initialization marker and board revision for safe Undo |

Writes involving themes/ideas are transactional. Queries observe committed changes across tabs using Dexie `liveQuery`. Undo refuses to overwrite a newer board revision. Storage failures remain visible and do not claim a successful save.

On first launch, the app migrates the previous generic board's `content-board:` localStorage keys **on the same origin** into IndexedDB, including an intentionally empty board. Successfully migrated keys are removed only after the IndexedDB transaction commits. An invalid legacy board remains untouched and shows a recovery error. There is no automatic migration of a personal/branded board or data from a different hostname/port. Use JSON export/restore when moving to GitHub Pages or another device.

API keys remain session-only by default; Google tokens always remain in memory. API keys, tokens, settings and cached analytics are **excluded** from board exports. IndexedDB is browser-local storage, not encrypted storage or cloud synchronization. Clearing site data or browser eviction can remove it: export backups for safekeeping. IndexedDB is shared by an origin, not a repository URL path; use a separate hostname or change `DATABASE_NAME` if you need isolation from other copies on the same GitHub Pages domain.

## YouTube: choose a connection

The board works without YouTube. Open **YouTube setup** to connect your own channel.

| Mode | What it loads | What you provide |
| --- | --- | --- |
| Public videos | Public upload dates and public lifetime view, like and comment totals | Your YouTube Data API key and channel ID, @handle or channel URL |
| My channel + analytics | Your public/scheduled uploads and private, dated reports for linked public videos | Your own Google OAuth web client ID and Google consent |

**An API key cannot read scheduled private uploads or private YouTube Analytics reports.** Google sign-in is required for that access. Public lifetime totals and private period reports are labelled separately and must not be compared as identical measurements.

### Public API key setup

1. Create or select your own project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **YouTube Data API v3** under APIs & Services.
3. Create an API key. Restrict it to **YouTube Data API v3** under API restrictions, and restrict websites/referrers to your actual deployment under application restrictions. Use separate keys for development and production when practical.
4. For this local server, add `http://127.0.0.1:8775/*` as an allowed website. If you use localhost, a different port or GitHub Pages, add that exact host/path as well. Example production referrer: `https://YOUR-USER.github.io/YOUR-REPOSITORY/*`.
5. Paste the key and a channel identifier into the board, review the data-use notice and choose **Load public videos**.

The key is sent directly to Google in the `X-Goog-Api-Key` header. It is kept in memory by default. **Remember this API key on this device** saves it in this origin's IndexedDB; **Forget API key** or **Disconnect** removes the saved copy. Browser keys are visible to that browser's user and scripts on the same origin. Restrictions reduce misuse; they do not make a browser key secret. Never commit a key, client secret or downloaded credential file.

Each visitor supplies their own key. There is no shared developer key in this project. Refresh consumes the visitor's Google Cloud project's API quota. No automatic network refresh runs on page load.

### Optional owner sign-in

1. In your own Google Cloud project, enable **YouTube Data API v3** and **YouTube Analytics API**.
2. Configure Google's OAuth consent screen/audience. While in testing, add the Google account(s) that will use it as test users. Public distribution of an OAuth app may require Google's verification; this template does not provide a verified shared OAuth application.
3. Create an OAuth client with application type **Web application**. Add the exact origin shown in the board to **Authorized JavaScript origins**. For example: `http://127.0.0.1:8775` or `https://YOUR-USER.github.io`. Origins have no repository path. No redirect endpoint or client secret is used by this browser popup flow.
4. Select **My channel + analytics**, enter your web client ID, optionally specify a channel and choose **Connect Google**. Choose the account/brand channel that owns it and grant both read permissions.
5. Paste each video's YouTube URL or ID into the matching idea, save it and refresh YouTube to retrieve its private report.

Only `youtube.readonly` and `yt-analytics.readonly` scopes are requested. The board cannot upload, edit or delete videos. The access token stays in memory and is lost after reload/expiry; reconnect to refresh private data. The client ID is public configuration, not a client secret. If Google sign-in has not loaded yet, press Connect Google again once the board says it is ready.

A channel selection must match the signed-in channel. If Google returns multiple channels, specify the intended channel. Owner reports end yesterday in Pacific time, can lag further and cover 7/28/90 calendar days. Missing reports or metrics are shown as unavailable rather than zero. Private drafts are not calendar entries; scheduled private uploads with a publication time show a clock. Uploads are not automatically classified as Shorts.

### Refresh, storage and privacy

- Sync runs only when requested; reload displays dated saved data. Calendars show dates in the viewer's browser timezone.
- YouTube responses are cached locally for up to 30 days, then removed on the next visit or while the board is open. Refresh replaces the saved snapshot. Up to 5,000 upload entries are supported; larger channels fail without saving partial data.
- **Clear saved YouTube data** removes the local cache. **Disconnect** removes the session token and API key; it retains the dated cache. **Revoke Google access** also clears the cache. You can remove the grant in [Google Account connections](https://myaccount.google.com/connections), including after a session expires.
- Clearing the browser's site data removes board content and connection settings. Export a board backup first. IndexedDB belongs to an origin, not a URL path; projects hosted under the same GitHub Pages origin can share this storage namespace. Use a separate hostname or change `DATABASE_NAME` in `src/services/database.js` if isolation is needed.
- No app server receives content, keys or reports. Hosting providers still handle page requests. Google receives API/sign-in requests and YouTube thumbnails load from Google when a calendar preview is opened. See [data use](#/privacy).

## GitHub Pages branch deployment

`main` holds source code. `gh-pages` holds only the generated production site (`index.html`, compiled assets and `.nojekyll`). Browser data, API keys, tests, dependencies and source files are never copied to the hosting branch.

To create or update the build branch from an authenticated local checkout:

```sh
npm ci
npm run deploy:pages
```

The command runs tests and a production build before pushing `dist/` to `origin/gh-pages`. It preserves the branch history and leaves your checkout on `main`. Review and commit source changes before publishing them. Updating `main` alone does not update the hosted build; run the command for each release. Application CI excludes `gh-pages` because generated assets have no npm project.

### Enable hosting

Once your GitHub account/repository supports Pages:

1. Open repository Settings > Pages.
2. Set Source to **Deploy from a branch**.
3. Choose **gh-pages**, folder **/(root)**, then Save.
4. GitHub builds/deploys that branch. Use the site URL shown by GitHub once deployment succeeds.

**Private repositories require a GitHub plan that includes private-repository Pages.** If Settings displays “Upgrade or make this repository public to enable Pages”, creating the branch cannot enable hosting. The repository owner must upgrade their plan or explicitly choose public repository visibility; the publishing command does neither. Standard Pages sites are publicly accessible even when their source repository is private. See [GitHub publishing sources and plan requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Vue Router hash paths (`/#/`, `/#/privacy`) and relative Vite asset URLs support repository subdirectory hosting without server rewrites. Update Google API key website restrictions and OAuth JavaScript origins for the deployed domain. Local data does not move between origins automatically; export/restore your board when moving devices or hosting URLs.

The existing **Deploy Pages (manual)** Actions workflow is an alternative artifact-based deployment method. Do not run that workflow for branch-based publishing. It also cannot bypass GitHub plan requirements. Commits made with Actions' default `GITHUB_TOKEN` do not trigger branch-based Pages builds, so `deploy:pages` uses your normal local Git authentication; no extra token is embedded in the app or repository.

CI tests/builds/packages source pushes and pull requests; it does not publish a website. Choose a license before offering reuse under specific terms. Shared deployment/OAuth app operators should provide their contact/privacy information and adapt the included Data use page.

## Architecture

```text
src/
  components/     Board cards/editors, calendar, dialogs, YouTube settings
  composables/    Reactive board, appearance and YouTube session state
  services/       Dexie repository, Google sign-in loader and YouTube API client
  lib/            Validation, date/calendar and API parsing helpers
  data/demo.js    Removable onboarding data
  views/          Board and lazily loaded Data use page
  styles/         Shared responsive light/dark appearance
scripts/package.mjs  Sanitized source/deployment packaging
```

Vue owns rendering and events; no legacy global UI scripts or direct `innerHTML` rendering remain. The repository owns persistence, and the API client receives credentials in memory. No Pinia store or server is needed for this single-workspace app.

## Verification and limits

Tests cover board validation, sample cleanup, transaction rollback, first-run migration, concurrent changes/stale Undo, API-key persistence/deletion, read-only Google scopes, channel mismatch, request headers, calendar schedules and Vue editing flows. YouTube requests are mocked: a real user's key/client configuration, consent and quota must be checked after setup. Component tests use Happy DOM/fake IndexedDB and do not substitute for real browser checks.

## Official references

- [Vue testing](https://vuejs.org/guide/scaling-up/testing.html)
- [Dexie liveQuery](https://dexie.org/docs/liveQuery%28%29)
- [Vite static deployment](https://vite.dev/guide/static-deploy.html)
- [YouTube Data API getting started](https://developers.google.com/youtube/data/getting-started)
- [YouTube Analytics authorization](https://developers.google.com/youtube/reporting/guides/authorization)
- [API key header guidance](https://docs.cloud.google.com/docs/authentication/api-keys-use)
