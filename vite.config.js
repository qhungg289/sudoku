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
				"fonts/Nunito-Black.ttf",
				"fonts/Nunito-Bold.ttf",
				"fonts/Nunito-Regular.ttf",
				"site.webmanifest",
				"favicon.svg",
				"favicon-196.png",
				"manifest-icon-192.maskable.png",
			],
			manifest: false,
			devOptions: {
				enabled: true,
			},
		}),
	],
});
