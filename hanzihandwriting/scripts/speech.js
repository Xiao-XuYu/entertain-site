// 汉字读音：浏览器语音合成
window.speakZh = function speak(t) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'zh-CN'; u.rate = .8;
    speechSynthesis.speak(u);
  } catch (e) {}
};