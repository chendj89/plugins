import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
export default [
  {
    input: "./src/index.ts",
    output: [
      {
        file: "dist/index.umd.js",
        format: "umd",
        name: "index",
      },
      { file: "dist/index.es.js", name: "index", format: "es" },
      { file: "dist/index.cjs.js", name: "index", format: "cjs" },
    ],
    plugins: [typescript({ compilerOptions: { lib: ["esnext"] } })],
    watch: {
      include: "src/**",
      exclude: "node_modules/**",
    },
  },
  {
    input: "./src/uses/index.ts",
    output: [
      {
        file: "dist/uses/index.umd.js",
        format: "umd",
        name: "uses",
      },
      { file: "dist/uses/index.es.js", name: "uses", format: "es" },
      { file: "dist/uses/index.cjs.js", name: "uses", format: "cjs" },
    ],
    plugins: [typescript({ compilerOptions: { lib: ["esnext"] } })],
    watch: {
      include: "src/**",
      exclude: "node_modules/**",
    },
  },
  {
    input: "./src/index.ts",
    output: [{ file: `dist/index.d.ts`, format: "esm" }],
    plugins: [dts()],
  },
  {
    input: "./src/uses/index.ts",
    output: [{ file: `dist/uses/index.d.ts`, format: "esm" }],
    plugins: [dts()],
  },
];
