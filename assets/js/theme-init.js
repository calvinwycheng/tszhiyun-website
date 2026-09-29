/* 主题防闪脚本：在首屏渲染前确定 data-theme，避免暗/亮切换时的白屏闪烁 */
(function () {
  try {
    var key = "tszy-theme";
    var saved = localStorage.getItem(key);
    var theme = saved;
    if (!theme) {
      /* 默认浅色商务蓝（主视觉）；用户手动切换后写入 localStorage 记忆 */
      theme = "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
