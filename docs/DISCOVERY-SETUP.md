# Search and GitHub discovery setup

The repository prepares the public pages and contribution files. These account-level steps still require the project owner's access. None of them guarantees indexing, rankings or new users.

## Search Console

1. Open https://search.google.com/search-console and add a **URL-prefix** property for `https://abhishek325.github.io/Slateory/`.
2. Choose HTML tag verification. Copy only the value in `content="..."`.
3. Set `GOOGLE_SITE_VERIFICATION` as a GitHub Actions **repository variable**, or put it in an uncommitted `.env.local` when building locally. It is a public verification value, not a secret API key.
4. Build and deploy with that value present. The generated HTML includes the tag. Keep the value on future deployments.
5. Return to Search Console and verify ownership.
6. Submit `https://abhishek325.github.io/Slateory/sitemap.xml`.
7. Inspect the home page and `/templates/` pages and request indexing if appropriate. Later inspect actual impressions, queries and clicks; submission alone is not proof of indexing.

The included manual GitHub Pages workflow passes repository verification variables into the build. The existing branch-based `npm run deploy:pages` route instead reads your local environment/`.env.local`. Use the deployment route configured for the repository; do not change the Pages publishing source merely to add verification.

## Bing Webmaster Tools

Open https://www.bing.com/webmasters/ and add the same site. If using its HTML meta method, set `BING_SITE_VERIFICATION` to the `msvalidate.01` content value, rebuild, deploy and verify. Google verification does not automatically complete Bing verification unless you explicitly use an available import flow.

## Public pages

- `/` — the planner, metadata and a small About dialog.
- `/about/`, `/guide/`, `/privacy/` — static, readable product documentation.
- `/templates/` — starter template directory.
- `/templates/educational-shorts/`, `/templates/building-in-public/`, `/templates/travel-content/` — useful public examples and links to their corresponding app previews.

Canonical URLs, social metadata and the sitemap use `SITE_URL`. Public template links open a preview; they never import a project without confirmation. Personal browser content is not in these pages. `llms.txt` summarizes product facts; it is not a crawler permission file or a guarantee of AI visibility.

GitHub Pages project sites cannot control the domain-root `robots.txt`. Do not add a misleading `/Slateory/robots.txt` expecting it to control crawlers for the host. A custom domain is optional; migration needs a deliberate redirect and browser-data plan because storage belongs to the origin.

## Repository About settings

Suggested description:

> Free, browser-local content planner for YouTube and Instagram creators. Projects, themes, starter templates and optional YouTube insights.

Website: `https://abhishek325.github.io/Slateory/`

Suggested topics: `content-planner`, `youtube`, `instagram`, `creator-tools`, `kanban`, `vue`, `vite`, `dexie`, `indexeddb`, `local-first`.

Set these in the repository's About settings. Topic labels describe the project; they do not imply endorsement or user demand.

## Community launch readiness

- MIT license, contribution guide, roadmap and issue/PR templates are included in the source. They take effect on GitHub after pushing them to the default branch.
- Enable Issues if disabled. Consider Discussions only when there is a reason to maintain a separate conversation space.
- After publishing the code, create a few small, genuinely approachable issues before applying `good first issue`. Do not apply it to unbounded roadmap work.
- Add a real product screenshot/GIF with fictional content to the README. Do not use a fabricated mockup as evidence of working behavior.
- Publish a release with the tested ZIPs if downloadable/self-hosted releases are wanted. There is no automatic release workflow in this repository.

## Measurement

GitHub repository traffic and stars measure repository interest, not planner retention. No visitor tracking is added by this setup. A small voluntary user pilot can measure real repeat use without collecting board contents. If product analytics are later introduced, make the data handling explicit and update the privacy notice.
