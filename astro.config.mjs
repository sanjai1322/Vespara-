import { defineConfig } from 'astro/config';

// VESPERA — static marketing site. No UI framework integrations.
export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
});
