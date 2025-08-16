// @ts-nocheck
// You don’t need to change much here
figma.showUI(__html__, {
  width: 600,
  height: 600,
  themeColors: true,
  visible: true
});

// ✅ Allow user to resize freely
// figma.ui.resize(600, 400) // sets a new size programmatically
figma.ui.onmessage = (msg) => {
  if (msg.type === 'resize')
  {
    figma.ui.resize(msg.width, msg.height)
  }
}

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
        if (font !== figma.mixed)
        {
          fonts.push(font);
        }
      }
      fonts = fonts.concat(collectFonts(child));
    }
  }
  return fonts;
}

async function replaceFields(node, row) {
  if ("children" in node)
  {
    for (const child of node.children)
    {
      const name = child.name.trim();

      // Handle text layers
      if (child.type === "TEXT" && name.startsWith("#"))
      {
        const key = name; // #Title, #Subhead, etc.
        if (row[key])
        {
          await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
          child.characters = row[key];
        }
      }

      // Handle #Image (including groups)
      if (name === "#Image")
      {
        await handleImageNode(child, row["#Image"]);
      }

      // Recurse deeper
      await replaceFields(child, row);
    }
  }
}

// --- Handle image node (works for Group or shapes) ---
async function handleImageNode(node, url) {
  if (!url || !url.startsWith("http")) return;

  // If node supports fills, apply directly
  if ("fills" in node)
  {
    try
    {
      const imageBytes = await fetchImage(url);
      const image = figma.createImage(imageBytes);
      node.fills = [
        {
          type: "IMAGE",
          scaleMode: "FILL",
          imageHash: image.hash,
        },
      ];
      return;
    } catch (err)
    {
      console.error("❌ Failed to load image:", err);
      return;
    }
  }

  // If node is a group, search inside for the first fillable shape
  if ("children" in node)
  {
    for (const child of node.children)
    {
      if ("fills" in child)
      {
        return handleImageNode(child, url); // recurse until fillable
      }
    }
  }

  console.warn(`⚠️ No fillable shape found inside node "${node.name}"`);
}

// --- Fetch image helper ---
async function fetchImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
