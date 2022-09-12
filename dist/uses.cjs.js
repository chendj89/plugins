'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vue = require('vue');

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
    let ins = vue.getCurrentInstance() || this;
    return new Promise((resolve, reject) => {
        // 服务器渲染
        if (typeof document !== "undefined") {
            try {
                let container = document.createElement("div");
                let app = vue.createVNode(file, {});
                app.appContext = Object.assign({}, ins.appContext.app._context);
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

exports.useDialog = useDialog;
