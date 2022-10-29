import React from "react"
import "./style.css"
import { processCss } from "./tailwind/processCss"
import { html, css } from "./sampleData"
import { parseConfig } from "./tailwind/parseConfig"

let BUILD_ID = 0
let tailwindVersion = "2"

function getEvent() {
	return {
		data: { html, css },
	}
}

const compile = async function () {
	const event = getEvent()
	const html = event.data.html
	const css = event.data.css
	const config = event.data.config
	if ("tailwindVersion" in event.data) {
		tailwindVersion = toValidTailwindVersion(event.data.tailwindVersion)
	}

	if (event.data._isFreshBuild) {
		BUILD_ID++
	}

	let buildId = BUILD_ID

	// function respond(data) {
	//   setTimeout(() => {
	//     if (event.data._id === current) {
	//       postMessage({ _id: event.data._id, ...data });
	//     } else {
	//       postMessage({ _id: event.data._id, canceled: true });
	//     }
	//   }, 0);
	// }

	let configOrError = await parseConfig(config, tailwindVersion)

	// if (configOrError._error) {
	//   return respond({
	//     error: {
	//       message: configOrError._error.message,
	//       file: 'Config',
	//       line:
	//         typeof configOrError._error.line === 'undefined'
	//           ? undefined
	//           : configOrError._error.line,
	//     },
	//   });
	// }

	const {
		css: compiledCss,
		html: compiledHtml,
		state,
		jit,
	} = await processCss(
		configOrError,
		html,
		css,
		tailwindVersion,
		event.data.skipIntelliSense
	)

	console.log({
		css: compiledCss,
		html: compiledHtml,
		state,
		jit,
	})
}

compile()

export default function App() {
	return (
		<div>
			<h1>Hello StackBlitz!</h1>
			<p>Start editing to see some magic happen :)</p>
		</div>
	)
}
