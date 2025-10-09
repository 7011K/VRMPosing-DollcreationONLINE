// 共通UIラッパー関数
window.createAddonModal = function({ title, contentElem, onClose, left, top }) {
  // 既存の同ID UIを消す
  document.querySelectorAll('.addon-mui-paper').forEach(el => el.remove());
  const container = document.createElement("div");
  container.className = "addon-mui-paper";
  container.style.position = "absolute";
  if (typeof left === "number") {
    container.style.left = left + "px";
    container.style.transform = "";
  } else {
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
  }
  container.style.top = (typeof top === "number" ? top : 100) + "px";
  container.style.background = "#222";
  container.style.borderRadius = "12px";
  container.style.boxShadow = "0 4px 24px rgba(0,0,0,0.21)";
  container.style.padding = "0 0 16px 0";
  container.style.zIndex = "9999";
  container.style.color = "#fff";
  container.style.minWidth = "340px";
  container.style.maxWidth = "420px";
  container.style.fontFamily = '"Roboto", "Arial", sans-serif';

  // 閉じるボタン
  const closeBtn = document.createElement("button");
  closeBtn.className = "addon-mui-closebtn";
  closeBtn.innerHTML = "×";
  closeBtn.title = "閉じる";
  closeBtn.onclick = () => {
    container.remove();
    if (typeof onClose === "function") onClose();
  };
  container.appendChild(closeBtn);

  // Material-UI風リスト
  const ul = document.createElement("ul");
  ul.className = "MuiList-root MuiList-padding";
  ul.style.listStyle = "none";
  ul.style.padding = "24px 20px 0 20px";
  ul.style.margin = "0";

  // ヘッダー
  const liHeader = document.createElement("li");
  liHeader.style.fontWeight = "bold";
  liHeader.style.fontSize = "1rem";
  liHeader.style.marginBottom = "18px";
  liHeader.textContent = title;
  ul.appendChild(liHeader);

  // 中身
  const liContent = document.createElement("li");
  if (contentElem) liContent.appendChild(contentElem);
  ul.appendChild(liContent);

  container.appendChild(ul);
  document.body.appendChild(container);
  return container;
};
