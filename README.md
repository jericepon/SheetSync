<p align="center">
    <img src="public/logo.svg" style="width: 300px;">
</p>

# SheetSync

A Figma plugin that automatically populates component instances using data from Excel or Google Sheets exports. Ideal for design systems, dashboards, and repetitive UI elements.

## Features

- Upload `.xlsx` or `.xls` files and populate selected component instances.
- Automatically duplicates component instances based on the number of rows in the spreadsheet.
- Populates text layers with `#` prefixes.
- Supports component properties:

  - Variant properties
  - Boolean properties
  - Text properties

- Works inside auto-layout and non-auto-layout frames, keeping duplicates contained within the parent.
- Dynamic mapping: matches spreadsheet column names to layers and properties automatically.
- Keeps original instance populated along with duplicates.

## Spreadsheet Format

The plugin expects a spreadsheet with **columns matching text layers or component properties**.

### Example Columns:

```
Title | Description | Subhead | State | Size | Show Description
```

### Notes:

- Text layers must start with `#` to be populated (e.g., `#Title`, `#Description`).
- Column names must match layer or property names (without `#`).
- Boolean columns: TRUE/FALSE.
- Variant columns: values must match the component variant options.

### Sample Data:

| Title          | Description                     | Subhead | State    | Size  | Show Description |
| -------------- | ------------------------------- | ------- | -------- | ----- | ---------------- |
| Server Upgrade | Upgrade backend servers to v2.1 | Backend | Active   | Large | TRUE             |
| Login Feature  | Implement OAuth2 login          | Auth    | Inactive | Small | TRUE             |

<!-- ## Installation

1. Open Figma → `Plugins` → `Development` → `Import Plugin from Manifest…`.
2. Select the plugin folder containing `manifest.json` and source files.
3. Your plugin is now available under `Plugins → Development`. -->

## Usage

1. Select a single instance of your component in Figma.
2. Open the plugin.
3. Select and Upload your Excel file (`.xlsx` or `.xls`).
4. The plugin will duplicate the instance for each row and populate the layers and component properties automatically.

## Notes

- Ensure the component instance is **selected** before running the plugin.
- The plugin automatically keeps duplicates inside the parent frame.
- Works for any number of rows in the spreadsheet.
- Supports components with new props as long as the spreadsheet columns match.

<!-- ## Contributing

Feel free to fork this repository and add features, such as:

- Nested component support
- Conditional logic based on spreadsheet values
- Integration with Google Sheets API -->

<!-- ## License

MIT License -->
