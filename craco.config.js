const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const { createLoader } = require("simple-functional-loader");
const path = require("path");
const fs = require("fs");

const externals = {
  "fs-extra": "self.fsextra",
  resolve: "self.resolve",
  "fs.realpath": "self.fsrealpath",
  purgecss: "self.purgecss",
  chokidar: "self.chokidar",
  tmp: "self.tmp",
  "vscode-emmet-helper-bundled": "null",
};

const moduleOverrides = {
  colorette: path.resolve(__dirname, "src/tailwind/modules/colorette.js"),
  fs: path.resolve(__dirname, "src/tailwind/modules/fs.js"),
  "is-glob": path.resolve(__dirname, "src/tailwind/modules/is-glob.js"),
  "glob-parent": path.resolve(__dirname, "src/tailwind/modules/glob-parent.js"),
  "fast-glob": path.resolve(__dirname, "src/tailwind/modules/fast-glob.js"),
};

function getExternal({ context, request }, callback) {
  if (/node_modules/.test(context) && externals[request]) {
    return callback(null, externals[request]);
  }
  callback();
}

const files = [
  {
    pattern: /modern-normalize/,
    file: require.resolve("modern-normalize"),
  },
  {
    pattern: /normalize/,
    file: require.resolve("normalize.css"),
  },
  {
    pattern: /preflight/,
    tailwindVersion: 1,
    file: path.resolve(
      __dirname,
      "node_modules/tailwindcss-v1/lib/plugins/css/preflight.css"
    ),
  },
  {
    pattern: /preflight/,
    tailwindVersion: 2,
    file: path.resolve(
      __dirname,
      "node_modules/tailwindcss-v2/lib/plugins/css/preflight.css"
    ),
  },
  {
    pattern: /preflight/,
    tailwindVersion: 3,
    file: path.resolve(
      __dirname,
      "node_modules/tailwindcss/lib/css/preflight.css"
    ),
  },
  {
    pattern: /preflight/,
    tailwindVersion: "insiders",
    file: path.resolve(
      __dirname,
      "node_modules/tailwindcss-insiders/lib/css/preflight.css"
    ),
  },
];

function createReadFileReplaceLoader(tailwindVersion) {
  return createLoader(function (source) {
    return source.replace(
      /_fs\.default\.readFileSync\(.*?(['"])utf8\1\)/g,
      (m) => {
        for (let i = 0; i < files.length; i++) {
          if (
            files[i].pattern.test(m) &&
            (!files[i].tailwindVersion ||
              files[i].tailwindVersion === tailwindVersion)
          ) {
            return JSON.stringify(fs.readFileSync(files[i].file, "utf8"));
          }
        }
        return m;
      }
    );
  });
}

module.exports = {
  webpack: {
    plugins: {
      add: [
        new NodePolyfillPlugin({
          excludeAliases: ["console"],
        }),
      ],
    },
    configure: (config, { env, paths }) => {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        ...moduleOverrides,
        "nanoid/non-secure": require.resolve("nanoid/non-secure"),
      };

      if (config.externals) {
        config.externals.push(getExternal);
      } else {
        config.externals = [getExternal];
      }

      config.module.rules.push({
        test: require.resolve("tailwindcss-v1/lib/plugins/preflight.js"),
        use: [createReadFileReplaceLoader(1)],
      });

      config.module.rules.push({
        test: require.resolve("tailwindcss-v2/lib/plugins/preflight.js"),
        use: [createReadFileReplaceLoader(2)],
      });

      config.module.rules.push({
        test: require.resolve("tailwindcss/lib/corePlugins.js"),
        use: [createReadFileReplaceLoader(3)],
      });

      config.module.rules.push({
        test: require.resolve("tailwindcss-insiders/lib/corePlugins.js"),
        use: [createReadFileReplaceLoader("insiders")],
      });

      config.module.rules.push({
        resourceQuery: /fields/,
        use: createLoader(function (source) {
          let fields = new URLSearchParams(this.resourceQuery)
            .get("fields")
            .split(",");

          let res = JSON.stringify(JSON.parse(source), (key, value) => {
            if (["", ...fields].includes(key)) {
              if (key === "main") {
                return path.relative(
                  path.resolve(__dirname, "node_modules"),
                  path.resolve(path.dirname(this.resourcePath), value)
                );
              }
              return value;
            }
            return undefined;
          });

          return res;
        }),
      });

      let browsers = require("browserslist")([
        "> 1%",
        "not edge <= 18",
        "not ie 11",
        "not op_mini all",
      ]);

      config.module.rules.push({
        test: require.resolve("browserslist"),
        use: [
          createLoader(function (_source) {
            return `
              module.exports = () => (${JSON.stringify(browsers)})
            `;
          }),
        ],
      });

      config.module.rules.push({
        test: require.resolve("caniuse-lite/dist/unpacker/index.js"),
        use: [
          createLoader(function (_source) {
            let agents = require("caniuse-lite/dist/unpacker/agents.js").agents;

            for (let name in agents) {
              for (let key in agents[name]) {
                if (key !== "prefix" && key !== "prefix_exceptions") {
                  delete agents[name][key];
                }
              }
            }

            let features = require("caniuse-lite").feature(
              require("caniuse-lite/data/features/css-featurequeries.js")
            );

            return `
              export const agents = ${JSON.stringify(agents)}
              export function feature() {
                return ${JSON.stringify(features)}
              }
            `;
          }),
        ],
      });

      config.module.rules.push({
        test: require.resolve("autoprefixer/data/prefixes.js"),
        use: [
          createLoader(function (_source) {
            let result = require("autoprefixer/data/prefixes.js");

            for (let key in result) {
              result[key].browsers = result[key].browsers.filter((b) =>
                browsers.includes(b)
              );
              if (result[key].browsers.length === 0) {
                delete result[key];
              }
            }

            return `module.exports = ${JSON.stringify(result)}`;
          }),
        ],
      });

      fs.writeFileSync(
        path.resolve(__dirname, "./webpack.conf.json"),
        JSON.stringify(config, null, 2)
      );

      return config;
    },
  },
};
