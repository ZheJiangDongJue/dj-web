/**
 *
 * Android WebView 桥接相关的全局类型声明。
 * 说明：
 * - Android 侧通过 webView.addJavascriptInterface(this, "android") 暴露对象名为 `window.android`
 * - 原生会调用 `window.WebMethods.*`，因此需要在前端定义该对象
 * - 为了兼容原生使用的 `window[callbackId](result)` 回调方式，Window 允许动态属性访问
 *
 */

export {};

declare global {
  /**
   *
   * Android 注入到 JS 的桥接对象（对象名：window.android）。
   * 注意：该接口是由原生注入的，前端仅做类型声明；运行时需判断其是否存在。
   *
   */
  interface AndroidBridgeObject {
    /**
     *
     * 接收来自 Web 的消息（JSON 字符串）。
     * 约定：{"action": string, "data"?: object, "callbackId": string}
     *
     */
    receiveMessage: (messageJson: string) => void;

    /**
     *
     * 提供给原生回调 Web 的方法（原生会在 JS 侧调用）。
     * 仅在原生主动拉取信息（如 getPageInfo -> nativeCallback）时使用。
     *
     */
    nativeCallback?: (callbackId: string, resultJson: string) => void;

    /**
     *
     * JS 主动通知原生“桥接已准备好”。
     * 原生收到后会再次向 Web 发送 bridgeReady 通知。
     *
     */
    onBridgeReady?: () => void;
  }

  /**
   *
   * 原生期望 Web 提供的对象，供原生回调（通过 evaluateJavascript 调用）。
   *
   */
  interface WebMethodsObject {
    /**
     *
     * 统一的事件通知入口。
     * 约定：type 如 'bridgeReady' | 'networkChanged' | 'appResumed' | 'appPaused' | 'scanResult'
     *
     */
    handleNotification: (type: string, data?: unknown) => void;

    /**
     * 原生请求当前网页处理返回键。
     * 返回 true 表示网页已接管，false 表示原生需要执行兜底逻辑。
     */
    handleBack?: () => boolean;

    /**
     *
     * 原生请求刷新 Web 数据（参数定义由业务决定）。
     *
     */
    refreshData: (params?: unknown) => unknown;

    /**
     *
     * 原生查询当前页面信息。
     *
     */
    getPageInfo: () => {
      path: string;
      query: string;
      title: string;
      url: string;
    };

    /**
     *
     * 可选：登出动作，由业务实现。
     *
     */
    logout?: () => void;
  }

  /**
   *
   * Android 桥接通用结果类型。
   *
   */
  interface AndroidBridgeResult {
    success: boolean;
    message?: string;
    [key: string]: unknown;
  }

  interface Window {
    android?: AndroidBridgeObject;
    WebMethods?: WebMethodsObject;
    /**
     *
     * 为兼容原生回调 window[callbackId](...) 的动态命名方式，允许任意索引。
     *
     */
    [key: string]: unknown; // 动态附加回调函数
  }
}
