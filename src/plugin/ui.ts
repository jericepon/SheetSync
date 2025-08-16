document.getElementById("create")?.addEventListener("click", () => {
  parent.postMessage({ pluginMessage: { type: "create-rect" } }, "*");
});
