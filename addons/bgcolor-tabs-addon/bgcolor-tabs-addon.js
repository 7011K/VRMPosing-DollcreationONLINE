window.MyAppAddons = window.MyAppAddons || [];
window.MyAppAddons.push(async function({ threeRenderer, addonBaseUrl }) {
  // プリセット色JSON取得
  const jsonUrl = addonBaseUrl + "bgcolor-presets.json";
  let groups = [];
  try {
    const resp = await fetch(jsonUrl);
    if (!resp.ok) throw new Error("プリセットJSONの読込に失敗しました");
    const data = await resp.json();
    groups = data.groups || [{ name: "標準色", colors: data.presets || data }];
  } catch (e) {
    groups = [{
      name: "標準色",
      colors: [{ name: "デフォルト", color: "#303030" }]
    }];
    console.warn(e);
  }

  // 既存UI削除（重複防止）
  function removeExisting() {
    let existing = document.querySelector("[data-addon='bgcolor-tabs']");
    if (existing) {
      // 展開パネルも一緒に消す
      if (existing.nextElementSibling && existing.nextElementSibling.hasAttribute("data-addon-panel")) {
        existing.nextElementSibling.remove();
      }
      existing.remove();
    }
  }

  // 「背景」タブと同じAccordion/リスト構成を作成
  function createAddonTab() {
    // 1. Accordionヘッダー部分
    const headerDiv = document.createElement("div");
    headerDiv.className = "MuiButtonBase-root MuiListItemButton-root MuiListItemButton-gutters";
    headerDiv.setAttribute("role", "listitem");
    headerDiv.setAttribute("tabindex", "0");
    headerDiv.setAttribute("data-addon", "bgcolor-tabs");
    headerDiv.style.display = "flex";
    headerDiv.style.alignItems = "center";
    headerDiv.style.width = "100%";
    headerDiv.style.userSelect = "none";
    headerDiv.style.minHeight = "48px";
    headerDiv.style.padding = "6px 16px";
    headerDiv.style.fontSize = "1rem";
    headerDiv.style.color = "#fff";
    headerDiv.style.background = "inherit";
    headerDiv.style.border = "none";
    headerDiv.style.textAlign = "left";
    headerDiv.style.cursor = "pointer";
    // Hover色
    headerDiv.onmouseover = () => { headerDiv.style.background = "rgba(255,255,255,0.08)"; };
    headerDiv.onmouseout = () => { headerDiv.style.background = "inherit"; };

    // アイコン
    const iconDiv = document.createElement("div");
    iconDiv.className = "MuiListItemIcon-root";
    iconDiv.style.display = "flex";
    iconDiv.style.alignItems = "center";
    iconDiv.innerHTML = `
      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium"
        focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="vertical-align:middle;width:24px;height:24px;">
        <circle cx="12" cy="12" r="9" fill="#888"/>
        <text x="12" y="17" text-anchor="middle" font-size="10" fill="#fff" font-family="sans-serif">色</text>
      </svg>`;
    headerDiv.appendChild(iconDiv);

    // テキストラベル
    const textDiv = document.createElement("div");
    textDiv.className = "MuiListItemText-root";
    const span = document.createElement("span");
    span.className = "MuiTypography-root MuiTypography-body1 MuiListItemText-primary";
    span.textContent = "背景色変更";
    textDiv.appendChild(span);
    headerDiv.appendChild(textDiv);

    // 展開/折りたたみアイコン
    const arrow = document.createElement("span");
    arrow.innerHTML = `
      <svg class="MuiSvgIcon-root" style="width:24px;height:24px;transition:transform 0.225s cubic-bezier(0.4,0,0.2,1);" viewBox="0 0 24 24">
        <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="#fff"/>
      </svg>
    `;
    arrow.style.marginLeft = "auto";
    headerDiv.appendChild(arrow);

    // 2. Accordionパネル部分 
    const collapseDiv = document.createElement("div");
    collapseDiv.className = "MuiCollapse-root MuiCollapse-vertical";
    collapseDiv.setAttribute("data-addon-panel", "bgcolor-tabs");
    collapseDiv.style.display = "none";
    collapseDiv.style.overflow = "hidden";
    collapseDiv.style.transition = "max-height 225ms cubic-bezier(0.4,0,0.2,1), opacity 225ms cubic-bezier(0.4,0,0.2,1)";
    collapseDiv.style.maxHeight = "0";
    collapseDiv.style.opacity = "0";

    // Accordion wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "MuiCollapse-wrapper MuiCollapse-vertical";
    collapseDiv.appendChild(wrapper);

    // Accordion wrapperInner
    const wrapperInner = document.createElement("div");
    wrapperInner.className = "MuiCollapse-wrapperInner MuiCollapse-vertical";
    wrapper.appendChild(wrapperInner);

    // ↓ここに今までの色選択UIを入れる
    // タブバー
    const tabBar = document.createElement("div");
    tabBar.style.display = "flex";
    tabBar.style.gap = "8px";
    tabBar.style.margin = "8px 0 0 32px";
    tabBar.style.overflowX = "auto";
    tabBar.className = "MuiTabs-root";
    // スクロールリスト
    const scrollDiv = document.createElement("div");
    scrollDiv.style.maxHeight = "120px";
    scrollDiv.style.overflowY = "auto";
    scrollDiv.style.margin = "4px 0 0 32px";
    scrollDiv.style.paddingRight = "8px";
    scrollDiv.style.background = "inherit";
    let selectedGroup = 0;
    let selectedColorIdx = {};
    groups.forEach((g, i) => selectedColorIdx[i] = 0);
    let pickerColor = {};
    groups.forEach((g,i)=> pickerColor[i] = "#cccccc");

    groups.forEach((group, idx) => {
      const tabBtn = document.createElement("button");
      tabBtn.innerText = group.name;
      tabBtn.className = "MuiButtonBase-root MuiTab-root MuiTab-textColorPrimary";
      tabBtn.style.background = idx === selectedGroup ? "#222" : "#444";
      tabBtn.style.color = "#fff";
      tabBtn.style.border = "none";
      tabBtn.style.borderBottom = idx === selectedGroup ? "2px solid #1976d2" : "2px solid transparent";
      tabBtn.style.outline = "none";
      tabBtn.style.padding = "8px 24px";
      tabBtn.style.minWidth = "72px";
      tabBtn.style.fontSize = "0.875rem";
      tabBtn.style.fontWeight = idx === selectedGroup ? "bold" : "normal";
      tabBtn.style.lineHeight = "1.75";
      tabBtn.style.letterSpacing = "0.02857em";
      tabBtn.style.textTransform = "none";
      tabBtn.style.cursor = "pointer";
      tabBtn.onclick = () => {
        selectedGroup = idx;
        renderColorList();
        Array.from(tabBar.children).forEach((btn, i) => {
          btn.style.background = i === selectedGroup ? "#222" : "#444";
          btn.style.borderBottom = i === selectedGroup ? "2px solid #1976d2" : "2px solid transparent";
          btn.style.fontWeight = i === selectedGroup ? "bold" : "normal";
        });
      };
      tabBar.appendChild(tabBtn);
    });

    function renderColorList() {
      scrollDiv.innerHTML = '';
      const group = groups[selectedGroup];
      group.colors.forEach((preset, idx) => {
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "8px";
        label.style.margin = "4px 0";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = (selectedColorIdx[selectedGroup] === idx);
        checkbox.style.accentColor = preset.color;
        checkbox.onclick = () => {
          if (!threeRenderer || !threeRenderer.setClearColor) return;
          Array.from(scrollDiv.querySelectorAll("input[type='checkbox'].preset")).forEach(cb => cb.checked = false);
          checkbox.checked = true;
          selectedColorIdx[selectedGroup] = idx;
          threeRenderer.setClearColor(preset.color);
          const customCb = scrollDiv.querySelector("input[type='checkbox'].custom");
          if (customCb) customCb.checked = false;
        };
        checkbox.classList.add("preset");
        if (!threeRenderer || !threeRenderer.setClearColor) checkbox.disabled = true;

        const colorBox = document.createElement("span");
        colorBox.style.display = "inline-block";
        colorBox.style.width = "20px";
        colorBox.style.height = "20px";
        colorBox.style.borderRadius = "4px";
        colorBox.style.background = preset.color;
        colorBox.style.border = "1px solid #888";

        const nameSpan = document.createElement("span");
        nameSpan.innerText = preset.name;
        nameSpan.className = "MuiTypography-root MuiTypography-body2";
        nameSpan.style.color = "#fff";
        nameSpan.style.fontSize = "0.875rem";

        label.appendChild(checkbox);
        label.appendChild(colorBox);
        label.appendChild(nameSpan);

        scrollDiv.appendChild(label);
      });

      const pickerLabel = document.createElement("label");
      pickerLabel.style.display = "flex";
      pickerLabel.style.alignItems = "center";
      pickerLabel.style.gap = "8px";
      pickerLabel.style.margin = "12px 0 4px 0";

      const pickerCheckbox = document.createElement("input");
      pickerCheckbox.type = "checkbox";
      pickerCheckbox.classList.add("custom");
      pickerCheckbox.checked = false;
      pickerCheckbox.onclick = () => {
        if (!threeRenderer || !threeRenderer.setClearColor) return;
        Array.from(scrollDiv.querySelectorAll("input[type='checkbox'].preset")).forEach(cb => cb.checked = false);
        pickerCheckbox.checked = true;
        selectedColorIdx[selectedGroup] = -1;
        threeRenderer.setClearColor(pickerColor[selectedGroup]);
      };
      if (!threeRenderer || !threeRenderer.setClearColor) pickerCheckbox.disabled = true;

      const inputColor = document.createElement("input");
      inputColor.type = "color";
      inputColor.value = pickerColor[selectedGroup];
      inputColor.style.width = "28px";
      inputColor.style.height = "28px";
      inputColor.style.border = "none";
      inputColor.style.marginRight = "4px";
      inputColor.style.cursor = "pointer";
      inputColor.oninput = () => {
        pickerColor[selectedGroup] = inputColor.value;
        if (pickerCheckbox.checked && threeRenderer && threeRenderer.setClearColor) {
          threeRenderer.setClearColor(inputColor.value);
        }
      };
      if (!threeRenderer || !threeRenderer.setClearColor) inputColor.disabled = true;

      const customLabel = document.createElement("span");
      customLabel.innerText = "カスタム色";
      customLabel.className = "MuiTypography-root MuiTypography-body2";
      customLabel.style.color = "#fff";
      customLabel.style.fontSize = "0.875rem";

      pickerLabel.appendChild(pickerCheckbox);
      pickerLabel.appendChild(inputColor);
      pickerLabel.appendChild(customLabel);

      scrollDiv.appendChild(pickerLabel);
    }
    renderColorList();

    // panelDivの中身
    wrapperInner.appendChild(tabBar);
    wrapperInner.appendChild(scrollDiv);

    // Accordion開閉状態
    let expanded = false;
    function setPanelDisplay(exp) {
      if (exp) {
        collapseDiv.style.display = "block";
        requestAnimationFrame(() => {
          collapseDiv.style.maxHeight = "350px";
          collapseDiv.style.opacity = "1";
        });
      } else {
        collapseDiv.style.maxHeight = "0";
        collapseDiv.style.opacity = "0";
        setTimeout(() => {
          if (collapseDiv.style.maxHeight === "0px" || collapseDiv.style.maxHeight === "0") collapseDiv.style.display = "none";
        }, 225);
      }
      arrow.firstElementChild.style.transform = exp ? "rotate(180deg)" : "";
      arrow.firstElementChild.style.transition = "transform 225ms cubic-bezier(0.4,0,0.2,1)";
    }
    setPanelDisplay(expanded);
    headerDiv.onclick = () => {
      expanded = !expanded;
      setPanelDisplay(expanded);
    };

    return { headerDiv, collapseDiv };
  }

  // 「背景」Accordionパネルulを監視して、常に正しい位置にUIを再挿入
  function observeBackgroundAccordion() {
    const sidebar = document.querySelector("#root") || document.body;
    let lastHeader = null, lastPanel = null;

    function insertAddon() {
      // まず削除
      removeExisting();
      // 「背景」Accordionパネルulを取得
      const allItems = document.querySelectorAll("[role='listitem']");
      let backgroundBtn = null;
      for (const item of allItems) {
        const span = item.querySelector("span");
        if (span && span.textContent.trim() === "背景") {
          backgroundBtn = item;
          break;
        }
      }
      if (!backgroundBtn) return;

      // Accordion展開部分: div.MuiCollapse-root
      let panel = backgroundBtn.nextElementSibling;
      while (panel) {
        if (
          panel.classList.contains("MuiCollapse-root") ||
          panel.classList.contains("MuiCollapse-vertical")
        ) {
          const ul = panel.querySelector("ul.MuiList-root");
          if (ul) {
            // すでに追加済みならスキップ
            if (ul.querySelector("[data-addon='bgcolor-tabs']")) return;
            const { headerDiv, collapseDiv } = createAddonTab();
            ul.appendChild(headerDiv);
            ul.appendChild(collapseDiv);
            break;
          }
        }
        panel = panel.nextElementSibling;
      }
    }

    // 初回
    setTimeout(insertAddon, 0);

    // MutationObserverで監視
    const observer = new MutationObserver(() => {
      insertAddon();
    });
    observer.observe(sidebar, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeBackgroundAccordion);
  } else {
    observeBackgroundAccordion();
  }
});
