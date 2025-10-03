window.MyAppAddons = window.MyAppAddons || [];

window.MyAppAddons.push(function () {
  const ADDON_ID = "addon-bgcolor-tab";
  const COLLAPSE_ID = "addon-bgcolor-collapse";
  const SETTINGS_BUTTON_SELECTOR = ".MuiIconButton-root.css-1egpgfe";
  const TAB_LABEL = "背景色変更";

  function findUI表示Tab() {
    const tabs = Array.from(document.querySelectorAll('[role="listitem"]'));
    const match = tabs.find(el => el.textContent.includes("UI表示"));
    if (!match) {
      console.error("[アドオンエラー] 「UI表示」タブが見つかりません。");
    }
    return match;
  }

  function createClonedTab(referenceTab) {
    if (!referenceTab) {
      console.error("[アドオンエラー] 複製元が null です。");
      return null;
    }

    const cloned = referenceTab.cloneNode(true);
    cloned.id = ADDON_ID;

    const labelSpan = cloned.querySelector('.MuiListItemText-primary');
    if (labelSpan) {
      labelSpan.textContent = TAB_LABEL;
    } else {
      console.warn("[アドオン警告] ラベル要素が見つかりません。");
    }

    const expandIcon = cloned.querySelector('svg[data-testid]');
    if (expandIcon) {
      expandIcon.innerHTML = `<path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>`;
    }

    cloned.addEventListener("click", () => {
      const collapse = document.getElementById(COLLAPSE_ID);
      if (collapse) {
        collapse.remove();
        console.log("[DEBUG] Collapse領域を削除しました");
      } else {
        insertCollapseContent(cloned);
        console.log("[DEBUG] Collapse領域を追加しました");
      }
    });

    return cloned;
  }

  function insertCollapseContent(afterElement) {
    const collapse = document.createElement("div");
    collapse.id = COLLAPSE_ID;
    collapse.className = "MuiCollapse-root MuiCollapse-vertical";
    collapse.style.transitionDuration = "237ms";

    collapse.innerHTML = `
      <div class="MuiCollapse-wrapper MuiCollapse-vertical">
        <div class="MuiCollapse-wrapperInner MuiCollapse-vertical" style="padding: 8px 16px;">
          <label style="display:block; margin-bottom:8px;">背景色を選択:</label>
          <input type="color" id="bgcolor-picker" value="#ffffff" style="width:100%; height:40px;">
        </div>
      </div>
    `;

    collapse.querySelector("#bgcolor-picker").addEventListener("input", (e) => {
      document.body.style.backgroundColor = e.target.value;
    });

    afterElement.parentNode.insertBefore(collapse, afterElement.nextSibling);
  }

  function insertAddonTab() {
    if (document.getElementById(ADDON_ID)) {
      console.log("[DEBUG] 背景色変更タブは既に存在しています");
      return;
    }

    const referenceTab = findUI表示Tab();
    if (!referenceTab) return;

    const clonedTab = createClonedTab(referenceTab);
    if (!clonedTab) {
      console.error("[アドオンエラー] タブの複製に失敗しました。");
      return;
    }

    const parent = referenceTab.parentNode;
    if (!parent) {
      console.error("[アドオンエラー] 複製元の親要素が見つかりません。");
      return;
    }

    try {
      parent.insertBefore(clonedTab, referenceTab.nextSibling);
      console.log("[DEBUG] 背景色変更タブを挿入しました");
      adjustAddonPosition();
    } catch (e) {
      console.error("[アドオンエラー] insertBefore に失敗:", e);
    }
  }

  function removeAddonTab() {
    document.getElementById(ADDON_ID)?.remove();
    document.getElementById(COLLAPSE_ID)?.remove();
  }

  function adjustAddonPosition() {
    const addonTab = document.getElementById(ADDON_ID);
    if (!addonTab) return;

    const expandedSections = Array.from(document.querySelectorAll(".MuiCollapse-wrapperInner"))
      .filter(el => el.offsetHeight > 0);

    const totalOffset = expandedSections.reduce((sum, el) => sum + el.offsetHeight, 0);
    addonTab.style.marginTop = `${totalOffset}px`;
  }

  function isSettingsPanelVisible() {
    const settingsButton = document.querySelector(SETTINGS_BUTTON_SELECTOR);
    const expanded = settingsButton?.getAttribute("aria-expanded") === "true";
    console.log("[DEBUG] 環境設定ボタンの展開状態:", expanded);
    return expanded;
  }

  const observer = new MutationObserver(() => {
    console.log("[DEBUG] DOM変化を検知");

    if (isSettingsPanelVisible()) {
      insertAddonTab();
    } else {
      removeAddonTab();
    }

    adjustAddonPosition();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("[DEBUG] MutationObserverを開始");
});
