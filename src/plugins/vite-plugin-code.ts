import type { Plugin } from "vite";
import { normalizePath } from "vite";
import * as path from "path";
import * as fs from "fs";
import postcss from "postcss";
import * as babel from "@babel/parser";
function getCode(code: string, opts: any) {
  let reg1 = /^@\[code\s*(\{\s*[\w,]*\s*\})?\s*\]\(.*\)\s*$/gm;
  let reg2 = /^@\[code\s*(\{\s*[\w,]*\s*\})?\s*\]\((.*)\)$/;
  const result = code.match(reg1);
  //let root = process.cwd();
  let list: any[] = [];
  if (result) {
    result.map((item) => {
      // .trim去除首尾空格和换行
      let info = item.trim().match(reg2);
      if (info) {
        if (opts.alias) {
          // 获得key,默认升序，反转得到降序
          let keys = Object.keys(opts.alias).sort().reverse();
          keys.map((key) => {
            // 转换
            info![2] = info![2].replace(key, opts.alias![key]);
          });
        }
        // 路径规范化
        info[2] = normalizePath(info[2]);
        // 判断文件是否存在
        if (fs.existsSync(info[2])) {
          let content = fs.readFileSync(info[2], "utf-8");
          if (content) {
            // 去除首位空格
            content = content.replace(/^\s+|\s+$/g, "");
          }
          // 获得文件类型
          let extname = path.extname(info[2]).replace(".", "");
          // 方法列表
          let method: string[] = [];
          if (info[1]) {
            method = info[1].replace("{", "").replace("}", "").split(",");
          }
          list.push({
            raw: info[0],
            method: method,
            path: info[2],
            input: info["input"],
            groups: info["groups"],
            content: content,
            extname: extname || "cmd",
          });
        } else {
          console.error(`不存在文件：${info[2]}`);
        }
      }
    });
  }
  list.map((item) => {
    let content = item.content;
    if (["scss", "css", "less", "sass"].includes(item.extname)) {
      content = transformCss(item);
    } else if (["js", "ts", "jsx", "tsx"].includes(item.extname)) {
      content = transformJs(item);
    }
    code = code.replace(
      item.raw,
      "```" + item.extname + "\n" + content + "\n```"
    );
  });
  return code;
}
/**
 * 获取指定样式内容
 */
function transformCss(info: any) {
  let ast = postcss.parse(info.content);
  let content = info.content;
  if (info.method.length) {
    let contentList: any[] = [];
    content = "";
    info.method.map((item: string) => {
      let methodName = item.trim();
      let strMethod = "";
      ast.nodes.map((cell: any) => {
        if (cell.selector) {
          if (cell.selector.includes(methodName)) {
            strMethod = info.content.slice(
              cell.source.start.offset,
              cell.source.end.offset + 1
            );
            if (strMethod) {
              contentList.push(strMethod);
              strMethod = "";
            }
          }
        } else if (cell.params) {
          if (cell.params.includes(methodName)) {
            strMethod = content.slice(
              cell.source.start.offset,
              cell.source.end.offset + 1
            );
            if (strMethod) {
              contentList.push(strMethod);
              strMethod = "";
            }
          }
        }
      });
    });
    // 数组转换为字符串
    content = contentList.join("\n");
  }
  return content;
}
/**
 * 获取指定脚本内容
 */
function transformJs(info: any) {
  //
  let ast = babel.parse(info.content, {
    sourceType: "module",
    attachComment: false,
    tokens: false,
    errorRecovery: false,
    plugins: [
      // enable jsx and flow syntax
      "jsx",
      "flow",
    ],
  });
  let content = info.content;
  if (info.method.length) {
    let contentList: any[] = [];
    content = "";
    info.method.map((methodName: string) => {
      methodName = methodName.trim();
      ast.program.body.map((item: any) => {
        let idName = item.declaration.id.name;
        if (methodName == idName) {
          let comment: any = ast.comments?.find((cell: any) => {
            return cell.loc.end.line == item.loc?.start.line - 1;
          });
          if (comment) {
            contentList.push(
              info.content.slice(comment.start, comment.end + 1)
            );
          }
          contentList.push(info.content.slice(item.start, item.end + 1));
        }
      });
    });
    content = contentList.join("\n");
  }
  return content;
}
/**
 * 支持md，导入代码
 * @param opts
 * @returns
 */
export default function vitePluginCode(opts: any = {}): Plugin {
  return {
    name: "vitePluginCode",
    enforce: "pre",
    transform(code: any, id: string) {
      if (id.endsWith(".md")) {
        return getCode(code, opts);
      } else {
        return code;
      }
    },
  };
}
