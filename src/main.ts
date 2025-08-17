// @ts-nocheck
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

    rows.forEach((row, i) => {
      let node;
      if (i === 0) {
        node = selection;
      } else {
        node = selection.clone();
        (selection.parent || figma.currentPage).appendChild(node);
        node.x = selection.x + i * (selection.width + 40);
      }
      replaceFields(node, row);
    });

    figma.notify(`✅ Populated ${rows.length} components`);
  }
};

// --- CSV parser ---
function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const values = line.split(",");
    return headers.reduce((obj, key, i) => {
      obj[key.trim()] = values[i] ? values[i].trim() : "";
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

// --- Replace text layers recursively ---
function replaceFields(node, row) {
  if ("children" in node) {
    for (const child of node.children) {
      if (child.type === "TEXT" && child.name.startsWith("#")) {
        const key = child.name.slice(1); // remove #
        if (row[key] !== undefined) {
          child.characters = row[key];
        }
      }
      replaceFields(child, row); // recurse
    }
  }
}
