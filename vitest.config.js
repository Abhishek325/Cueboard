import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
export default defineConfig({ plugins: [vue()], test: { environment: 'happy-dom', setupFiles: ['./tests/setup.js'], include: ['tests/**/*.test.js'], coverage: { provider: 'v8', include: ['src/lib/**', 'src/services/**', 'src/components/**', 'src/composables/**'] } } });
