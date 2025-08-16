// This runs inside Figma
figma.showUI(__html__, { width: 300, height: 200 });

figma.ui.onmessage = msg => {
  if (msg.type === 'create-rect')
  {
    const rect = figma.createRectangle();
    rect.resize(100, 100);
    figma.currentPage.appendChild(rect);
    figma.closePlugin();
  }
};
