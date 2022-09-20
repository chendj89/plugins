import { Plugin, ResolvedConfig } from "vite";
// @ts-ignore
import * as cheerio from "cheerio";
import * as http from "http";
export function vitePluginVirtual(): Plugin {
  const virtualModuleId = "virtual:module";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  let obj: any = {};
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
      post(key: string, value: any) {
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

async function translation(word: string) {
  return new Promise((resolve) => {
    http.get(`http://dict.youdao.com/w/eng/${word}`, (res: any) => {
      let html: string = "";
      res.on("data", function (d: any) {
        html += d.toString();
      });
      res.on("end", function () {
        let $ = cheerio.load(html);
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

export function vitePluginEn(): Plugin {
  let config: ResolvedConfig;
  let virtual: any;
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
        let words = code.match(
          /<vp-en[^>]*?>([\s\S]*?)<\/vp-en>/gi
        ) as Array<any>;
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
