import { toValidTailwindVersion } from "./utils/toValidTailwindVersion";
import { processCss } from "./processCss";
import { parseConfig } from "./parseConfig";

let BUILD_ID = 0;
let current;
let tailwindVersion = "2";

export async function compile(event) {
  if (event.data._current) {
    current = event.data._current;
    return;
  }

  const html = event.data.html;
  const css = event.data.css;
  const config = event.data.config;
  if ("tailwindVersion" in event.data) {
    tailwindVersion = toValidTailwindVersion(event.data.tailwindVersion);
  }

  if (event.data._isFreshBuild) {
    BUILD_ID++;
  }

  let buildId = BUILD_ID;

  let configOrError = await parseConfig(config, tailwindVersion);

  if (configOrError._error) {
    return {
      error: {
        message: configOrError._error.message,
        file: "Config",
        line:
          typeof configOrError._error.line === "undefined"
            ? undefined
            : configOrError._error.line,
      },
    };
  }

  try {
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
    );
    return { state, css: compiledCss, html: compiledHtml, jit, buildId };
  } catch (error) {
    if (error.toString().startsWith("CssSyntaxError")) {
      const match = error.message.match(/^.*?:([0-9]+):([0-9]+): (.*?)$/);
      if (match === null) {
        return { error: { message: error.message } };
      } else {
        return { error: { message: match[3], file: "CSS", line: match[1] } };
      }
    } else {
      return { error: { message: error.message } };
    }
  }
}
