window.MyAppAddons = window.MyAppAddons || [];
window.MyAppAddons.push(async function({ threeRenderer, mountPoint, addonBaseUrl }) {
  // プリセットJSON取得
  const jsonUrl = addonBaseUrl + "bgcolor-presets.json";
  let presets = [];
  try {
    const resp = await fetch(jsonUrl);
    if (!resp.ok) throw new Error("プリセットJSONの読込に失敗しました");
    const data = await resp.json();
    presets = data.presets || data;
  } catch (e) {
    presets = [
      { name: "デフォルト", color: "#303030" }
    ];
    console.warn(e);
  }

  // 既存UI削除（重複防止）
  let existing = mountPoint.querySelector("[data-addon='bgcolor-tabs']");
  if (existing) existing.remove();

  // <li>のリスト（背景やUI表示など）を取得
  // 親ulを取得
  const ul = mountPoint.querySelector("ul.MuiList-root");
  if (!ul) {
    console.warn("背景色アドオン: リストセクション(ul)が見つかりません");
    return;
  }

  // 「背景」ボタンの次に挿入したいので、li群を取得
  const lis = ul.querySelectorAll("li,div[role='listitem']");
  // 「背景」リストの直後を探す
  let insertAfter = null;
  for (const li of lis) {
    if (li.textContent && li.textContent.trim().startsWith("背景")) {
      insertAfter = li;
      break;
    }
  }

  // 新しいリスト項目(div[role='listitem'])を作成
  const newItem = document.createElement("div");
  newItem.className = "MuiButtonBase-root MuiListItemButton-root MuiListItemButton-gutters";
  newItem.setAttribute("role", "listitem");
  newItem.setAttribute("tabindex", "0");
  newItem.setAttribute("data-addon", "bgcolor-tabs");

  // アイコン部
  const iconDiv = document.createElement("div");
  iconDiv.className = "MuiListItemIcon-root css-5n5rd1";
  iconDiv.innerHTML = `<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium"
    focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="vertical-align:middle;width:24px;height:24px;">
      <circle cx="12" cy="12" r="10" fill="#888"/>
      <text x="12" y="17" text-anchor="middle" font-size="10" fill="#fff" font-family="sans-serif">色</text>
    </svg>`;
  newItem.appendChild(iconDiv);

  // テキスト部
  const textDiv = document.createElement("div");
  textDiv.className = "MuiListItemText-root css-1tsvksn";
  const span = document.createElement("span");
  span.className = "MuiTypography-root MuiTypography-body1 MuiListItemText-primary css-yb0lig";
  span.textContent = "背景色変更";
  textDiv.appendChild(span);
  newItem.appendChild(textDiv);

  // 色タブUI
  const tabDiv = document.createElement("div");
  tabDiv.style.display = "flex";
  tabDiv.style.flexWrap = "wrap";
  tabDiv.style.margin = "4px 0";
  tabDiv.style.gap = "4px";
  presets.forEach((preset, idx) => {
    const btn = document.createElement("button");
    btn.innerText = preset.name;
    btn.style.background = preset.color;
    btn.style.color = "#fff";
    btn.style.padding = "4px 12px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "13px";
    btn.onclick = () => threeRenderer.setClearColor(preset.color);
    tabDiv.appendChild(btn);
  });
  newItem.appendChild(tabDiv);

  // 「背景」リスト項目の次に挿入
  if (insertAfter && insertAfter.nextSibling) {
    ul.insertBefore(newItem, insertAfter.nextSibling);
  } else {
    ul.appendChild(newItem); // 末尾に追加
  }
});
