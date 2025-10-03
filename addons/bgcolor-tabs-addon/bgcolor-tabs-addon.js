window.MyAppAddons = window.MyAppAddons || [];

window.MyAppAddons.push(function () {
  const ADDON_ID = "addon-bgcolor-tab";
  const COLLAPSE_ID = "addon-bgcolor-collapse";
  const SETTINGS_BUTTON_SELECTOR = ".MuiIconButton-root.css-1egpgfe";
  const TAB_LABEL = "背景色変更";

  function findUI表示Tab() {
    const tabs = Array.from(document.querySelectorAll('[role="listitem"]'));
    return tabs.find(el => el.textContent.includes("UI表示"));
  }

  function createClonedTab(referenceTab) {
    const cloned = referenceTab.cloneNode(true);
    cloned.id = ADDON_ID;

    const labelSpan = cloned.querySelector('.MuiListItemText-primary');
    if (labelSpan) labelSpan.textContent = TAB_LABEL;

    const expandIcon = cloned.querySelector('svg[data-testid]');
    if (expandIcon) {
      expandIcon.innerHTML = `<path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>`;
    }

    cloned.addEventListener("click", () => {
      const collapse = document.getElementById(COLLAPSE_ID);
      if (collapse) {
        collapse.remove();
      } else {
        insertCollapseContent(cloned);
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
    if (document.getElementById(ADDON_ID)) return;

    const referenceTab = findUI表示Tab();
    if (!referenceTab) return;

    const clonedTab = createClonedTab(referenceTab);
    referenceTab.parentNode.insertBefore(clonedTab, referenceTab.nextSibling);
    adjustAddonPosition();
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
    return settingsButton?.getAttribute("aria-expanded") === "true";
  }

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
