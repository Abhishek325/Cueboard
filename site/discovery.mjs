export const defaultSiteUrl = 'https://abhishek325.github.io/Cueboard/';
export function siteUrl(value = defaultSiteUrl) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.search || url.hash || url.username || url.password) throw Error('SITE_URL must be a public HTTPS URL without credentials, query or fragment.');
  return url.href.replace(/\/$/, '') + '/';
}
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
export const description = 'Plan YouTube videos, Shorts and Instagram Reels by theme. Track progress, keep a posting calendar and save your content in your browser with Cueboard.';
export const pages = [
  { path: '', title: 'Cueboard — Free Content Planner for YouTube & Instagram', description },
  { path: 'guide/', title: 'How to Plan Reels & YouTube Videos with Cueboard', description: 'Organize video ideas by theme, track work in progress, restore a board backup and connect an optional YouTube posting calendar in Cueboard.' },
  { path: 'privacy/', title: 'Cueboard Privacy & Data Storage', description: 'Where Cueboard stores your content, what board backups include, and how optional YouTube API keys and Google read-only connections work.' }
];
export function metadata(page = pages[0], base = defaultSiteUrl) {
  base = siteUrl(base);
  const url = base + page.path;
  const graph = [
    { '@type': 'WebSite', '@id': base + '#website', name: 'Cueboard', url: base, inLanguage: 'en' },
    { '@type': 'WebPage', '@id': url + '#webpage', name: page.title, description: page.description, url, inLanguage: 'en', isPartOf: { '@id': base + '#website' }, about: { '@id': base + '#application' } },
    { '@type': 'WebApplication', '@id': base + '#application', name: 'Cueboard', url: base, description,
      applicationCategory: 'ProductivityApplication', operatingSystem: 'Web browser', browserRequirements: 'JavaScript and IndexedDB enabled',
      isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'The planner is free to use. Optional Google API usage is subject to Google quotas and terms.' },
      featureList: ['Content ideas grouped by editable themes', 'Progress tracking with a completed section', 'Optional YouTube posting calendar and read-only analytics', 'Browser-local IndexedDB storage', 'JSON board backup and restore', 'Light, dark and system appearance'],
      image: base + 'social-card.png', sameAs: 'https://github.com/Abhishek325/Cueboard' }
  ];
  return `<title>${escape(page.title)}</title>
  <meta name="description" content="${escape(page.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#20211f">
  <link rel="canonical" href="${escape(url)}">
  <link rel="icon" href="${escape(base)}favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${escape(base)}apple-touch-icon.png">
  <link rel="sitemap" href="${escape(base)}sitemap.xml" type="application/xml">
  <link rel="alternate" href="${escape(base)}llms.txt" type="text/plain" title="Cueboard product summary">
  <meta property="og:type" content="website"><meta property="og:site_name" content="Cueboard"><meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${escape(url)}">
  <meta property="og:image" content="${escape(base)}social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Cueboard: plan your next video, with themes, progress and a YouTube calendar">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)}"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${escape(base)}social-card.png"><meta name="twitter:image:alt" content="Cueboard content planner">
  <script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}
export const homeContent = `<section class="product-context" id="about-cueboard" aria-labelledby="about-heading">
  <div class="site-eyebrow">ABOUT CUEBOARD</div>
  <h2 id="about-heading">A content planner for YouTube and Instagram.</h2>
  <p>Cueboard helps individual creators turn a collection of video ideas into a plan. Group YouTube videos, Shorts and Instagram Reels by theme, see what is in progress, and keep completed work below a shared divider.</p>
  <div class="site-grid"><section><h3>Plan around your themes</h3><p>Create your own columns and add an idea’s demonstration, viewer value, notes and format. Search the board when you are ready to choose your next video.</p></section><section><h3>Keep progress visible</h3><p>Mark a video as in progress or complete. A moving border highlights work in progress; finished cards stay available below the board.</p></section><section><h3>Add YouTube context</h3><p>Optionally connect your channel to show public posting dates and video counts. Owner sign-in adds scheduled uploads and dated, read-only analytics.</p></section></div>
  <h3>Your workspace stays in your browser</h3><p>The planner is free to use and needs no Cueboard account. Your ideas are saved in this browser’s IndexedDB, rather than uploaded to a Cueboard server. Export a JSON backup to move your board to another device or keep a copy. Clearing browser data can remove your work.</p>
  <h3>Does Cueboard publish or schedule videos?</h3><p>No. It is a planning workspace. You publish on YouTube or Instagram yourself. The optional YouTube calendar displays dates fetched from your channel; it does not create scheduled uploads. There is no Instagram API connection.</p>
  <h3>Do I need a YouTube API key?</h3><p>Only for the optional public YouTube connection. Planning works without a key. Private channel reports and scheduled uploads require your own Google OAuth client and read-only sign-in. Google API usage is subject to Google’s quotas and terms.</p>
  <nav class="site-links" aria-label="Cueboard information"><a href="./guide/">Getting started</a><a href="./privacy/">Privacy &amp; data</a><a href="https://github.com/Abhishek325/Cueboard">GitHub source</a><a href="./llms.txt">Product summary</a></nav>
</section>`;
const guide = `<div class="site-eyebrow">GETTING STARTED</div><h1>Plan your next video with Cueboard.</h1>
  <p class="site-lead">One workspace for your themes, next ideas and completed videos. This guide uses a fictional creator planning a tutorial and a behind-the-scenes Reel.</p>
  <h2>1. Choose themes you will return to</h2><p>A theme is a reusable topic bucket, such as Tutorials or Behind the scenes. Use <strong>New theme</strong> to name a column, describe its purpose and choose a color. Begin with a few themes you can consistently make useful videos about.</p>
  <h2>2. Give each idea a concrete demonstration</h2><p>Select <strong>New idea</strong> or the plus button in a theme. For a tutorial, “Show one useful spreadsheet shortcut” is a more actionable working title than “Spreadsheet tips.” Add what you will show, why it helps a viewer, production notes and a format: Reel + Short, YouTube tutorial, Reel + tutorial or Carousel. These are planning labels; Cueboard does not generate the content.</p>
  <h2>3. Track the work you are actually doing</h2><p>Change the status to <strong>In progress</strong> when you start production. Its border moves so the active card is easy to find. Mark it <strong>Complete</strong> after you finish; the card moves below the horizontal completed divider within its theme. You can restore a completed card to active work.</p>
  <h2>4. Make the sample board your own</h2><p>On a fresh browser, Cueboard opens with two sample themes and three labelled cards. Edit and save a sample to keep it as your own. <strong>Start empty</strong> or <strong>Remove demo data</strong> removes remaining samples and unused sample themes. Your own content stays. Use the immediate Undo control if needed.</p>
  <h2>5. Back up before moving browsers or devices</h2><p>Select <strong>Export backup</strong> to download a JSON file containing your themes, ideas, notes, progress and linked video IDs. On the other browser, open Cueboard, choose <strong>Restore a backup</strong>, select that file and review the replacement counts. Restoring replaces the current board; export it first if you want to keep it.</p><p>Storage belongs to your browser and website origin. It does not automatically sync between devices, browser profiles, localhost and GitHub Pages. The same domain’s other apps can share browser storage. Keep important backups somewhere safe.</p>
  <h2>6. Optionally connect your YouTube channel</h2><p><strong>Public videos:</strong> open YouTube setup and enter your channel ID, handle or channel URL plus your own YouTube Data API key. This loads public upload dates and public lifetime views, likes and comments. Restrict your key to YouTube Data API v3 and this website in Google Cloud. The key is session-only unless you choose to remember it on this device.</p><p><strong>My channel + analytics:</strong> provide your own Google OAuth web client and connect the account that owns the channel. Read-only access can retrieve scheduled uploads and private period reports for linked public videos. Link a video’s URL or ID in its idea card and refresh to fetch its report.</p><p>Use the refresh button when you need updated data. A reload shows the saved snapshot. Public lifetime totals and private period reports cover different windows; compare like with like. API keys and Google tokens are never part of your board backup.</p>
  <h2>What Cueboard does not do</h2><p>Cueboard does not upload videos, create schedules, publish to Instagram, guarantee reach, or provide cloud backup. A clock in the calendar represents a schedule already fetched from YouTube. You can plan without connecting any external service.</p>
  <p><a class="site-button" href="../">Open your content board →</a></p>`;
const privacy = `<div class="site-eyebrow">PRIVACY &amp; DATA</div><h1>Your content, in your browser.</h1>
  <p class="site-lead">Cueboard is a browser-based planner. It has no Cueboard account system or application server that receives your board content.</p>
  <h2>Where your board is stored</h2><p>Themes, ideas, notes, statuses, appearance, YouTube settings and cached responses are stored in this website origin’s IndexedDB. Storage is specific to the browser and device; it is not cloud synchronization. Browser storage is not encrypted by Cueboard. Other scripts on the same origin can access it. Clearing site data or browser storage eviction can remove it.</p>
  <h2>What a backup contains</h2><p>Exported JSON backups contain your board content and linked video IDs. They exclude API keys, Google tokens, connection settings and fetched analytics. Importing a backup reads it locally in your browser and replaces that browser’s board. It does not publish the file to GitHub or make it visible to other visitors.</p>
  <h2>Optional Google connections</h2><p>Public YouTube data requires your own API key. It stays in memory unless you choose Remember this API key on this device, which saves it in IndexedDB. Owner sign-in requests YouTube account read-only and YouTube Analytics read-only permissions. It cannot upload, edit or delete videos. Google tokens stay in memory and require reconnection after reload or expiry. Google receives the API and sign-in requests; YouTube thumbnail previews may load from Google.</p>
  <h2>Saved reports and deletion</h2><p>Dated YouTube responses are cached for up to 30 days and removed on the next check after expiry. Sync is manual. Clear saved YouTube data removes the cache. Disconnect removes the token and saved API key but retains unexpired cached reports. Revoke Google access also clears the cache. You can manage grants through <a href="https://myaccount.google.com/connections">Google Account connections</a>.</p>
  <h2>Hosting and measurement</h2><p>GitHub Pages serves the application and may process ordinary page-request logs under its own policies. Cueboard does not include advertising, visitor tracking scripts or an analytics pixel. The optional YouTube reports describe your linked videos; they do not track visitors to this website.</p>
  <p>Each deployment operator supplies their own Google configuration. Review the <a href="https://www.youtube.com/t/terms">YouTube terms</a> and <a href="https://policies.google.com/privacy">Google privacy policy</a> before connecting. For the complete in-app notice, see <a href="../#/privacy">How this board uses data</a>. For product questions, <a href="https://github.com/Abhishek325/Cueboard/issues">open a GitHub issue</a> without including credentials or private reports.</p>`;
export function documentPage(page, base = defaultSiteUrl) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark">${metadata(page, base)}<link rel="stylesheet" href="../site.css"></head><body class="site-document"><a class="site-skip" href="#content">Skip to content</a><header class="site-header"><a class="site-brand" href="../"><img src="../favicon.svg" alt="" width="30" height="30">Cueboard</a><nav aria-label="Site navigation"><a href="../">Open board</a><a href="../guide/">Guide</a><a href="../privacy/">Privacy</a></nav></header><main id="content">${page.path === 'guide/' ? guide : privacy}</main><footer class="site-footer"><a href="../">Cueboard</a> · <a href="https://github.com/Abhishek325/Cueboard">GitHub</a> · <a href="../llms.txt">Product summary</a></footer></body></html>`;
}
export function discoveryFiles(base = defaultSiteUrl) {
  base = siteUrl(base);
  return {
    'guide/index.html': documentPage(pages[1], base),
    'privacy/index.html': documentPage(pages[2], base),
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${escape(base + page.path)}</loc></url>`).join('\n')}\n</urlset>\n`,
    'llms.txt': `# Cueboard\n\n> A free, browser-local content planner for individual YouTube and Instagram creators.\n\nPlan video ideas by editable themes, track progress and keep completed work below a shared divider. Optional YouTube integration adds a posting calendar and read-only video metrics. Planning requires no Cueboard account or API key.\n\n## Pages\n- [Content board and product overview](${base}): Planner, features and common questions.\n- [Getting started](${base}guide/): Themes, idea details, progress, backups and optional YouTube setup.\n- [Privacy and data](${base}privacy/): Browser storage, backup contents, Google permissions and deletion.\n- [Source and setup](https://github.com/Abhishek325/Cueboard): Vue, Dexie, Vite, testing and deployment documentation.\n\n## Product facts\n- Themes, ideas and progress are stored in this browser's IndexedDB, not a Cueboard server.\n- Export/restore JSON to move boards. No automatic device sync or cloud backup.\n- Board exports exclude credentials and fetched analytics.\n- Public YouTube data requires the visitor's own API key. Private analytics and scheduled uploads require their own OAuth client and owner sign-in. Access is read-only.\n- Cueboard does not upload, publish, schedule videos or connect to Instagram's API.\n- The planner is free; Google API usage is subject to Google's quotas and terms.\n\nThis summary is optional documentation, not a crawler permission file or a guarantee of AI-search inclusion. Personal browser data is not served in the site's public HTML.\n`
  };
}
export function discoveryPlugin() {
  const base = siteUrl(process.env.SITE_URL || defaultSiteUrl);
  const files = discoveryFiles(base);
  return {
    name: 'cueboard-discovery',
    transformIndexHtml: { order: 'pre', handler: html => html.replace('<!-- cueboard:metadata -->', metadata(pages[0], base)).replace('<!-- cueboard:public-content -->', homeContent) },
    generateBundle() { for (const [fileName, source] of Object.entries(files)) this.emitFile({ type: 'asset', fileName, source }); },
    configureServer(server) { server.middlewares.use((req, res, next) => { const path = (req.url || '').split('?')[0].replace(/^\//, ''); const key = path.endsWith('/') ? path + 'index.html' : path; if (!(key in files)) return next(); res.setHeader('Content-Type', key.endsWith('.html') ? 'text/html; charset=utf-8' : key.endsWith('.xml') ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8'); res.end(files[key]); }); }
  };
}
