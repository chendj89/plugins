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
declare function useDialog(file: any, opts?: any): Promise<unknown>;

export { useDialog };
