// 制限時間（ミリ秒）。ここでは10分（600,000ミリ秒）に設定
const TIME_LIMIT = 1800000;

// 監視用タイマー（1秒ごとにチェック）
setInterval(() => {
  const lastAction = sessionStorage.getItem('lastActionTime');
  if (lastAction) {
    const now = Date.now();
    if (now - lastAction > TIME_LIMIT) {
      // 制限時間を超えた場合、sessionStorageのデータを削除
      sessionStorage.clear();
      alert('制限時間を超えたのでセッションデータを削除しました。');
    }
  }
}, 60000);

// 操作検知（クリックやキー操作など）
function updateActionTime() {
  sessionStorage.setItem('lastActionTime', Date.now());
}

// 例：ページ内の全ての操作を監視
window.addEventListener('click', updateActionTime);
window.addEventListener('keydown', updateActionTime);

// ページが読み込まれたときにタイムスタンプをセット
window.addEventListener('load', updateActionTime);
