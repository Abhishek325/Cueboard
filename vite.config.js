import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { discoveryPlugin } from './site/discovery.mjs';
export default defineConfig({ plugins: [vue(), discoveryPlugin()], base: './', build: { sourcemap: false } });
