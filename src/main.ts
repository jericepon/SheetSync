// @ts-nocheck
figma.showUI(__html__, { width: 600, height: 300, themeColors: true, visible: true });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-csv") {
    const rows = parseCSV(msg.csv);
    const selection = figma.currentPage.selection[0];

    if (!selection) {
      figma.notify("⚠️ Select a component first!");
      return;
    }

    // Collect and load all fonts once
    const fonts = collectFonts(selection);
    await Promise.all(fonts.map(figma.loadFontAsync));

    let missingKeys = new Set();

    rows.forEach((row, i) => {
      let node;
      if (i === 0) {
        node = selection;
      } else {
        node = selection.clone();
        (selection.parent || figma.currentPage).appendChild(node);
        node.x = selection.x + i * (selection.width + 40);
      }
      replaceFields(node, row, missingKeys);
    });

    // Notify about missing keys
    if (missingKeys.size > 0) {
      figma.notify(`⚠️ Missing CSV columns for: ${Array.from(missingKeys).join(", ")}`);
    }

    figma.notify(`✅ Populated ${rows.length} components`);
    figma.closePlugin();
  }
};

// --- CSV parser ---
function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",");
    return headers.reduce((obj, key, i) => {
      obj[key] = values[i] ? values[i].trim() : "";
      return obj;
    }, {});
  });
}

// --- Collect all fonts used recursively ---
function collectFonts(node) {
  let fonts = [];
  if ("children" in node) {
    for (const child of node.children) {
      if (child.type === "TEXT" && child.fontName !== figma.mixed) {
        fonts.push(child.fontName);
      }
      fonts = fonts.concat(collectFonts(child));
    }
  }
  return fonts;
}

// --- Replace text layers recursively and highlight missing ---
function replaceFields(node, row, missingKeys) {
  if ("children" in node) {
    for (const child of node.children) {
      if (child.type === "TEXT" && child.name.startsWith("#")) {
        const key = child.name.slice(1).trim(); // remove # and trim
        if (row[key] !== undefined) {
          child.characters = row[key];
          // Reset fill in case it was previously highlighted
          child.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
        } else {
          missingKeys.add(key);
          // Highlight missing layer in bright red
          child.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];
        }
      }
      replaceFields(child, row, missingKeys); // recurse
    }
  }
}
