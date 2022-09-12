import type { Plugin } from "vite";
import { MagicString, compileScript, parse } from "@vue/compiler-sfc";

/**
 * 转换为sfc模式
 * @param code
 * @param id
 * @returns
 */
function parseSFC(code: string, id: string) {
  const { descriptor } = parse(code, { filename: id });
  return descriptor;
}

function transform(code: string, id: string, params?: any) {
  // 判空
  if (!params || !Object.keys(params).length) {
    return;
  }
  let tpl = [];
  for (const [key, value] of Object.entries(params)) {
    if (code.includes(key)) {
      tpl.push(value);
    }
  }

  if (!tpl.length) {
    return;
  }

  // sfc模式
  const sfc = parseSFC(code, id);
  // 判断是否为setup模式
  if (!sfc.scriptSetup) {
    return;
  }

  // 判断是否有ast
  if (!sfc.scriptSetup.scriptSetupAst) {
    // 转换ast
    sfc.scriptSetup = compileScript(sfc, { id });
  }

  // 普通脚本script setup脚本
  const { script, scriptSetup } = sfc;
  if (script) {
    throw new SyntaxError(`宏定义必须在<script setup>中`);
  }
  // 获得语法方式
  const lang = scriptSetup.attrs.lang
    ? ` lang="${scriptSetup.attrs.lang}"`
    : "";
  let s: MagicString = new MagicString(code);
  s.prepend(`<script${lang}>
${tpl.join(";\n")}
</script>\n`);
  return s;
}

/**
 * 定义vue宏
 * @returns
 */
export default function vitePluginMacros(opts: any = {}): Plugin {
  return {
    name: "vitePluginMacros",
    enforce: "pre",
    transform(code, id, opt) {
      if (id.endsWith(".vue")) {
        try {
          const s = transform(code, id, opts);
          if (!s) {
            return;
          }
          return {
            code: s.toString(),
            get map() {
              return s.generateMap();
            },
          };
        } catch (error) {
          console.log(`viteVueMacro发生错误：${error}`);
        }
      } else {
        return code;
      }
    },
  };
}
