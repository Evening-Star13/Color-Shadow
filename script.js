// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => tab.classList.remove("active"));

  // Remove active state from all buttons
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => btn.classList.remove("active"));

  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  // Activate corresponding button
  const activeButton = Array.from(buttons).find((btn) =>
    btn.getAttribute("onclick")?.includes(tabName),
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }

  // Save tab preference
  localStorage.setItem("activeTab", tabName);
}

// ==================== THEME FUNCTIONS ====================

function toggleSettingsPanel(event) {
  const panel = document.getElementById("settings-panel");
  if (panel) {
    panel.classList.toggle("open");
  }
  // Stop propagation to prevent immediate closing
  if (event) {
    event.stopPropagation();
  }
}

function getThemeAccentVar(themeId) {
  return `--${themeId}-accent`;
}

function setTheme(themeId) {
  document.body.setAttribute("data-theme", themeId);
  localStorage.setItem("theme", themeId);
}

function updateAccentColor(themeId, colorValue, source) {
  const picker = document.getElementById(`${themeId}-accent-picker`);
  const hexInput = document.getElementById(`${themeId}-accent-hex`);
  let hexColor = colorValue;

  // Normalize and expand 3-character hex
  if (hexColor.startsWith("#") && hexColor.length === 4) {
    const r = hexColor[1];
    const g = hexColor[2];
    const b = hexColor[3];
    hexColor = `#${r}${r}${g}${g}${b}${b}`;
  } else if (!hexColor.startsWith("#")) {
    hexColor = `#${hexColor}`;
  }

  // Update controls if the change didn't originate from them
  if (picker && source !== "picker") {
    picker.value = hexColor;
  }

  if (hexInput && source !== "hex") {
    hexInput.value = hexColor.toUpperCase();
  }

  // Update CSS variable
  document.documentElement.style.setProperty(
    getThemeAccentVar(themeId),
    hexColor,
  );

  // Save preference
  localStorage.setItem(`accent-${themeId}`, hexColor);
}

function handleAccentHexInput(inputElement) {
  let value = inputElement.value.trim().toUpperCase();
  const theme = inputElement.getAttribute("data-theme-id");

  if (!value.startsWith("#")) {
    value = "#" + value;
  }

  if (/^#([0-9A-F]{3})$/i.test(value) || /^#([0-9A-F]{6})$/i.test(value)) {
    updateAccentColor(theme, value, "hex");
  }
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark-blue";
  document.body.setAttribute("data-theme", savedTheme);

  const radio = document.querySelector(
    `input[name="theme"][value="${savedTheme}"]`,
  );
  if (radio) {
    radio.checked = true;
  }

  ["dark-blue", "black", "white"].forEach((theme) => {
    const savedAccent = localStorage.getItem(`accent-${theme}`);
    if (savedAccent) {
      const picker = document.getElementById(`${theme}-accent-picker`);
      const hexInput = document.getElementById(`${theme}-accent-hex`);
      if (picker) picker.value = savedAccent;
      if (hexInput) hexInput.value = savedAccent.toUpperCase();
      document.documentElement.style.setProperty(
        getThemeAccentVar(theme),
        savedAccent,
      );
    }
  });
}

// ==================== COLOR PICKER FUNCTIONS ====================

const MAX_HISTORY = 500;

function loadHistory() {
  const history = localStorage.getItem("colorHistory");
  return history ? JSON.parse(history) : [];
}

function saveHistory(history) {
  localStorage.setItem("colorHistory", JSON.stringify(history));
}

function addToHistory(colorRgb) {
  const colorStr = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${colorRgb.a.toFixed(2)})`;

  let history = loadHistory();
  history = history.filter((c) => c !== colorStr);
  history.unshift(colorStr);

  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }

  saveHistory(history);
  renderHistory();
}

function renderHistory() {
  const colorHistorySwatches = document.getElementById(
    "color-history-swatches",
  );
  if (!colorHistorySwatches) return;

  const history = loadHistory();
  colorHistorySwatches.innerHTML = "";

  history.forEach((colorStr) => {
    const swatch = document.createElement("div");
    swatch.style.width = "40px";
    swatch.style.height = "40px";
    swatch.style.backgroundColor = colorStr;
    swatch.style.borderRadius = "6px";
    swatch.style.border = "2px solid var(--border-color)";
    swatch.style.cursor = "pointer";
    swatch.style.transition = "transform 0.2s, box-shadow 0.2s";
    swatch.title = colorStr;
    swatch.onclick = () => selectColorFromHistory(colorStr);
    swatch.onmouseenter = () => {
      swatch.style.transform = "scale(1.15)";
      swatch.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    };
    swatch.onmouseleave = () => {
      swatch.style.transform = "scale(1)";
      swatch.style.boxShadow = "none";
    };
    colorHistorySwatches.appendChild(swatch);
  });
}

function selectColorFromHistory(colorStr) {
  const input = document.getElementById("manual-color-input");
  if (input) {
    input.value = colorStr;
    input.dispatchEvent(new Event("input"));
  }
}

function clearHistory() {
  if (confirm("Are you sure you want to clear your color history?")) {
    localStorage.removeItem("colorHistory");
    renderHistory();
  }
}

function downloadHistory() {
  const history = loadHistory();
  if (history.length === 0) {
    alert("No color history to download.");
    return;
  }

  let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Color Picker History - ${new Date().toLocaleString()}</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background-color: #f4f4f4; color: #333; }
        h1 { color: #3182ce; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #e2e8f0; color: #1a202c; }
        .swatch { width: 30px; height: 30px; border-radius: 4px; border: 1px solid #333; }
        .code { font-family: monospace; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Professional Color & Shadow Studio - Color History</h1>
    <p>Export Date: ${new Date().toLocaleString()}</p>
    <p>Total Colors Saved: ${history.length}</p>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Color Swatch</th>
                <th>Color Code (RGBA)</th>
            </tr>
        </thead>
        <tbody>
`;

  history.forEach((colorStr, index) => {
    htmlContent += `
            <tr>
                <td>${index + 1}</td>
                <td><div class="swatch" style="background-color: ${colorStr};"></div></td>
                <td class="code">${colorStr}</td>
            </tr>
`;
  });

  htmlContent += `
        </tbody>
    </table>
</body>
</html>
`;

  const filename = `ColorHistory_${new Date().toISOString().slice(0, 10)}.html`;
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function setupUploadHistoryListener() {
  const uploadInput = document.getElementById("upload-history-input");
  if (!uploadInput) return;

  uploadInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(event.target.result, "text/html");
      const rows = doc.querySelectorAll("tbody tr");

      const importedColors = [];
      rows.forEach((row) => {
        const codeCell = row.querySelector(".code");
        if (codeCell) {
          const colorStr = codeCell.textContent.trim();
          if (colorStr && colorStr.startsWith("rgba")) {
            importedColors.push(colorStr);
          }
        }
      });

      if (importedColors.length > 0) {
        const existingHistory = loadHistory();
        const combined = [...importedColors, ...existingHistory];
        const unique = [...new Set(combined)].slice(0, MAX_HISTORY);
        saveHistory(unique);
        renderHistory();
        alert(`Successfully imported ${importedColors.length} colors!`);
      } else {
        alert("No valid colors found in the uploaded file.");
      }
    };
    reader.readAsText(file);
    uploadInput.value = "";
  });
}

// ==================== COLOR CONVERSION UTILITIES ====================

function alphaToHex(a) {
  const dec = Math.round(a * 255);
  return dec.toString(16).padStart(2, "0").toUpperCase();
}

function hexToAlpha(hex) {
  return parseInt(hex, 16) / 255;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h, s: s, l: l };
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function hsvToRgb(h, s, v) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    v = max;
  let d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h, s: s, v: v };
}

function rgbToHex(r, g, b) {
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function hexaToRgba(hexa) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    hexa,
  );
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: hexToAlpha(result[4]),
      }
    : null;
}

// ==================== COLOR PICKER CORE ====================

const canvas = document.getElementById("color-square");
const ctx = canvas ? canvas.getContext("2d") : null;
const colorSquareWrapper = document.getElementById("color-square-wrapper");
const hueStrip = document.getElementById("hue-strip");
const colorIndicator = document.getElementById("color-selector-indicator");
const hueIndicator = document.getElementById("hue-indicator");

const preview = document.getElementById("color-preview");
const colorFormatSelect = document.getElementById("color-format-select");
const selectedOutput = document.getElementById("selected-output");
const copyFeedback = document.getElementById("copy-feedback");

const hexInput = document.getElementById("hex-input");
const hexaInput = document.getElementById("hexa-input");
const rgbInput = document.getElementById("rgb-input");
const rgbaInput = document.getElementById("rgba-input");
const hslOutput = document.getElementById("hsl-output");
const hslaOutput = document.getElementById("hsla-output");
const hwbOutput = document.getElementById("hwb-output");

const alphaSlider = document.getElementById("alpha-slider");
const alphaValueDisplay = document.getElementById("alpha-value-display");

const gradStop1Input = document.getElementById("gradient-stop-1");
const gradStop2Input = document.getElementById("gradient-stop-2");
const gradStop1Preview = document.getElementById("stop-preview-1");
const gradStop2Preview = document.getElementById("stop-preview-2");
const gradType = document.getElementById("gradient-type");
const gradParam = document.getElementById("gradient-param");
const gradPreviewBox = document.getElementById("gradient-preview-box");
const gradOutput = document.getElementById("gradient-output");
const gradPos1 = document.getElementById("gradient-pos-1");
const gradPos2 = document.getElementById("gradient-pos-2");

let currentHsv = { h: 0.58, s: 0.7, v: 0.88 };
let currentColor = { r: 66, g: 153, b: 225, a: 1 };

function saveColorState() {
  localStorage.setItem("currentColor", JSON.stringify(currentColor));
  localStorage.setItem("currentHsv", JSON.stringify(currentHsv));
  localStorage.setItem("selectedFormat", colorFormatSelect?.value || "hex");
  localStorage.setItem(
    "manualInput",
    document.getElementById("manual-color-input")?.value || "",
  );
  localStorage.setItem("gradientStop1", gradStop1Input?.value || "");
  localStorage.setItem("gradientStop2", gradStop2Input?.value || "");
  localStorage.setItem("gradientPos1", gradPos1?.value || "0%");
  localStorage.setItem("gradientPos2", gradPos2?.value || "100%");
  localStorage.setItem("gradientType", gradType?.value || "linear");
  localStorage.setItem("gradientParam", gradParam?.value || "90deg");
}

function loadColorState() {
  const savedColor = localStorage.getItem("currentColor");
  const savedHsv = localStorage.getItem("currentHsv");

  if (savedColor) {
    currentColor = JSON.parse(savedColor);
  }
  if (savedHsv) {
    currentHsv = JSON.parse(savedHsv);
  }

  if (colorFormatSelect) {
    const savedFormat = localStorage.getItem("selectedFormat");
    if (savedFormat) colorFormatSelect.value = savedFormat;
  }

  const manualInput = document.getElementById("manual-color-input");
  if (manualInput) {
    const savedManual = localStorage.getItem("manualInput");
    if (savedManual) manualInput.value = savedManual;
  }

  if (gradStop1Input)
    gradStop1Input.value =
      localStorage.getItem("gradientStop1") || "rgba(66, 153, 225, 1.00)";
  if (gradStop2Input)
    gradStop2Input.value =
      localStorage.getItem("gradientStop2") || "rgba(255, 0, 0, 1.00)";
  if (gradPos1) gradPos1.value = localStorage.getItem("gradientPos1") || "0%";
  if (gradPos2) gradPos2.value = localStorage.getItem("gradientPos2") || "100%";
  if (gradType)
    gradType.value = localStorage.getItem("gradientType") || "linear";
  if (gradParam)
    gradParam.value = localStorage.getItem("gradientParam") || "90deg";
}

function handleAlphaChange(value) {
  currentColor.a = parseFloat(value);
  if (alphaValueDisplay)
    alphaValueDisplay.textContent = parseFloat(value).toFixed(2);
  updateAllOutputs();
}

function drawColorSquare() {
  if (!canvas || !ctx) return;
  const width = canvas.width;
  const height = canvas.height;

  const hueRgb = hsvToRgb(currentHsv.h, 1, 1);
  const hueColor = `rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b})`;

  ctx.clearRect(0, 0, width, height);

  // White to hue gradient (left to right)
  const gradWhiteToHue = ctx.createLinearGradient(0, 0, width, 0);
  gradWhiteToHue.addColorStop(0, "#ffffff");
  gradWhiteToHue.addColorStop(1, hueColor);
  ctx.fillStyle = gradWhiteToHue;
  ctx.fillRect(0, 0, width, height);

  // Transparent to black gradient (top to bottom)
  const gradBlack = ctx.createLinearGradient(0, 0, 0, height);
  gradBlack.addColorStop(0, "rgba(0,0,0,0)");
  gradBlack.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = gradBlack;
  ctx.fillRect(0, 0, width, height);
}

function pickColorFromSquare(e) {
  if (!canvas || !colorSquareWrapper) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const s = x / rect.width;
  const v = 1 - y / rect.height;

  currentHsv.s = Math.max(0, Math.min(1, s));
  currentHsv.v = Math.max(0, Math.min(1, v));

  const rgb = hsvToRgb(currentHsv.h, currentHsv.s, currentHsv.v);
  currentColor.r = rgb.r;
  currentColor.g = rgb.g;
  currentColor.b = rgb.b;

  if (colorIndicator) {
    colorIndicator.style.left = `${s * 100}%`;
    colorIndicator.style.top = `${(1 - v) * 100}%`;
  }

  updateAllOutputs();
}

function pickHueFromStrip(e) {
  if (!hueStrip) return;
  const rect = hueStrip.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const hue = 1 - y / rect.height;

  currentHsv.h = Math.max(0, Math.min(1, hue));

  if (hueIndicator) {
    hueIndicator.style.top = `${(1 - hue) * 100}%`;
  }

  drawColorSquare();

  const rgb = hsvToRgb(currentHsv.h, currentHsv.s, currentHsv.v);
  currentColor.r = rgb.r;
  currentColor.g = rgb.g;
  currentColor.b = rgb.b;

  updateAllOutputs();
}

function updateAllOutputs() {
  const { r, g, b, a } = currentColor;

  if (preview) {
    preview.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  if (hexInput) hexInput.value = rgbToHex(r, g, b);
  if (hexaInput) hexaInput.value = rgbToHex(r, g, b) + alphaToHex(a);
  if (rgbInput) rgbInput.value = `rgb(${r}, ${g}, ${b})`;
  if (rgbaInput) rgbaInput.value = `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;

  const hsl = rgbToHsl(r, g, b);
  const hDeg = Math.round(hsl.h * 360);
  const sPerc = Math.round(hsl.s * 100);
  const lPerc = Math.round(hsl.l * 100);

  if (hslOutput) hslOutput.value = `hsl(${hDeg}, ${sPerc}%, ${lPerc}%)`;
  if (hslaOutput)
    hslaOutput.value = `hsla(${hDeg}, ${sPerc}%, ${lPerc}%, ${a.toFixed(2)})`;

  const w = Math.round((1 - currentHsv.s) * currentHsv.v * 100);
  const bk = Math.round((1 - currentHsv.v) * 100);
  if (hwbOutput) hwbOutput.value = `hwb(${hDeg}, ${w}%, ${bk}%)`;

  updateSelectedOutput();
  addToHistory(currentColor);
  saveColorState();
}

function updateSelectedOutput() {
  if (!selectedOutput || !colorFormatSelect) return;
  const format = colorFormatSelect.value;

  switch (format) {
    case "hex":
      selectedOutput.value = hexInput?.value || "";
      break;
    case "hexa":
      selectedOutput.value = hexaInput?.value || "";
      break;
    case "rgb":
      selectedOutput.value = rgbInput?.value || "";
      break;
    case "rgba":
      selectedOutput.value = rgbaInput?.value || "";
      break;
    case "hsl":
      selectedOutput.value = hslOutput?.value || "";
      break;
    case "hsla":
      selectedOutput.value = hslaOutput?.value || "";
      break;
    case "hwb":
      selectedOutput.value = hwbOutput?.value || "";
      break;
    default:
      selectedOutput.value = hexInput?.value || "";
  }
}

function handleManualInput(format) {
  // Handle manual input for different formats
  // (Implementation similar to original script.js)
}

// Manual color input handler
const manualColorInput = document.getElementById("manual-color-input");
if (manualColorInput) {
  manualColorInput.addEventListener("input", function (e) {
    const val = e.target.value.trim();
    if (!val) return;

    let rgb = null;
    let alpha = 1;

    // HEX or HEXA
    if (/^#?([a-fA-F0-9]{6})$/.test(val)) {
      rgb = hexToRgb(val);
    } else if (/^#?([a-fA-F0-9]{8})$/.test(val)) {
      const rgba = hexaToRgba(val);
      if (rgba) {
        rgb = { r: rgba.r, g: rgba.g, b: rgba.b };
        alpha = rgba.a;
      }
    } else if (/^#?([a-fA-F0-9]{3})$/.test(val)) {
      let hex = val.replace("#", "");
      hex = hex
        .split("")
        .map((h) => h + h)
        .join("");
      rgb = hexToRgb("#" + hex);
    }
    // RGB
    else if (/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.test(val)) {
      const match = val.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
      rgb = { r: +match[1], g: +match[2], b: +match[3] };
    }
    // RGBA
    else if (
      /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/.test(val)
    ) {
      const match = val.match(
        /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/,
      );
      rgb = { r: +match[1], g: +match[2], b: +match[3] };
      alpha = parseFloat(match[4]);
    }
    // HSL
    else if (/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/.test(val)) {
      const match = val.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/);
      const h = +match[1] / 360;
      const s = +match[2] / 100;
      const l = +match[3] / 100;
      rgb = hslToRgb(h, s, l);
    }
    // HSLA
    else if (
      /^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([0-9.]+)\s*\)$/.test(
        val,
      )
    ) {
      const match = val.match(
        /^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([0-9.]+)\s*\)$/,
      );
      const h = +match[1] / 360;
      const s = +match[2] / 100;
      const l = +match[3] / 100;
      alpha = parseFloat(match[4]);
      rgb = hslToRgb(h, s, l);
    }

    if (rgb) {
      currentColor.r = rgb.r;
      currentColor.g = rgb.g;
      currentColor.b = rgb.b;
      currentColor.a = alpha;

      if (alphaSlider) alphaSlider.value = alpha;
      if (alphaValueDisplay) alphaValueDisplay.textContent = alpha.toFixed(2);

      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      currentHsv = hsv;

      drawColorSquare();

      if (colorIndicator) {
        colorIndicator.style.left = `${hsv.s * 100}%`;
        colorIndicator.style.top = `${(1 - hsv.v) * 100}%`;
      }
      if (hueIndicator) {
        hueIndicator.style.top = `${(1 - hsv.h) * 100}%`;
      }

      updateAllOutputs();
    }
  });
}

// ==================== GRADIENT FUNCTIONS ====================

function setGradientStop(stopNumber) {
  const { r, g, b, a } = currentColor;
  const colorStr = `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;

  if (stopNumber === 1) {
    if (gradStop1Input) gradStop1Input.value = colorStr;
    if (gradStop1Preview) gradStop1Preview.style.backgroundColor = colorStr;
  } else {
    if (gradStop2Input) gradStop2Input.value = colorStr;
    if (gradStop2Preview) gradStop2Preview.style.backgroundColor = colorStr;
  }

  updateGradientPreview();
}

function updateGradientPreview() {
  if (!gradStop1Input || !gradStop2Input || !gradType || !gradParam) return;

  const c1 = gradStop1Input.value;
  const c2 = gradStop2Input.value;
  const p1 = gradPos1?.value || "0%";
  const p2 = gradPos2?.value || "100%";
  const type = gradType.value;
  const param = gradParam.value;

  let cssGrad = "";

  if (type === "linear") {
    cssGrad = `linear-gradient(${param}, ${c1} ${p1}, ${c2} ${p2})`;
  } else if (type === "radial") {
    cssGrad = `radial-gradient(${param}, ${c1} ${p1}, ${c2} ${p2})`;
  } else if (type === "repeating-linear") {
    cssGrad = `repeating-linear-gradient(${param}, ${c1} ${p1}, ${c2} ${p2})`;
  } else if (type === "repeating-radial") {
    cssGrad = `repeating-radial-gradient(${param}, ${c1} ${p1}, ${c2} ${p2})`;
  }

  if (gradPreviewBox) gradPreviewBox.style.background = cssGrad;
  if (gradOutput) gradOutput.value = cssGrad;

  if (gradStop1Preview) gradStop1Preview.style.backgroundColor = c1;
  if (gradStop2Preview) gradStop2Preview.style.backgroundColor = c2;

  saveColorState();
}

async function copyToClipboard(source) {
  let textToCopy = "";

  if (source === "selected") {
    textToCopy = selectedOutput?.value || "";
  } else if (source === "gradient") {
    textToCopy = gradOutput?.value || "";
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    if (copyFeedback) {
      copyFeedback.classList.add("show");
      setTimeout(() => {
        copyFeedback.classList.remove("show");
      }, 2000);
    }
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

// ==================== SHADOW EFFECTS FUNCTIONS ====================

const shadowInputs = {
  x: document.getElementById("x-shadow"),
  y: document.getElementById("y-shadow"),
  blur: document.getElementById("blur-shadow"),
  opacity: document.getElementById("opacity-shadow"),
  boxColor: document.getElementById("box-color"),
  shadowColor: document.getElementById("shadow-color"),
  tsX: document.getElementById("ts-x"),
  tsY: document.getElementById("ts-y"),
  tsBlur: document.getElementById("ts-blur"),
  tsOpacity: document.getElementById("ts-opacity"),
  textColor: document.getElementById("text-color"),
  tsColor: document.getElementById("ts-color"),
};

function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function updateShadowPreview() {
  if (!shadowInputs.x) return; // Guard if elements don't exist

  // Update labels
  const xVal = document.getElementById("x-val");
  const yVal = document.getElementById("y-val");
  const blurVal = document.getElementById("blur-val");
  const opacityVal = document.getElementById("opacity-val");
  const tsXVal = document.getElementById("ts-x-val");
  const tsYVal = document.getElementById("ts-y-val");
  const tsBlurVal = document.getElementById("ts-blur-val");
  const tsOpacityVal = document.getElementById("ts-opacity-val");

  if (xVal) xVal.innerText = `${shadowInputs.x.value}px`;
  if (yVal) yVal.innerText = `${shadowInputs.y.value}px`;
  if (blurVal) blurVal.innerText = `${shadowInputs.blur.value}px`;
  if (opacityVal) opacityVal.innerText = shadowInputs.opacity.value;
  if (tsXVal) tsXVal.innerText = `${shadowInputs.tsX.value}px`;
  if (tsYVal) tsYVal.innerText = `${shadowInputs.tsY.value}px`;
  if (tsBlurVal) tsBlurVal.innerText = `${shadowInputs.tsBlur.value}px`;
  if (tsOpacityVal) tsOpacityVal.innerText = shadowInputs.tsOpacity.value;

  const bSrgba = hexToRgba(
    shadowInputs.shadowColor.value,
    shadowInputs.opacity.value,
  );
  const tSrgba = hexToRgba(
    shadowInputs.tsColor.value,
    shadowInputs.tsOpacity.value,
  );

  const bs = `${shadowInputs.x.value}px ${shadowInputs.y.value}px ${shadowInputs.blur.value}px ${bSrgba}`;
  const ts = `${shadowInputs.tsX.value}px ${shadowInputs.tsY.value}px ${shadowInputs.tsBlur.value}px ${tSrgba}`;

  // Apply to preview
  const box = document.getElementById("preview-box");
  const text = document.getElementById("preview-text");

  if (box) {
    box.style.backgroundColor = shadowInputs.boxColor.value;
    box.style.boxShadow = bs;
  }
  if (text) {
    text.style.color = shadowInputs.textColor.value;
    text.style.textShadow = ts;
  }

  // Update CSS code
  const fullCode = `.shadow-elite {\n  background: ${shadowInputs.boxColor.value};\n  box-shadow: ${bs};\n  color: ${shadowInputs.textColor.value};\n  text-shadow: ${ts};\n}`;

  const cssCode = document.getElementById("css-code");
  const cssPreviewLine = document.getElementById("css-preview-line");

  if (cssCode) cssCode.innerText = fullCode;
  if (cssPreviewLine)
    cssPreviewLine.innerText = `box-shadow: ${bs}; text-shadow: ${ts};`;
}

function setupShadowListeners() {
  if (!shadowInputs.x) return; // Only setup if elements exist

  Object.values(shadowInputs).forEach((input) => {
    if (input) {
      input.addEventListener("input", updateShadowPreview);
    }
  });

  const downloadBtn = document.getElementById("download-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const cssCode = document.getElementById("css-code");
      if (!cssCode) return;

      const blob = new Blob([cssCode.innerText], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "shadowcraft.css";
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}

// ==================== INITIALIZATION ====================

window.onload = () => {
  // Load saved theme
  loadSavedTheme();

  // Close settings panel when clicking outside
  document.addEventListener("click", (e) => {
    const panel = document.getElementById("settings-panel");
    const settingsIcon = document.getElementById("settings-icon-svg");

    if (panel && settingsIcon) {
      // Check if click is outside panel and not on the settings icon
      if (!panel.contains(e.target) && !settingsIcon.contains(e.target)) {
        panel.classList.remove("open");
      }
    }
  });

  // Prevent clicks inside settings panel from closing it
  const settingsPanel = document.getElementById("settings-panel");
  if (settingsPanel) {
    settingsPanel.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Load saved tab
  const savedTab = localStorage.getItem("activeTab") || "color-picker";
  switchTab(savedTab);

  // Initialize color picker if elements exist
  if (canvas && ctx) {
    canvas.width = 250;
    canvas.height = 250;

    loadColorState();
    drawColorSquare();
    updateAllOutputs();
    renderHistory();
    updateGradientPreview();

    // Mouse events for color square
    let isDraggingSquare = false;
    colorSquareWrapper?.addEventListener("mousedown", (e) => {
      isDraggingSquare = true;
      pickColorFromSquare(e);
    });

    document.addEventListener("mousemove", (e) => {
      if (isDraggingSquare) pickColorFromSquare(e);
      if (isDraggingHue) pickHueFromStrip(e);
    });

    document.addEventListener("mouseup", () => {
      isDraggingSquare = false;
      isDraggingHue = false;
    });

    // Mouse events for hue strip
    let isDraggingHue = false;
    const hueStripWrapper = document.getElementById("hue-strip-wrapper");
    hueStripWrapper?.addEventListener("mousedown", (e) => {
      isDraggingHue = true;
      pickHueFromStrip(e);
    });

    // Position indicators
    if (hueIndicator) {
      hueIndicator.style.top = `${(1 - currentHsv.h) * 100}%`;
    }
    if (colorIndicator) {
      colorIndicator.style.left = `${currentHsv.s * 100}%`;
      colorIndicator.style.top = `${(1 - currentHsv.v) * 100}%`;
    }

    setupUploadHistoryListener();
  }

  // Initialize shadow effects
  setupShadowListeners();
  updateShadowPreview();
};
