window.MyAppAddons = window.MyAppAddons || [];

window.MyAppAddons.push(function () {
  const ADDON_ID = "addon-bgcolor-tab";
  const SETTINGS_BUTTON_SELECTOR = ".MuiIconButton-root.css-1egpgfe";
  const TAB_LABEL = "背景色変更";

  function findReferenceTab() {
    return Array.from(document.querySelectorAll('[role="listitem"]'))
      .find(el => el.textContent.includes("UI表示"));
  }

  function createClonedTab() {
    const referenceTab = findReferenceTab();
    if (!referenceTab) return null;

    const cloned = referenceTab.cloneNode(true);
    cloned.id = ADDON_ID;

    const labelSpan = cloned.querySelector('.MuiListItemText-primary');
    if (labelSpan) labelSpan.textContent = TAB_LABEL;

    cloned.addEventListener("click", () => {
      alert("背景色変更タブがクリックされました");
      // ここに背景色変更処理を追加可能
    });

    return cloned;
  }

  function insertAddonTab() {
    if (document.getElementById(ADDON_ID)) return;

    const referenceTab = findReferenceTab();
    const clonedTab = createClonedTab();
    if (referenceTab && clonedTab) {
      referenceTab.parentNode.insertBefore(clonedTab, referenceTab.nextSibling);
      adjustAddonPosition();
    }
  }

  function removeAddonTab() {
    const existing = document.getElementById(ADDON_ID);
    if (existing) existing.remove();
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
    return settingsButton && settingsButton.getAttribute("aria-expanded") === "true";
  }

  // DOM変化を監視して表示・非表示・位置調整
  const observer = new MutationObserver(() => {
    if (isSettingsPanelVisible()) {
      insertAddonTab();
    } else {
      removeAddonTab();
    }

    adjustAddonPosition();
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
