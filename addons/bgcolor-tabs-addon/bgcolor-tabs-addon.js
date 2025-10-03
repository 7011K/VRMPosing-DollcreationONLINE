window.MyAppAddons = window.MyAppAddons || [];

window.MyAppAddons.push(function () {
  const ADDON_ID = "addon-bgcolor-tab";
  const COLLAPSE_ID = "addon-bgcolor-collapse";
  const SETTINGS_BUTTON_SELECTOR = ".MuiIconButton-root.css-1egpgfe";
  const TAB_LABEL = "背景色変更";

  function findReferenceTab() {
    const candidates = Array.from(document.querySelectorAll('[role="listitem"]'));
    console.log("[DEBUG] listitem candidates found:", candidates.length);
    const match = candidates.find(el => el.textContent.includes("UI表示"));
    console.log("[DEBUG] reference tab match:", match);
    return match;
  }

  function createClonedTab() {
    const referenceTab = findReferenceTab();
    if (!referenceTab) {
      console.warn("[ERROR] UI表示タブが見つかりません");
      return null;
    }

    const cloned = referenceTab.cloneNode(true);
    cloned.id = ADDON_ID;
    console.log("[DEBUG] cloned tab created");

    const labelSpan = cloned.querySelector('.MuiListItemText-primary');
    if (labelSpan) {
      labelSpan.textContent = TAB_LABEL;
      console.log("[DEBUG] cloned tab label updated");
    } else {
      console.warn("[ERROR] ラベル要素が見つかりません");
    }

    const expandIcon = cloned.querySelector('svg[data-testid]');
    if (expandIcon) {
      expandIcon.innerHTML = `<path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>`;
      console.log("[DEBUG] 展開アイコンを設定");
    }

    cloned.addEventListener("click", () => {
      console.log("[DEBUG] 背景色変更タブがクリックされました");
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

    const picker = collapse.querySelector("#bgcolor-picker");
    picker.addEventListener("input", (e) => {
      document.body.style.backgroundColor = e.target.value;
      console.log("[DEBUG] 背景色変更:", e.target.value);
    });

    afterElement.parentNode.insertBefore(collapse, afterElement.nextSibling);
    console.log("[DEBUG] Collapse領域をDOMに挿入");
  }

  function insertAddonTab() {
    if (document.getElementById(ADDON_ID)) {
      console.log("[DEBUG] 既に背景色変更タブが存在しています");
      return;
    }

    const referenceTab = findReferenceTab();
    const clonedTab = createClonedTab();
    if (referenceTab && clonedTab) {
      referenceTab.parentNode.insertBefore(clonedTab, referenceTab.nextSibling);
      console.log("[DEBUG] 背景色変更タブを挿入しました");
      adjustAddonPosition();
    } else {
      console.warn("[ERROR] タブ挿入に失敗しました");
    }
  }

  function removeAddonTab() {
    const tab = document.getElementById(ADDON_ID);
    const collapse = document.getElementById(COLLAPSE_ID);
    if (tab) {
      tab.remove();
      console.log("[DEBUG] 背景色変更タブを削除しました");
    }
    if (collapse) {
      collapse.remove();
      console.log("[DEBUG] Collapse領域を削除しました");
    }
  }

  function adjustAddonPosition() {
    const addonTab = document.getElementById(ADDON_ID);
    if (!addonTab) {
      console.log("[DEBUG] 位置調整対象のタブが存在しません");
      return;
    }

    const expandedSections = Array.from(document.querySelectorAll(".MuiCollapse-wrapperInner"))
      .filter(el => el.offsetHeight > 0);

    const totalOffset = expandedSections.reduce((sum, el) => sum + el.offsetHeight, 0);
    addonTab.style.marginTop = `${totalOffset}px`;
    console.log("[DEBUG] marginTopを調整:", totalOffset);
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
