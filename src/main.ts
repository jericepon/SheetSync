// @ts-nocheck
figma.showUI(__html__, { width: 600, height: 600, themeColors: true, visible: true });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-csv")
  {
    const rows = parseCSV(msg.csv);

    const selection = figma.currentPage.selection[0];
    if (!selection)
    {
      figma.notify("⚠️ Select a component first!");
      return;
    }

    // Collect and load fonts for the selection
    const fonts = collectFonts(selection);
    await Promise.all(fonts.map(figma.loadFontAsync));

    rows.forEach((row, i) => {
      let targetNode;
      if (i === 0)
      {
        // populate the original selection
        targetNode = selection;
      } else
      {
        // clone for other rows
        targetNode = selection.clone();
        if (selection.parent)
        {
          selection.parent.appendChild(targetNode);
        } else
        {
          figma.currentPage.appendChild(targetNode);
        }
        targetNode.x = selection.x + i * (selection.width + 40);
      }
      replaceFields(targetNode, row);
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

// --- Recursively collect all fonts used in node ---
function collectFonts(node) {
  let fonts = [];
  if ("children" in node)
  {
    for (const child of node.children)
    {
      if (child.type === "TEXT")
      {
        const font = child.fontName;
        if (font !== figma.mixed) fonts.push(font);
      }
      fonts = fonts.concat(collectFonts(child));
    }
  }
  return fonts;
}

// --- Replace text fields recursively ---
async function replaceFields(node, row) {
  if ("children" in node)
  {
    for (const child of node.children)
    {
      const name = child.name.trim();

      if (child.type === "TEXT" && name.startsWith("#"))
      {
        const key = name.slice(1); // remove #

        if (row[key])
        {
          if (child.fontName && child.fontName !== figma.mixed)
          {
            try
            {
              await figma.loadFontAsync(child.fontName);
              child.characters = row[key];
            } catch (err)
            {
              console.warn(`⚠️ Failed to load font for "${child.name}":`, err);
            }
          } else
          {
            console.warn(`⚠️ Skipping "${child.name}" because font is mixed or missing`);
          }
        }
      }

      // Recurse deeper
      await replaceFields(child, row);
    }
  }
}
