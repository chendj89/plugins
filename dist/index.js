'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var cheerio = require('cheerio');
var http = require('http');

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

var cheerio__namespace = /*#__PURE__*/_interopNamespace(cheerio);
var http__namespace = /*#__PURE__*/_interopNamespace(http);

// @ts-ignore
function vitePluginVirtual() {
    const virtualModuleId = "virtual:module";
    const resolvedVirtualModuleId = "\0" + virtualModuleId;
    let obj = {};
    return {
        name: "vitePluginVirtual",
        enforce: "post",
        // @ts-ignore
        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },
        api: {
            // @ts-ignore
            post(key, value) {
                obj[key] = value;
            },
        },
        // @ts-ignore
        load(id) {
            if (id === resolvedVirtualModuleId) {
                return `export const msg = "from virtual module"`;
            }
        },
        // @ts-ignore
        transform(code, id) {
            if (id === resolvedVirtualModuleId) {
                code = `export const msg = ${JSON.stringify(obj)}`;
            }
            return code;
        },
    };
}
async function translation(word) {
    return new Promise((resolve) => {
        http__namespace.get(`http://dict.youdao.com/w/eng/${word}`, (res) => {
            let html = "";
            res.on("data", function (d) {
                html += d.toString();
            });
            res.on("end", function () {
                let $ = cheerio__namespace.load(html);
                let $pronounce = $(".wordbook-js .pronounce");
                // 发音方式
                let $lang = $pronounce.eq(0);
                // 发音方式
                let lang = $lang.clone().children().remove().end().text().trim();
                // 英标
                let soundmark = $lang.find(".phonetic").html();
                // 中文意思
                let desc = $(".trans-container ul li").eq(0).text();
                resolve({
                    name: word,
                    soundmark: soundmark,
                    src: `https://dict.youdao.com/dictvoice?audio=${word}&type=1`,
                    volume: 1,
                    desc: desc,
                    lang: lang,
                    playbackRate: 1,
                    updateTime: new Date().getTime(),
                });
            });
        });
    });
}
function vitePluginEn() {
    let config;
    let virtual;
    return {
        name: "vitePluginEn",
        enforce: "pre",
        configResolved(_config) {
            config = _config;
        },
        resolveId(id) {
            if (id.endsWith("index.md")) {
                virtual = config.plugins.find((item) => {
                    // @ts-ignore
                    return item.name === "vitePluginVirtual";
                });
            }
        },
        async transform(code, id) {
            if (id.endsWith("index.md")) {
                // 获取所有单词
                let words = code.match(/<vp-en[^>]*?>([\s\S]*?)<\/vp-en>/gi);
                for (let i = 0; i < words?.length; i++) {
                    let result = words[i].match(/<vp-en[^>]*?>([\s\S]*?)<\/vp-en>/);
                    if (result) {
                        let en = await translation(result[1]);
                        virtual?.api.post(result[1], en);
                    }
                }
            }
        },
    };
}

exports.vitePluginEn = vitePluginEn;
exports.vitePluginVirtual = vitePluginVirtual;
