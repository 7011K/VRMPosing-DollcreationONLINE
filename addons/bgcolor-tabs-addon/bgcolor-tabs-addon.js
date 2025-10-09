window.MyAppAddons = window.MyAppAddons || [];
window.MyAppAddons.push(function({ threeRenderer, mountPoint, addonBaseUrl }) {
  // UIを生成して表示
  // 下記は元の showAddonInterface の内容
  const ADDON_ID = "addon-bgcolor-tab";
  const COLLAPSE_ID = "addon-bgcolor-collapse";
  function closeAllAddonInterfaces() {
    document.querySelectorAll('[id^="addon-"][id$="-collapse"]').forEach(el => el.remove());
  }
  async function loadGroupedColorsFromJSON() {
    try {
      const response = await fetch(addonBaseUrl + "bgcolor-presets.json");
      if (!response.ok) throw new Error("bgcolor-presets.json の取得に失敗");
      const data = await response.json();
      return Array.isArray(data.groups) ? data.groups : [];
    } catch (error) {
      console.error("[アドオンエラー] 色グループの読み込み失敗:", error);
      return [];
    }
  }
  async function showAddonInterface() {
    closeAllAddonInterfaces();
    const container = document.createElement("div");
    container.id = COLLAPSE_ID;
    container.className = "addon-collapse";
    container.style.padding = "16px";
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "8px";
    container.style.margin = "16px";
    container.style.background = "#f9f9f9";
    const groups = await loadGroupedColorsFromJSON();
    container.innerHTML = `
      <h3 style="margin-bottom:12px;">背景色を変更</h3>
      ${groups.map(group => `
        <fieldset style="margin-bottom:16px; border:1px solid #ddd; padding:8px; border-radius:4px;">
          <legend style="padding:0 8px;">${group.name}</legend>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:8px;">
            ${group.colors.map(({ name, color }) => `
              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" name="bgcolor-choice" value="${color}" style="width:16px; height:16px;">
                <div style="width:32px; height:32px; background:${color}; border:1px solid #ccc;"></div>
                <span>${name}</span>
              </label>
            `).join("")}
          </div>
        </fieldset>
      `).join("")}
      <label style="display:block; margin-bottom:8px;">カスタムカラー:</label>
      <input type="color" id="bgcolor-picker" value="#ffffff" style="width:100%; height:40px;">
    `;
    container.querySelectorAll('input[name="bgcolor-choice"]').forEach(input => {
      input.addEventListener("change", (e) => {
        if (e.target.checked && window._viewer?.scene) {
          window._viewer.scene.background = new THREE.Color(e.target.value);
          container.querySelectorAll('input[name="bgcolor-choice"]').forEach(other => {
            if (other !== e.target) other.checked = false;
          });
        }
      });
    });
    container.querySelector("#bgcolor-picker").addEventListener("input", (e) => {
      if (window._viewer?.scene) {
        window._viewer.scene.background = new THREE.Color(e.target.value);
        container.querySelectorAll('input[name="bgcolor-choice"]').forEach(cb => cb.checked = false);
      }
    });
    document.body.appendChild(container);
  }
  showAddonInterface();
});

