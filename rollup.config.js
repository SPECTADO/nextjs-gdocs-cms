import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

import packageJson from "./package.json";

const BASE_UMD = {
  format: "umd",
  name: "nextjs-gdocs-cms",
  globals: {
    dayjs: "dayjs",
    "url-slug": "url-slug",
    "node-html-markdown": "NodeHtmlMarkdown",
    "lodash/isEmpty": "isEmpty",
    "csv-parse/lib/sync": "CsvParser",
  },
};

const external = [
  "dayjs",
  "url-slug",
  "lodash/isEmpty",
  "node-html-markdown",
  "csv-parse/lib/sync",
];

export default [
  {
    input: "src/index.js",
    output: [{ file: packageJson.main, ...BASE_UMD }],
    external,
  },
  {
    input: "src/index.js",
    output: [
      { file: packageJson.main.replace(/\.js$/, ".min.js"), ...BASE_UMD },
    ],
    plugins: [
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      }),
      terser(),
    ],
    external,
  },
];
