// @ts-nocheck
figma.showUI(__html__, { width: 400, height: 100 });

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "populate-excel") return;

  const rows = msg.data; // JSON array from Excel
  const selection = figma.currentPage.selection;

  if (selection.length !== 1 || selection[0].type !== "INSTANCE") {
    figma.notify("Please select a single instance of a component");
    return;
  }

  const instance = selection[0];
  const parent = instance.parent;
  console.log(instance.componentProperties);
  
  // Remove old duplicates
  parent.children
    .filter((c) => c.getPluginData("duplicated") === "true")
    .forEach((c) => c.remove());

  const spacing = 20; // used only for non-auto-layout frames
  let currentY = 0; // relative to parent

  // Function to populate text layers safely with existing font
  const populateInstance = async (target, row) => {
    const textNodes = target.findAll(
      (node) => node.type === "TEXT" && node.name.startsWith("#")
    );

    for (const node of textNodes) {
      const key = node.name.replace(/^#/, "");
      if (row[key] !== undefined) {
        // Load the node's existing font first
        await figma.loadFontAsync(node.fontName);
        node.characters = String(row[key]);
      }
    }
  };

  if (parent.layoutMode === "NONE") {
    // Non-auto-layout frame: manually stack clones
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const target = i === 0 ? instance : instance.clone();

      if (i !== 0) {
        target.setPluginData("duplicated", "true");
        parent.appendChild(target);
      }

      await populateInstance(target, row);

      // Position relative to parent
      target.x = instance.x - parent.x;
      target.y = currentY;

      currentY += target.height + spacing;
    }
  } else {
    // Auto-layout frame: just append clones, let Figma handle spacing
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const target = i === 0 ? instance : instance.clone();

      if (i !== 0) {
        target.setPluginData("duplicated", "true");
        parent.appendChild(target);
      }

      await populateInstance(target, row);
    }
  }

  figma.notify(`Populated ${rows.length} rows`);
};
