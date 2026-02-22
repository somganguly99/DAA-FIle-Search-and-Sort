# TableViz

A React + Vite app to load, view, search, and sort tabular data files.

## Setup

```bash
npm install
npm run dev
```

## Features

### File Support
Upload via drag-and-drop or click to browse:
- `.csv` — comma-separated
- `.txt` — tab, pipe, comma, or whitespace delimited
- `.dat` — tab, pipe, comma, or whitespace delimited
- `.xlsx` — Excel spreadsheets

### Search
- **Linear Search** — scans every row sequentially O(n)
- **Binary Search** — sorts rows by content then binary-searches O(n log n)

Type a keyword and press Enter or click Search. Matching cells are highlighted. Performance time is shown.

### Sort
Click any **column header** to sort the entire table by that column.

Choose sort algorithm using the buttons in the control bar:
- **Merge Sort** — stable, O(n log n)
- **Quick Sort** — O(n log n) average

Clicking the same column header toggles ascending/descending order.

## Project Structure

```
src/
  App.jsx         — main UI
  App.css         — styles
  algorithms.js   — linearSearch, binarySearch, mergeSort, quickSort
  fileParser.js   — file parsing for csv/txt/dat/xlsx
  main.jsx        — entry point
```

## Dependencies
- `react`, `react-dom`
- `xlsx` — for reading Excel files
- `vite`, `@vitejs/plugin-react`
