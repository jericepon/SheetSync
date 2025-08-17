// @ts-nocheck
figma.showUI(__html__, { width: 300, height: 300 });

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "populate-excel") return;

  const rows = msg.data;
  if (!rows.length) return figma.notify("No data found in spreadsheet");

  const selection = figma.currentPage.selection;
  if (selection.length !== 1 || selection[0].type !== "INSTANCE") {
    figma.notify("Please select a single instance of a component");
    return;
  }

  const instance = selection[0];
  const parent = instance.parent;
  const spacing = 20;
  let currentY = instance.y - parent.y;

  // Remove old duplicates
  parent.children
    .filter(c => c.getPluginData("duplicated") === "true")
    .forEach(c => c.remove());

  // Helper: remove numbers/symbols and lowercase
  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');

  // Find matching column in row for a given key
  const findColumnForKey = (row, key) => {
    const normKey = normalize(key);
    return Object.keys(row).find(col => normalize(col).includes(normKey));
  };

  const populateInstance = async (target, row, rowIndex) => {
    // --- Populate # TEXT NODES ---
    const textNodes = target.findAll(n => n.type === "TEXT" && n.name.startsWith("#"));
    for (const node of textNodes) {
      const cleanedName = node.name.replace(/^#/, '');
      const columnKey = findColumnForKey(row, cleanedName);
      if (columnKey && row[columnKey] !== undefined) {
        try {
          if (node.fontName) await figma.loadFontAsync(node.fontName);
          node.characters = String(row[columnKey]).trim();
        } catch (err) {
          console.log("Font load failed", node.name, err);
        }
      }
    }

    // --- Populate COMPONENT PROPERTIES ---
    const props = target.componentProperties;
    for (const key in props) {
      const columnKey = findColumnForKey(row, key);
      if (!columnKey) continue;

      const value = row[columnKey];
      const prop = props[key];

      try {
        switch (prop.type) {
          case "VARIANT":
            target.setProperties({ [key]: String(value).trim() });
            break;
          case "BOOLEAN":
            target.setProperties({ [key]: Boolean(value) });
            break;
          case "TEXT":
            if (prop.fontName) await figma.loadFontAsync(prop.fontName);
            target.setProperties({ [key]: String(value).trim() });
            break;
        }
      } catch (err) {
        console.log(`Property set failed '${key}'`, err);
      }
    }
  };

  // Populate original instance with first row
  await populateInstance(instance, rows[0], 0);

  // Duplicate remaining rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const clone = instance.clone();
    clone.setPluginData("duplicated", "true");
    parent.appendChild(clone);

    await populateInstance(clone, row, i);

    if (parent.layoutMode === "NONE") {
      clone.x = instance.x - parent.x;
      clone.y = currentY;
      currentY += clone.height + spacing;
    }
  }

  figma.notify(`Populated ${rows.length} rows`);
};
