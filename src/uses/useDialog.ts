import { createVNode, render } from "vue";

declare const document: any;

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
export default function useDialog(file: any, opts?: any) {
  // @ts-ignore
  // let ins: any = getCurrentInstance() || this;
  return new Promise((resolve, reject) => {
    // 服务器渲染
    if (typeof document !== "undefined") {
      try {
        let container = document.createElement("div");
        let app: any = createVNode(file, {});
        // app.appContext = Object.assign({}, ins.appContext.app._context);
        app.appContext.$close = (result: any = true) => {
          // 销毁组件
          render(null, container);
          container.parentNode?.removeChild(container);
          resolve(result);
        };
        render(app, container);
        document.body.appendChild(container);
      } catch (error) {
        console.log(error);
      }
    }
  });
}
