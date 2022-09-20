// import common from "@rollup/plugin-commonjs";
// import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
    },
    plugins: [ typescript()],
    external: ["vite", "cheerio","http"],
  },
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.mjs",
        format: "esm",
      },
    ],
    plugins: [ typescript()],
    external: ["vite", "cheerio","http"],
  },
];
