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
				"fonts/Nunito-Black.woff",
				"fonts/Nunito-Bold.woff",
				"fonts/Nunito-Regular.woff",
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
