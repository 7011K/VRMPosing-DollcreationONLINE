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
  let existing = document.querySelector("[data-addon='bgcolor-tabs']");
  if (existing) existing.remove();

  // 環境設定ulを毎回探す
  function findSettingsUL() {
    // 「背景」や「UI表示」などのリストがあるul
    const allUl = document.querySelectorAll("ul.MuiList-root");
    for (const ul of allUl) {
      // 「背景」や「UI表示」などの項目がul内にあれば対象
      const labels = Array.from(ul.querySelectorAll("span")).map(s=>s.textContent);
      if (labels.some(l=>l && (l.includes("背景") || l.includes("UI表示")))) {
        return ul;
      }
    }
    return null;
  }

  // UIを追加する
  function addAddonUI() {
    const ul = findSettingsUL();
    if (!ul) return;

    // 「背景」リスト項目を特定
    const lis = Array.from(ul.children);
    let insertAfter = null;
    for (const li of lis) {
      const span = li.querySelector("span");
      if (span && span.textContent.trim() === "背景") {
        insertAfter = li;
        break;
      }
    }

    // 追加済みなら何もしない
    if (ul.querySelector("[data-addon='bgcolor-tabs']")) return;

    // <li>を新しく作成
    const newLi = document.createElement("li");
    newLi.className = "MuiListItem-root MuiListItem-gutters MuiListItem-padding";
    newLi.setAttribute("role", "listitem");
    newLi.setAttribute("data-addon", "bgcolor-tabs");
    newLi.style.flexDirection = "column";
    newLi.style.alignItems = "stretch";
    newLi.style.paddingBottom = "0";
    newLi.style.position = "relative";
    newLi.style.background = "inherit"; // 透明

    // ヘッダー部分（Accordionのタイトル）
    const headerDiv = document.createElement("div");
    headerDiv.className = "MuiButtonBase-root MuiListItemButton-root MuiListItemButton-gutters";
    headerDiv.style.display = "flex";
    headerDiv.style.alignItems = "center";
    headerDiv.style.cursor = "pointer";
    headerDiv.style.userSelect = "none";
    headerDiv.style.minHeight = "48px";
    headerDiv.style.padding = "6px 16px"; // MUIデフォルト値
    headerDiv.style.fontSize = "1rem";
    headerDiv.style.color = "#fff";

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
      <svg class="MuiSvgIcon-root" style="width:24px;height:24px;transition:transform 0.2s;" viewBox="0 0 24 24">
        <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="#fff"/>
      </svg>
    `;
    arrow.style.marginLeft = "auto";
    headerDiv.appendChild(arrow);

    newLi.appendChild(headerDiv);

    // 展開パネル本体
    const panelDiv = document.createElement("div");
    panelDiv.style.display = "none";
    panelDiv.style.flexDirection = "column";
    panelDiv.style.background = "inherit";
    panelDiv.style.margin = "0";
    panelDiv.style.padding = "0 0 8px 0";
    panelDiv.style.position = "relative";
    // 必要ならz-indexで被り防止
    panelDiv.style.zIndex = 1;

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

    // 選択状態管理
    let selectedGroup = 0;
    let selectedColorIdx = {};
    groups.forEach((g, i) => selectedColorIdx[i] = 0);

    // カラーピッカーの現在値（グループごとに記憶）
    let pickerColor = {};
    groups.forEach((g,i)=> pickerColor[i] = "#cccccc");

    // タブボタン生成
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
    panelDiv.appendChild(tabBar);

    // 色リストUI & カラーピッカー
    function renderColorList() {
      scrollDiv.innerHTML = '';
      const group = groups[selectedGroup];
      group.colors.forEach((preset, idx) => {
        // チェックボックスラベル
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "8px";
        label.style.margin = "4px 0";

        // チェックボックス
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
          // カラーピッカーのチェックも外す
          const customCb = scrollDiv.querySelector("input[type='checkbox'].custom");
          if (customCb) customCb.checked = false;
        };
        checkbox.classList.add("preset");
        if (!threeRenderer || !threeRenderer.setClearColor) checkbox.disabled = true;

        // 色プレビュー
        const colorBox = document.createElement("span");
        colorBox.style.display = "inline-block";
        colorBox.style.width = "20px";
        colorBox.style.height = "20px";
        colorBox.style.borderRadius = "4px";
        colorBox.style.background = preset.color;
        colorBox.style.border = "1px solid #888";

        // 色名
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

      // カラーピッカー行
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
    panelDiv.appendChild(scrollDiv);

    // Accordion展開制御
    let expanded = false;
    function setPanelDisplay(exp) {
      panelDiv.style.display = exp ? "flex" : "none";
      arrow.firstElementChild.style.transform = exp ? "rotate(180deg)" : "";
    }
    setPanelDisplay(expanded);

    headerDiv.onclick = () => {
      expanded = !expanded;
      setPanelDisplay(expanded);
    };

    // 「背景」の次に挿入（なければ末尾）
    if (insertAfter && insertAfter.nextSibling) {
      ul.insertBefore(newLi, insertAfter.nextSibling);
    } else {
      ul.appendChild(newLi);
    }
    newLi.appendChild(panelDiv);
  }

  // 環境設定タブを監視して、表示のたびにUIを再挿入
  function observeSettingsTab() {
    const sidebar = document.querySelector("#root") || document.body;
    let observer;
    observer = new MutationObserver(() => {
      addAddonUI();
    });
    observer.observe(sidebar, { childList: true, subtree: true });
    setTimeout(addAddonUI, 0);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeSettingsTab);
  } else {
    observeSettingsTab();
  }
});
