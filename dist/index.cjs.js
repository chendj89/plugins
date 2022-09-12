'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var compilerSfc = require('@vue/compiler-sfc');
var vite = require('vite');
var path = require('path');
var fs = require('fs');
var postcss = require('postcss');
var babel = require('@babel/parser');
var vue = require('vue');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespace(path);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var postcss__default = /*#__PURE__*/_interopDefaultLegacy(postcss);
var babel__namespace = /*#__PURE__*/_interopNamespace(babel);

/**
 * 扩展md功能,让md支持图片样式
 * @param md
 * @param opts
 */
function mdImage(md, opts) {
    md.renderer.rules.image = function (tokens, idx, options, env, slf) {
        var token = tokens[idx];
        token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
        let src = token.attrs[token.attrIndex("src")][1];
        if (src.includes("?")) {
            let org = src.split("?");
            token.attrs[token.attrIndex("src")][1] = org[0];
            let style = org[1]
                .replace(/&/g, ";")
                .replace(/=/g, ":")
                .replace(/\%5B/, "(")
                .replace(/\%5D/, ")");
            token.attrs.push(["style", style]);
        }
        return slf.renderToken(tokens, idx, options);
    };
}
/**
 * 扩展md功能,让md支持代码结果
 * @param md
 * @param opts
 */
function mdCode(md, opts) {
    let fence = md.renderer.rules.fence;
    md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
        let token = tokens[idx];
        let infos = token.info.split(" ");
        if (infos.length > 1) {
            token.info = infos[0];
            // 匹配文件格式
            if (token.info.match(/\.?(js|mjs|jsx|ts|tsx)$/)) {
                let result = "";
                try {
                    let content = infos[1] == "run"
                        ? token.content
                        : token.content + "\n " + infos[1];
                    result = eval(content);
                    token.content += "//结果：\n" + result + "\n";
                }
                catch (error) { }
            }
        }
        return fence(tokens, idx, options, env, slf);
    };
}

/**
 * 转换为sfc模式
 * @param code
 * @param id
 * @returns
 */
function parseSFC(code, id) {
    const { descriptor } = compilerSfc.parse(code, { filename: id });
    return descriptor;
}
function transform(code, id, params) {
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
        sfc.scriptSetup = compilerSfc.compileScript(sfc, { id });
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
    let s = new compilerSfc.MagicString(code);
    s.prepend(`<script${lang}>
${tpl.join(";\n")}
</script>\n`);
    return s;
}
/**
 * 定义vue宏
 * @returns
 */
function vitePluginMacros(opts = {}) {
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
                }
                catch (error) {
                    console.log(`viteVueMacro发生错误：${error}`);
                }
            }
            else {
                return code;
            }
        },
    };
}

function getCode(code, opts) {
    let reg1 = /^@\[code\s*(\{\s*[\w,]*\s*\})?\s*\]\(.*\)\s*$/gm;
    let reg2 = /^@\[code\s*(\{\s*[\w,]*\s*\})?\s*\]\((.*)\)$/;
    const result = code.match(reg1);
    //let root = process.cwd();
    let list = [];
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
                        info[2] = info[2].replace(key, opts.alias[key]);
                    });
                }
                // 路径规范化
                info[2] = vite.normalizePath(info[2]);
                // 判断文件是否存在
                if (fs__namespace.existsSync(info[2])) {
                    let content = fs__namespace.readFileSync(info[2], "utf-8");
                    if (content) {
                        // 去除首位空格
                        content = content.replace(/^\s+|\s+$/g, "");
                    }
                    // 获得文件类型
                    let extname = path__namespace.extname(info[2]).replace(".", "");
                    // 方法列表
                    let method = [];
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
                }
                else {
                    console.error(`不存在文件：${info[2]}`);
                }
            }
        });
    }
    list.map((item) => {
        let content = item.content;
        if (["scss", "css", "less", "sass"].includes(item.extname)) {
            content = transformCss(item);
        }
        else if (["js", "ts", "jsx", "tsx"].includes(item.extname)) {
            content = transformJs(item);
        }
        code = code.replace(item.raw, "```" + item.extname + "\n" + content + "\n```");
    });
    return code;
}
/**
 * 获取指定样式内容
 */
function transformCss(info) {
    let ast = postcss__default["default"].parse(info.content);
    let content = info.content;
    if (info.method.length) {
        let contentList = [];
        content = "";
        info.method.map((item) => {
            let methodName = item.trim();
            let strMethod = "";
            ast.nodes.map((cell) => {
                if (cell.selector) {
                    if (cell.selector.includes(methodName)) {
                        strMethod = info.content.slice(cell.source.start.offset, cell.source.end.offset + 1);
                        if (strMethod) {
                            contentList.push(strMethod);
                            strMethod = "";
                        }
                    }
                }
                else if (cell.params) {
                    if (cell.params.includes(methodName)) {
                        strMethod = content.slice(cell.source.start.offset, cell.source.end.offset + 1);
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
function transformJs(info) {
    //
    let ast = babel__namespace.parse(info.content, {
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
        let contentList = [];
        content = "";
        info.method.map((methodName) => {
            methodName = methodName.trim();
            ast.program.body.map((item) => {
                let idName = item.declaration.id.name;
                if (methodName == idName) {
                    let comment = ast.comments?.find((cell) => {
                        return cell.loc.end.line == item.loc?.start.line - 1;
                    });
                    if (comment) {
                        contentList.push(info.content.slice(comment.start, comment.end + 1));
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
function vitePluginCode(opts = {}) {
    return {
        name: "vitePluginCode",
        enforce: "pre",
        transform(code, id) {
            if (id.endsWith(".md")) {
                return getCode(code, opts);
            }
            else {
                return code;
            }
        },
    };
}

/**
 * 使用弹窗-vue3/vue2.7+
 * @param file 单文件组件
 * @param opts 参数
 * @example
 * ```js
 * //主动关闭弹窗
 * this.$close();
 * ```
 */
function useDialog(file, opts) {
    // @ts-ignore
    // let ins: any = getCurrentInstance() || this;
    return new Promise((resolve, reject) => {
        // 服务器渲染
        if (typeof document !== "undefined") {
            try {
                let container = document.createElement("div");
                let app = vue.createVNode(file, {});
                // app.appContext = Object.assign({}, ins.appContext.app._context);
                app.appContext.$close = (result = true) => {
                    // 销毁组件
                    vue.render(null, container);
                    container.parentNode?.removeChild(container);
                    resolve(result);
                };
                vue.render(app, container);
                document.body.appendChild(container);
            }
            catch (error) {
                console.log(error);
            }
        }
    });
}

exports.mdCode = mdCode;
exports.mdImage = mdImage;
exports.useDialog = useDialog;
exports.vitePluginCode = vitePluginCode;
exports.vitePluginMacros = vitePluginMacros;
