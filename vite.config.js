import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [
				"fonts/*.ttf",
				"site.webmanifest",
				"favicon.svg",
				"favicon-196.png",
			],
			manifest: false,
		}),
	],
});
