import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defaultSiteUrl, siteUrl, pages, metadata, discoveryFiles, discoveryPlugin } from '../site/discovery.mjs';
// These checks inspect document semantics; do not load stylesheets or run the app.
const parseHtml = html => new DOMParser().parseFromString(html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, '').replace(/<script\b[^>]*src=[\s\S]*?<\/script>/g, ''), 'text/html');

test('public HTML describes the real product before JavaScript and keeps workspace data out', () => {
  const html = discoveryPlugin().transformIndexHtml.handler(readFileSync(resolve('index.html'), 'utf8'));
  const doc = parseHtml(html);
  expect(doc.title).toContain('Content Planner for YouTube');
  expect(doc.querySelector('#about-heading').textContent).toContain('YouTube and Instagram');
  expect(doc.querySelector('#about-cueboard').closest('dialog').hasAttribute('open')).toBe(false);
  expect(doc.querySelector('.discovery-footer')).toBeNull();
  expect(doc.querySelector('[data-about-open]')).toBeNull();
  expect(doc.querySelector('#cueboard-about').getAttribute('aria-labelledby')).toBe('about-dialog-title');
  expect(doc.querySelector('#app').children).toHaveLength(0);
  expect(doc.querySelector('#app').hasAttribute('data-nosnippet')).toBe(true);
  expect(html).not.toMatch(/cueboard:metadata|cueboard:public-content|AIza|ya29\./);
  expect(doc.querySelector('link[rel="canonical"]').href).toBe(defaultSiteUrl);
  const graph = JSON.parse(doc.querySelector('[type="application/ld+json"]').textContent)['@graph'];
  expect(graph.find(item => item['@type'] === 'WebApplication').isAccessibleForFree).toBe(true);
  expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|reviewCount|ratingValue/);
});

test('discovery URLs match real static pages and never advertise hash routes as indexable pages', () => {
  const files = discoveryFiles();
  const sitemap = new DOMParser().parseFromString(files['sitemap.xml'], 'application/xml');
  expect([...sitemap.querySelectorAll('loc')].map(x => x.textContent)).toEqual(pages.map(p => defaultSiteUrl + p.path));
  expect(files['sitemap.xml']).not.toContain('#');
  for (const page of pages.slice(1)) {
    const doc = parseHtml(files[page.path + 'index.html']);
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('main').textContent.length).toBeGreaterThan(1000);
    expect(doc.querySelector('link[rel="canonical"]').href).toBe(defaultSiteUrl + page.path);
    expect(doc.querySelector('meta[property="og:url"]').content).toBe(defaultSiteUrl + page.path);
  }
  expect(files['llms.txt']).toContain('not a crawler permission file');
  // A project-path robots.txt is not effective at the github.io host root.
  expect(files['robots.txt']).toBeUndefined();
});

test('a different deployment URL changes canonical, schema, sitemap and preview URLs together', () => {
  const base = 'https://example.com/planner/';
  expect(siteUrl('https://example.com/planner')).toBe(base);
  expect(metadata(pages[0], base)).not.toContain(defaultSiteUrl);
  expect(discoveryFiles(base)['sitemap.xml']).toContain(base + 'guide/');
  for (const url of ['http://example.com/', 'https://user:password@example.com/', 'https://example.com/?secret=1', 'https://example.com/#/']) expect(() => siteUrl(url)).toThrow();
});
