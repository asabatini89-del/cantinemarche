// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://cantinedellemarche.com',
  output: 'server',
  adapter: cloudflare(),
  trailingSlash: 'never',
  vite: { plugins: [tailwindcss()] },
});
