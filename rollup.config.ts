import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser";

const currentNodeEnv = process.env.NODE_ENV;
const isCompressLibrary =
  currentNodeEnv === "prod" ? terser({ module: true, toplevel: true }) : null;

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
    plugins: [
      typescript({ compilerOptions: { lib: ["esnext"] } }),
      isCompressLibrary,
    ],
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
];
