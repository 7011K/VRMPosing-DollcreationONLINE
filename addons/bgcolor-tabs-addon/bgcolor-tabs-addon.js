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
  function removeExisting(ul) {
    if (!ul) return;
    let existing = ul.querySelector("[data-addon='bgcolor-tabs']");
    if (existing) existing.remove();
  }

  // 「環境設定」パネルのulを取得
  function findSettingsPanelUL() {
    // サイドバー全体から「背景」や「UI表示」などのリストがあるulを検索
    const allUl = document.querySelectorAll("ul.MuiList-root");
    for (const ul of allUl) {
      const labels = Array.from(ul.querySelectorAll("span")).map(s=>s.textContent);
      // 「背景」「UI表示」の両方があればそのulが「環境設定」パネル
      if (
        labels.some(l=>l && l.includes("背景")) &&
        labels.some(l=>l && l.includes("UI表示"))
      ) {
        return ul;
      }
    }
    return null;
  }

  // UIを追加する
  function addAddonUI() {
    const ul = findSettingsPanelUL();
    if (!ul) return;
    removeExisting(ul);

    // 追加済みなら何もしない
    if (ul.querySelector("[data-addon='bgcolor-tabs']")) return;

    // --- 並び順を「背景」「背景色変更」「UI表示」としたい ---

    // 「背景」リスト項目と「UI表示」リスト項目を特定
    const lis = Array.from(ul.children);
    let backgroundIdx = -1, uiDisplayIdx = -1;
    for (let i = 0; i < lis.length; i++) {
      const span = lis[i].querySelector("span");
      if (span && span.textContent.trim() === "背景") backgroundIdx = i;
      if (span && span.textContent.trim() === "UI表示") uiDisplayIdx = i;
    }
    // 「背景」タブがなければ末尾に、「UI表示」タブがなければ背景の次に
    let insertIdx = (backgroundIdx !== -1) ? backgroundIdx + 1 : 0;
    if (uiDisplayIdx !== -1 && insertIdx > uiDisplayIdx) {
      insertIdx = uiDisplayIdx; // UI表示の直前
    }

    // <div role="listitem">で追加
    const newDiv = document.createElement("div");
    newDiv.className = "MuiButtonBase-root MuiListItemButton-root MuiListItemButton-gutters";
    newDiv.setAttribute("role", "listitem");
    newDiv.setAttribute("data-addon", "bgcolor-tabs");
    newDiv.style.flexDirection = "column";
    newDiv.style.alignItems = "stretch";
    newDiv.style.width = "100%";
    newDiv.style.margin = "0";
    newDiv.style.padding = "0";
    newDiv.style.background = "inherit";

    // ヘッダー部分
    const headerBtn = document.createElement("button");
    headerBtn.type = "button";
    headerBtn.className = "MuiButtonBase-root MuiListItemButton-root MuiListItemButton-gutters";
    headerBtn.setAttribute("tabindex", "0");
    headerBtn.setAttribute("role", "button");
    headerBtn.style.width = "100%";
    headerBtn.style.display = "flex";
    headerBtn.style.alignItems = "center";
    headerBtn.style.cursor = "pointer";
    headerBtn.style.userSelect = "none";
    headerBtn.style.minHeight = "48px";
    headerBtn.style.padding = "6px 16px";
    headerBtn.style.fontSize = "1rem";
    headerBtn.style.color = "#fff";
    headerBtn.style.background = "inherit";
    headerBtn.style.border = "none";
    headerBtn.style.textAlign = "left";
    headerBtn.onmouseover = () => { headerBtn.style.background = "rgba(255,255,255,0.08)"; };
    headerBtn.onmouseout = () => { headerBtn.style.background = "inherit"; };

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
    headerBtn.appendChild(iconDiv);

    // テキストラベル
    const textDiv = document.createElement("div");
    textDiv.className = "MuiListItemText-root";
    const span = document.createElement("span");
    span.className = "MuiTypography-root MuiTypography-body1 MuiListItemText-primary";
    span.textContent = "背景色変更";
    textDiv.appendChild(span);
    headerBtn.appendChild(textDiv);

    // 展開/折りたたみアイコン
    const arrow = document.createElement("span");
    arrow.innerHTML = `
      <svg class="MuiSvgIcon-root" style="width:24px;height:24px;transition:transform 0.225s cubic-bezier(0.4,0,0.2,1);" viewBox="0 0 24 24">
        <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="#fff"/>
      </svg>
    `;
    arrow.style.marginLeft = "auto";
    headerBtn.appendChild(arrow);

    // --- 展開パネル本体 ---
    const panelDiv = document.createElement("div");
    panelDiv.style.maxHeight = "0";
    panelDiv.style.opacity = "0";
    panelDiv.style.overflow = "hidden";
    panelDiv.style.transition = "max-height 225ms cubic-bezier(0.4,0,0.2,1), opacity 225ms cubic-bezier(0.4,0,0.2,1)";
    panelDiv.style.flexDirection = "column";
    panelDiv.style.background = "inherit";
    panelDiv.style.margin = "0";
    panelDiv.style.padding = "0 0 8px 0";
    panelDiv.style.position = "relative";
    panelDiv.style.zIndex = 1;
    panelDiv.style.width = "100%";

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
    panelDiv.appendChild(tabBar);
    panelDiv.appendChild(scrollDiv);

    // Accordion開閉状態
    let expanded = false;
    function setPanelDisplay(exp) {
      if (exp) {
        panelDiv.style.display = "block";
        requestAnimationFrame(() => {
          panelDiv.style.maxHeight = "350px";
          panelDiv.style.opacity = "1";
        });
      } else {
        panelDiv.style.maxHeight = "0";
        panelDiv.style.opacity = "0";
        setTimeout(() => {
          if (panelDiv.style.maxHeight === "0px" || panelDiv.style.maxHeight === "0") panelDiv.style.display = "none";
        }, 225);
      }
      arrow.firstElementChild.style.transform = exp ? "rotate(180deg)" : "";
      arrow.firstElementChild.style.transition = "transform 225ms cubic-bezier(0.4,0,0.2,1)";
    }
    setPanelDisplay(expanded);
    headerBtn.onclick = () => {
      expanded = !expanded;
      setPanelDisplay(expanded);
    };

    return { headerBtn, panelDiv };
  }

  // 「環境設定」パネルulを監視して、常に正しい位置にUIを再挿入
  function observeSettingsPanel() {
    const sidebar = document.querySelector("#root") || document.body;
    function insertAddon() {
      // まず削除
      removeExisting();
      // 「環境設定」ulを取得
      const ul = findSettingsPanelUL();
      if (!ul) return;

      // 追加済みならスキップ
      if (ul.querySelector("[data-addon='bgcolor-tabs']")) return;

      // 挿入位置決定
      const lis = Array.from(ul.children);
      let backgroundIdx = -1, uiDisplayIdx = -1;
      for (let i = 0; i < lis.length; i++) {
        const span = lis[i].querySelector("span");
        if (span && span.textContent.trim() === "背景") backgroundIdx = i;
        if (span && span.textContent.trim() === "UI表示") uiDisplayIdx = i;
      }
      let insertIdx = (backgroundIdx !== -1) ? backgroundIdx + 1 : 0;
      if (uiDisplayIdx !== -1 && insertIdx > uiDisplayIdx) {
        insertIdx = uiDisplayIdx; // UI表示の直前
      }

      // タブ（Accordion+パネル）を生成
      const { headerBtn, panelDiv } = createAddonTab();

      // 並び順に従ってinsert
      if (insertIdx >= 0 && insertIdx < ul.children.length) {
        ul.insertBefore(headerBtn, ul.children[insertIdx]);
        ul.insertBefore(panelDiv, ul.children[insertIdx + 1]);
      } else {
        ul.appendChild(headerBtn);
        ul.appendChild(panelDiv);
      }
    }
    setTimeout(insertAddon, 0);

    // MutationObserverで監視
    const observer = new MutationObserver(() => {
      insertAddon();
    });
    observer.observe(sidebar, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeSettingsPanel);
  } else {
    observeSettingsPanel();
  }
});
