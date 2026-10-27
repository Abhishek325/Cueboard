import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { discoveryPlugin } from './site/discovery.mjs';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [vue(), discoveryPlugin({ siteUrl: env.SITE_URL, googleVerification: env.GOOGLE_SITE_VERIFICATION, bingVerification: env.BING_SITE_VERIFICATION })], base: './', build: { sourcemap: false } };
});
