export async function postcss(event) {
	const html = event.data._recompile ? lastHtml : event.data.html
	const css = event.data._recompile ? lastCss : event.data.css
	const config = event.data._recompile ? lastConfig : event.data.config

	const isFreshBuild = !event.data.transient

	lastHtml = html
	lastCss = css
	lastConfig = config

	const result = await processCss({
		...event.data,
		skipIntelliSense: state ? event.data.skipIntelliSense : false,
		_isFreshBuild: isFreshBuild,
		html,
		css,
		config,
	})

	if (!result.error && !result.canceled) {
		if ("buildId" in result) {
			self.BUILD_ID = result.buildId
		}
		if (result.state) {
			let tailwindVersion = toValidTailwindVersion(
				event.data.tailwindVersion
			)
			let [
				{ default: postcss },
				{ default: postcssSelectorParser },
				{ generateRules },
				{ createContext },
				{ default: expandApplyAtRules },
				{ default: resolveConfig },
			] = await Promise.all([
				import("postcss"),
				import("postcss-selector-parser"),
				result.state.jit
					? deps.generateRules[tailwindVersion]?.() ?? {}
					: {},
				result.state.jit
					? deps.setupContextUtils[tailwindVersion]?.() ?? {}
					: {},
				result.state.jit
					? deps.expandApplyAtRules[tailwindVersion]?.() ?? {}
					: {},
				deps.resolveConfig[tailwindVersion]?.() ?? {},
				result.state.jit
					? deps.setupTrackingContext[tailwindVersion]?.() ?? {}
					: {},
			])

			state = result.state
			state.modules = {
				postcss: { module: postcss },
				postcssSelectorParser: { module: postcssSelectorParser },
				...(result.state.jit
					? {
							jit: {
								generateRules: {
									module: generateRules,
								},
								expandApplyAtRules: {
									module: expandApplyAtRules,
								},
							},
					  }
					: {}),
			}
			state.config = resolveConfig(
				await parseConfig(config, tailwindVersion)
			)
			if (result.state.jit) {
				state.jitContext = createContext(state.config)
				if (state.jitContext.getClassList) {
					state.classList = state.jitContext
						.getClassList()
						.filter((className) => className !== "*")
						.map((className) => {
							return [
								className,
								{ color: getColor(state, className) },
							]
						})
				}
			}
		}
		state.variants = getVariants(state)
		state.screens = isObject(state.config.theme.screens)
			? Object.keys(state.config.theme.screens)
			: []
		state.editor.readDirectory = () => []
		state.editor.getConfiguration = () => ({
			editor: {
				tabSize: 2,
			},
			tailwindCSS: {
				validate: true,
				classAttributes: ["class"],
				lint: {
					cssConflict: "warning",
					invalidApply: "error",
					invalidScreen: "error",
					invalidVariant: "error",
					invalidConfigPath: "error",
					invalidTailwindDirective: "error",
					recommendedVariantOrder: "warning",
				},
				experimental: {
					classRegex: [],
				},
			},
		})
		state.enabled = true
		postMessage({
			_id: event.data._id,
			css: result.css,
			html: result.html,
			jit: result.jit,
		})
	} else {
		postMessage({ ...result, _id: event.data._id })
	}
}
