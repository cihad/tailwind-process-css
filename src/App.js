import React, { useEffect } from "react";
import "./style.css";
import { requestResponse } from "./tailwind/utils/workers";
import * as data from "./sampleData";
const worker = new Worker(
  new URL("./tailwind/workers/postcss.worker.js", import.meta.url)
);

export default function App() {
  const frame = React.useRef();
  const [html, setHtml] = React.useState(data.html);
  const [compiled, setCompiled] = React.useState(getHtmlDocument(html, ""));
  const deferredHtml = React.useDeferredValue(html);

  function handleChange(e) {
    console.log(e);
    setHtml(e.target.value);
  }

  React.useEffect(() => {
    async function compile() {
      const res = await requestResponse(worker, {
        ...data,
        html,
      });

      // res = { css, html, jit, canceled, error }
      setCompiled(getHtmlDocument(html, res.css));
    }

    compile();
  }, [deferredHtml]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", gap: 10 }}>
      <div style={{ flex: 1 }}>
        <textarea
          value={html}
          onChange={handleChange}
          style={{ height: "100%", width: "100%" }}
        ></textarea>
      </div>
      <div style={{ flex: 1 }}>
        <iframe
          onLoad={async () => {
            const res = await requestResponse(worker, {
              ...data,
              html,
            });
            setCompiled(getHtmlDocument(html, res.css));
          }}
          ref={frame}
          style={{ height: "100%", width: "100%" }}
          srcDoc={compiled}
        ></iframe>
      </div>
    </div>
  );
}

function getHtmlDocument(html, css) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style id="compiled-css">
      ${css}
    </style>
  </head>
  <body>
    ${html}
  </body>
  </html>`;
}
