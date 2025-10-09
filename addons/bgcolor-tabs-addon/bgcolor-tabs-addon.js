window.MyAppAddons = window.MyAppAddons || [];
window.MyAppAddons.push(function({ threeRenderer, mountPoint, addonBaseUrl }) {
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
  async function showAddonInterface(left, top) {
    const groups = await loadGroupedColorsFromJSON();

    // 中身エリア作成
    const content = document.createElement("div");
    content.style.width = "100%";
    content.innerHTML = `
      ${groups.map(group => `
        <fieldset style="background:#292929;margin-bottom:16px;border:1px solid #444;padding:12px;border-radius:8px;">
          <legend style="color:#fff;font-size:14px;font-weight:bold;margin-bottom:8px;">${group.name}</legend>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));gap:8px;">
            ${group.colors.map(({ name, color }) => `
              <label style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" name="bgcolor-choice" value="${color}" style="width:16px;height:16px;">
                <div style="width:32px;height:32px;background:${color};border:1px solid #ccc;border-radius:6px;"></div>
                <span>${name}</span>
              </label>
            `).join("")}
          </div>
        </fieldset>
      `).join("")}
      <label style="display:block;margin-bottom:8px;">カスタムカラー:</label>
      <input type="color" id="bgcolor-picker" value="#ffffff" style="width:100%;height:40px;border-radius:6px;background:#333;">
    `;

    // チェックボックス挙動
    content.querySelectorAll('input[name="bgcolor-choice"]').forEach(input => {
      input.addEventListener("change", (e) => {
        if (e.target.checked && window._viewer?.scene) {
          window._viewer.scene.background = new THREE.Color(e.target.value);
          content.querySelectorAll('input[name="bgcolor-choice"]').forEach(other => {
            if (other !== e.target) other.checked = false;
          });
        }
      });
    });
    // カラーピッカー挙動
    content.querySelector("#bgcolor-picker").addEventListener("input", (e) => {
      if (window._viewer?.scene) {
        window._viewer.scene.background = new THREE.Color(e.target.value);
        content.querySelectorAll('input[name="bgcolor-choice"]').forEach(cb => cb.checked = false);
      }
    });

    // 共通UIラッパーで表示
    window.createAddonModal({
      title: "背景色を変更",
      contentElem: content,
      left, top // ★ボタン座標を渡す場合はここで
    });
  }

  // ★ボタン座標を取得して表示したい場合、外からshowAddonInterface(left, top)で呼ぶ
  // ここでは中央表示
  showAddonInterface();
});
