/**
 * 扩展md功能,让md支持图片样式
 * @param md
 * @param opts
 */
export function mdImage(md: any, opts?: any) {
  md.renderer.rules.image = function (
    tokens: any,
    idx: any,
    options: any,
    env: any,
    slf: any
  ) {
    var token = tokens[idx];
    token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(
      token.children,
      options,
      env
    );
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
export function mdCode(md: any, opts?: any) {
  let fence = md.renderer.rules.fence;
  md.renderer.rules.fence = function (
    tokens: any,
    idx: any,
    options: any,
    env: any,
    slf: any
  ) {
    let token = tokens[idx];
    let infos = token.info.split(" ");
    if (infos.length > 1) {
      token.info = infos[0];
      // 匹配文件格式
      if (token.info.match(/\.?(js|mjs|jsx|ts|tsx)$/)) {
        let result = "";
        try {
          let content =
            infos[1] == "run"
              ? token.content
              : token.content + "\n " + infos[1];
          result = eval(content);
          token.content += "//结果：\n" + result + "\n";
        } catch (error) {}
      }
    }
    return fence(tokens, idx, options, env, slf);
  };
}
