const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,svelte}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Nunito", ...defaultTheme.fontFamily.sans],
			},
			screens: {
				betterhover: { raw: "(hover: hover)" },
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
};
