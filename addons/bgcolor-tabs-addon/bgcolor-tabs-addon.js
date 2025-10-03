window.MyAppAddons = window.MyAppAddons || [];
window.MyAppAddons.push(async function({ threeRenderer, mountPoint, addonBaseUrl }) {
  // プリセット色JSON取得（グループ対応）
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
  let existing = mountPoint.querySelector("[data-addon='bgcolor-tabs']");
  if (existing) existing.remove();

  // ul（MUIリスト）を取得
  const ul = mountPoint.querySelector("ul.MuiList-root");
  if (!ul) {
    console.warn("背景色アドオン: リストセクション(ul)が見つかりません");
    return;
  }

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

  // <li>を新しく作成
  const newLi = document.createElement("li");
  newLi.className = "MuiListItem-root MuiListItem-gutters MuiListItem-padding";
  newLi.setAttribute("role", "listitem");
  newLi.setAttribute("data-addon", "bgcolor-tabs");

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
  newLi.appendChild(iconDiv);

  // テキストラベル
  const textDiv = document.createElement("div");
  textDiv.className = "MuiListItemText-root";
  const span = document.createElement("span");
  span.className = "MuiTypography-root MuiTypography-body1 MuiListItemText-primary";
  span.textContent = "背景色変更";
  textDiv.appendChild(span);
  newLi.appendChild(textDiv);

  // タブ
  const tabBar = document.createElement("div");
  tabBar.style.display = "flex";
  tabBar.style.gap = "8px";
  tabBar.style.margin = "8px 0 0 32px";
  tabBar.style.overflowX = "auto";

  // スクロールリスト
  const scrollDiv = document.createElement("div");
  scrollDiv.style.maxHeight = "120px";
  scrollDiv.style.overflowY = "auto";
  scrollDiv.style.margin = "4px 0 0 32px";
  scrollDiv.style.paddingRight = "8px";

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
    tabBtn.style.background = idx === selectedGroup ? "#222" : "#444";
    tabBtn.style.color = "#fff";
    tabBtn.style.border = "none";
    tabBtn.style.borderRadius = "4px 4px 0 0";
    tabBtn.style.padding = "4px 12px";
    tabBtn.style.cursor = "pointer";
    tabBtn.style.fontWeight = idx === selectedGroup ? "bold" : "normal";
    tabBtn.onclick = () => {
      selectedGroup = idx;
      renderColorList();
      Array.from(tabBar.children).forEach((btn, i) => {
        btn.style.background = i === selectedGroup ? "#222" : "#444";
        btn.style.fontWeight = i === selectedGroup ? "bold" : "normal";
      });
    };
    tabBar.appendChild(tabBtn);
  });

  newLi.appendChild(tabBar);

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
        // 全てのチェックを外す（ただしカラーピッカー用は除く）
        Array.from(scrollDiv.querySelectorAll("input[type='checkbox'].preset")).forEach(cb => cb.checked = false);
        checkbox.checked = true;
        selectedColorIdx[selectedGroup] = idx;
        threeRenderer.setClearColor(preset.color);
        // カラーピッカーのチェックも外す
        const customCb = scrollDiv.querySelector("input[type='checkbox'].custom");
        if (customCb) customCb.checked = false;
      };
      checkbox.classList.add("preset");

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
      nameSpan.style.color = "#fff";
      nameSpan.style.fontSize = "13px";

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

    // チェックボックス（カスタム色用）
    const pickerCheckbox = document.createElement("input");
    pickerCheckbox.type = "checkbox";
    pickerCheckbox.classList.add("custom");
    pickerCheckbox.checked = false;

    pickerCheckbox.onclick = () => {
      // 全てのプリセットチェックを外す
      Array.from(scrollDiv.querySelectorAll("input[type='checkbox'].preset")).forEach(cb => cb.checked = false);
      // このチェックのみON
      pickerCheckbox.checked = true;
      selectedColorIdx[selectedGroup] = -1;
      threeRenderer.setClearColor(pickerColor[selectedGroup]);
    };

    // カラーピッカー本体
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
      // カラーピッカーが選択されている場合のみ色を反映
      if (pickerCheckbox.checked) {
        threeRenderer.setClearColor(inputColor.value);
      }
    };

    // ラベル
    const customLabel = document.createElement("span");
    customLabel.innerText = "カスタム色";
    customLabel.style.color = "#fff";
    customLabel.style.fontSize = "13px";

    pickerLabel.appendChild(pickerCheckbox);
    pickerLabel.appendChild(inputColor);
    pickerLabel.appendChild(customLabel);

    scrollDiv.appendChild(pickerLabel);
  }

  renderColorList();
  newLi.appendChild(scrollDiv);

  // 「背景」の次に挿入（なければ末尾）
  if (insertAfter && insertAfter.nextSibling) {
    ul.insertBefore(newLi, insertAfter.nextSibling);
  } else {
    ul.appendChild(newLi);
  }
});
