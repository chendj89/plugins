import { Plugin } from 'vite';

/**
 * 扩展md功能,让md支持图片样式
 * @param md
 * @param opts
 */
declare function mdImage(md: any, opts?: any): void;
/**
 * 扩展md功能,让md支持代码结果
 * @param md
 * @param opts
 */
declare function mdCode(md: any, opts?: any): void;

/**
 * 定义vue宏
 * @returns
 */
declare function vitePluginMacros(opts?: any): Plugin;

/**
 * 支持md，导入代码
 * @param opts
 * @returns
 */
declare function vitePluginCode(opts?: any): Plugin;

export { mdCode, mdImage, vitePluginCode, vitePluginMacros };
