// ./addons/bgcolor-presets/bgcolor-tabs-addon.js

window.MyAppAddons = window.MyAppAddons || [];
window.MyAppAddons.push(async function({ threeRenderer, mountPoint, addonBaseUrl }) {
  // ESM: import.meta.url から自分のディレクトリを取得
  const baseUrl = addonBaseUrl || (import.meta.url.replace(/[^/]*$/, ''));
  const jsonUrl = baseUrl + "bgcolor-presets.json";

  // JSONファイルからプリセット色を取得
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
  let tabDiv = mountPoint.querySelector("[data-addon='bgcolor-tabs']");
  if (tabDiv) tabDiv.remove();
  tabDiv = document.createElement("div");
  tabDiv.style.margin = "8px 0";
  tabDiv.setAttribute("data-addon", "bgcolor-tabs");

  presets.forEach((preset, idx) => {
    const btn = document.createElement("button");
    btn.innerText = preset.name;
    btn.style.background = preset.color;
    btn.style.color = "#fff";
    btn.style.marginRight = "4px";
    btn.style.border = "none";
    btn.style.padding = "4px 12px";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.onclick = () => threeRenderer.setClearColor(preset.color);
    tabDiv.appendChild(btn);
  });

  mountPoint.appendChild(tabDiv);
});
