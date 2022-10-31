let plugins = {
	"@tailwindcss/custom-forms": require("@tailwindcss/custom-forms/package.json?fields=version,main"),
	"@tailwindcss/forms": require("@tailwindcss/forms/package.json?fields=version,main"),
	"@tailwindcss/typography": require("@tailwindcss/typography/package.json?fields=version,main"),
	"@tailwindcss/ui": require("@tailwindcss/ui/package.json?fields=version,main"),
	"@tailwindcss/line-clamp": require("@tailwindcss/line-clamp/package.json?fields=version,main"),
	"@tailwindcss/aspect-ratio": require("@tailwindcss/aspect-ratio/package.json?fields=version,main"),
}

let v3Plugins = {
	...plugins,
	"@tailwindcss/forms": require("@tailwindcss/forms-next/package.json?fields=version,main"),
	"@tailwindcss/line-clamp": require("@tailwindcss/line-clamp-next/package.json?fields=version,main"),
	"@tailwindcss/typography": require("@tailwindcss/typography-next/package.json?fields=version,main"),
}

export const PLUGIN_BUILDER_VERSION = "6"
export const VIRTUAL_SOURCE_PATH = "/sourcePath"
export const VIRTUAL_HTML_FILENAME = "/htmlInput"
export const PLUGINS = {
	1: plugins,
	2: plugins,
	3: v3Plugins,
	insiders: v3Plugins,
}
