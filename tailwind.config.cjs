/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,svelte}"],
	theme: {
		extend: {
			fontFamily: {
				"ibm-plex-mono": ["IBM Plex Mono", "monospace"],
			},
			screens: {
				betterhover: { raw: "(hover: hover)" },
			},
		},
	},
	plugins: [],
};
