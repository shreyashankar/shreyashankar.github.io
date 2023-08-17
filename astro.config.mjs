import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify/edge-functions';

// https://astro.build/config
export default defineConfig({
	site: 'https://shreya-shankar.com',
	integrations: [mdx(), sitemap()],
	output: 'server',
	adapter: netlify(),
});
