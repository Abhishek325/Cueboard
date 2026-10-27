# 🎬 Slateory

[![CI](https://github.com/Abhishek325/Slateory/actions/workflows/ci.yml/badge.svg)](https://github.com/Abhishek325/Slateory/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

### Less hunting for ideas. More making them.

A simple workspace for planning YouTube videos, Shorts and Instagram Reels.

Group ideas by theme, keep your current work visible, and see what you’ve already finished—all on one board.

**[Open Slateory →](https://abhishek325.github.io/Slateory/)** · [Starter templates](https://abhishek325.github.io/Slateory/templates/) · [Getting started](https://abhishek325.github.io/Slateory/guide/) · [Privacy](https://abhishek325.github.io/Slateory/privacy/)

## 💡 From “I should make this” to “Published”

An idea in your notes. A script in another tab. A video you meant to finish.

Slateory gives them a place to move forward:

| Capture it | Work on it | Finish it |
| --- | --- | --- |
| Add an idea under your own theme. | Mark it in progress—it rises to the top of its theme with a moving border. | Mark it complete—it moves below the divider. |

Completed work stays accessible without crowding your next ideas. See two completed cards per theme, then choose **View all completed** to explore the rest.

## Built around your content

- **Separate projects.** Switch boards from the left dropdown. Each project has its own themes, ideas and YouTube setup.
- **Your themes, your ideas.** Create buckets that match what you make.
- **Start with a template.** Educational Shorts, building in public and travel starters each create a separate editable project.
- **Bring your own agent.** Copy project instructions and selected cards for a browser-capable agent. [See how it works](docs/AGENT-GUIDE.md).
- **More than a title.** Add the demonstration, viewer value, notes and format.
- **A clear next step.** In-progress cards appear first within each theme.
- **Find ideas quickly.** Search your board or filter to one or several themes.
- **See your posting rhythm.** Optionally connect YouTube for a monthly calendar with posted and scheduled videos.
- **Add performance context.** Link YouTube videos to cards and view supported metrics.
- **Make it comfortable.** Choose light, dark or your system’s appearance.

Slateory is a planning workspace. You publish through YouTube or Instagram yourself.

## 🚀 Try it in a minute

1. **[Open Slateory](https://abhishek325.github.io/Slateory/).** No Slateory account needed.
2. Explore the sample board—or choose **Start empty**.
3. Create a theme and add your first idea.
4. Mark it **In progress** when you start working.
5. Mark it **Complete** when you’re done.

YouTube setup is optional. Start planning immediately.

For a head start, choose **Use a template…** from the project dropdown, or **Use a template** on an empty board. Preview Educational Shorts, Building in public or Travel content, name the new project and choose **Use this template**. Each starts with three themes and four editable ideas. Your current project stays unchanged, and YouTube setup starts empty.

Use the project dropdown on the left to create or switch projects. Rename with the pencil beside the page heading; press Enter or click away to save automatically. The trash icon beside the heading deletes a project after confirmation. Your existing board stays in **Content board**; new projects start empty. Slateory remembers your last project on this browser. Deleting the last project leaves a fresh empty board; appearance preferences stay unchanged.

Choose **Start empty** in the sample-board notice to remove the remaining samples. Your own ideas and sample cards you edited and saved stay.

## Your board stays in your browser

Your ideas are saved on this device in your browser’s IndexedDB. They are not uploaded to a Slateory server.

- **Export backup** downloads the current project’s board as a JSON file. Export each project separately.
- **Restore a backup** replaces only the current project’s board. Other projects stay unchanged. Connection settings and analytics are not included.
- Changes offer a short **Undo** window.

There is no automatic cloud sync. Clearing browser data can remove your board, so keep a backup of work you want to preserve.

## Connect YouTube when you’re ready

Bring posting dates and performance context into your planning workspace.

| Connection | What you get | What you need |
| --- | --- | --- |
| Public videos | Public upload dates and lifetime view, like and comment totals | Your own YouTube Data API key |
| My channel + analytics | Public and scheduled uploads, plus dated private reports for linked public videos | Your own Google OAuth web client and read-only sign-in |

Scheduled uploads appear with a clock in the calendar. Public lifetime totals and private reports for a selected period are labelled separately.

**Slateory cannot upload, edit or delete your videos.** It does not currently connect to Instagram’s API.

---

## For developers

Slateory is a browser-based single-page application with no application backend.

| Part | Technology |
| --- | --- |
| Interface | Vue 3 |
| Routing | Vue Router |
| Development and build | Vite |
| Browser storage | Dexie + IndexedDB |
| Testing | Vitest, Vue Test Utils, Happy DOM and fake-indexeddb |
| Hosting | GitHub Pages |

### Run locally

Requires **Node.js 22.22.2 or newer**. The tested version is pinned in `.nvmrc`.

```sh
git clone https://github.com/Abhishek325/Slateory.git
cd Slateory

# Optional, if you use nvm
nvm use

npm ci
npm run dev
```

Open **http://127.0.0.1:8775/**.

Use the development server rather than opening `index.html` directly.

<details>
<summary><strong>YouTube API setup</strong></summary>

### Public videos

1. Create or select your own project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **YouTube Data API v3**.
3. Create an API key.
4. Restrict the key to **YouTube Data API v3** and the websites where you run Slateory.
5. Open **YouTube setup** in the board.
6. Enter your key and channel ID, `@handle` or channel URL.
7. Review the data-use notice and choose **Load public videos**.

For local development, an allowed website is:

```text
http://127.0.0.1:8775/*
```

For the hosted app:

```text
https://abhishek325.github.io/Slateory/*
```

Add separate entries for other hosts or ports you use. Separate development and production keys are recommended.

Each visitor supplies their own key. No shared developer key is included.

The key stays in memory unless **Remember this API key on this device** is enabled. A remembered key is stored in IndexedDB. Website and API restrictions help limit misuse; a key used in a browser is not a secret.

Refresh requests consume your Google Cloud project’s API quota. Slateory does not automatically refresh YouTube data on page load.

### Owner sign-in and analytics

1. Enable **YouTube Data API v3** and **YouTube Analytics API** in your Google Cloud project.
2. Configure the OAuth consent screen and audience. Add test users if your app is in testing.
3. Create an OAuth client of type **Web application**.
4. Add the exact deployment origin to **Authorized JavaScript origins**.
5. Select **My channel + analytics** in Slateory and enter your client ID.
6. Choose **Connect Google**, then select the account or brand channel that owns your channel.
7. Add a YouTube video URL or ID to an idea and refresh YouTube to load its report.

Example JavaScript origins:

```text
http://127.0.0.1:8775
https://abhishek325.github.io
```

Origins do not include the repository path.

Slateory requests only:

```text
youtube.readonly
yt-analytics.readonly
```

The browser popup flow does not use a client secret or a server redirect endpoint. The client ID is public configuration.

YouTube settings, remembered API keys and cached results are separate for each Slateory project. Appearance is shared across projects. Google tokens and session-only API keys stay in memory and are cleared when switching projects. Reconnect after switching projects, a reload or token expiry to refresh private reports. A publicly distributed OAuth application may require Google verification; Slateory does not provide a verified shared OAuth app.

### Reading the results

- Owner reports cover 7, 28 or 90 calendar days and end yesterday in Pacific time. Data can lag further.
- Missing reports appear as unavailable rather than zero.
- Calendar dates use the viewer’s browser timezone.
- Scheduled private uploads with a publication time appear in the calendar; ordinary private drafts do not.
- Uploads are not automatically classified as Shorts.

</details>

<details>
<summary><strong>Storage, backups and privacy</strong></summary>

Slateory uses the Dexie database **`content-board`**.

| Table | Purpose |
| --- | --- |
| `themes` | Theme names, colours, descriptions and ordering |
| `ideas` | Content, status, format, notes and video links |
| `settings` | Appearance and YouTube configuration |
| `youtubeCache` | Dated upload metadata and reports |
| `credentials` | An API key when remembering it is explicitly enabled |
| `meta` | Initialization and revision tracking |

Board changes are transactional. Open tabs observe committed changes through Dexie’s `liveQuery`. Undo will not overwrite a newer board revision.

Board backups contain themes and ideas. They exclude API keys, Google tokens, connection settings and cached analytics.

Browser storage is local, not encrypted storage or cloud synchronization. Clearing site data or browser eviction can remove it.

### Moving an existing board

Use **Export backup** on the original board, then **Restore a backup** on the destination. Restore replaces the destination board, so export its current content first if needed.

The app also supports first-run migration of its previous generic `content-board:` localStorage keys on the same origin. Migration removes those keys only after the IndexedDB transaction succeeds. Invalid legacy data remains untouched.

IndexedDB belongs to an **origin**, not a repository path. Copies hosted under the same GitHub Pages domain can share the database namespace. Use a separate hostname or change `DATABASE_NAME` in `src/services/database.js` when isolation is needed.

### YouTube data

YouTube snapshots are cached locally for up to 30 days. Refresh replaces the saved snapshot.

- **Clear saved YouTube data** removes the local cache.
- **Disconnect** removes the session token and API key while retaining the dated cache.
- **Revoke Google access** also clears the cache.

You can also remove access through [Google Account connections](https://myaccount.google.com/connections).

No Slateory application server receives your board or reports. Hosting providers handle page requests; Google receives API and sign-in requests. Calendar previews can load thumbnails from Google.

Read the [privacy and data-use page](https://abhishek325.github.io/Slateory/privacy/) for more information.

</details>

<details>
<summary><strong>Packaging</strong></summary>

Packaging uses an explicit source-file allowlist, refuses symbolic links and checks for common credential formats.

Do not commit:

```text
node_modules/
dist/
release/
.env files
credentials
personal JSON backups
```

The production build contains application code and generic samples—not users’ browser data.

</details>

<details>
<summary><strong>Deploying to GitHub Pages</strong></summary>

The repository uses:

- **`main`** for source code.
- **`gh-pages`** for the generated website.

From an authenticated local checkout:

```sh
npm ci
npm run deploy:pages
```

The command runs tests, builds the app and publishes `dist/` to `origin/gh-pages`. It preserves deployment history and leaves your checkout on `main`.

In repository **Settings → Pages**, select:

```text
Source: Deploy from a branch
Branch: gh-pages
Folder: /(root)
```

Updating `main` alone does not publish the website. Run the deployment command for each release.

CI tests, builds and packages source changes; it does not automatically deploy them. The separate manual artifact-deployment workflow is an alternative and should not be run alongside this branch-based publishing setup.

Hash routes and relative asset paths support repository subdirectory hosting without server rewrites.

For another deployment:

- Update API-key website restrictions and OAuth origins.
- Set `SITE_URL` when building to update canonical, sitemap and sharing URLs.
- Update repository links in `site/discovery.mjs`.
- Export and restore browser data if the origin changes.

Example:

```sh
SITE_URL=https://example.com/planner/ npm run build
```

Private-repository Pages availability depends on your GitHub plan. Standard Pages sites are publicly accessible even when their source repository is private.

</details>

<details>
<summary><strong>Search and AI discovery</strong></summary>

Slateory includes:

- Static About, Getting started and Privacy pages.
- Page titles, descriptions and canonical URLs.
- Open Graph and social-sharing metadata.
- Structured data describing the website and application.
- A sitemap and an optional factual `llms.txt` summary.

Public copy is maintained in `site/discovery.mjs`. Personal board content is not included in the generated public HTML.

For another deployment, update `SITE_URL` and verify the site in Google Search Console and Bing Webmaster Tools before submitting its sitemap.

The current sitemap is:

```text
https://abhishek325.github.io/Slateory/sitemap.xml
```

Search Console and Bing verification are not created by the application. No advertising or visitor-analytics tracker is included.

Crawlers read `robots.txt` at the domain root. A project hosted at `/Slateory/` cannot control that root file through a project-path `robots.txt`.

Metadata, structured data and `llms.txt` do not guarantee indexing, rankings or AI citations. `llms.txt` is optional documentation, not a crawler-permission setting.

</details>

## Help shape Slateory

Bug reports, useful templates, documentation and accessibility improvements are welcome. Read the [contribution guide](CONTRIBUTING.md) and [roadmap](ROADMAP.md) to find a focused place to start.

Slateory is available under the [MIT license](LICENSE). For search verification and repository discovery settings, see the [setup checklist](docs/DISCOVERY-SETUP.md).

## Feedback welcome

Missing something that would make your content planning easier? [Open an issue](https://github.com/Abhishek325/Slateory/issues).

If Slateory helps you turn ideas into finished work, give the repository a ⭐.
