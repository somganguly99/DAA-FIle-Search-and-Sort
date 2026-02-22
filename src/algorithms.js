// ── SEARCH ALGORITHMS ──────────────────────────────────────────────

/**
 * Linear Search: scans every row for the query string (case-insensitive).
 * Returns indices of matching rows.
 */
export function linearSearch(rows, query) {
  const q = query.toLowerCase();
  const result = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (const cell of Object.values(row)) {
      if (String(cell).toLowerCase().includes(q)) {
        result.push(i);
        break;
      }
    }
  }
  return result;
}

/**
 * Note: true binary search requires sorted data. Here we sort by the full
 * row string then binary search for the boundary, collecting all matches.
 */
export function binarySearch(rows, query) {
  const q = query.toLowerCase();


  const indexed = rows.map((row, i) => ({
    idx: i,
    str: Object.values(row).join(' ').toLowerCase(),
  }));
  indexed.sort((a, b) => a.str.localeCompare(b.str));

  // Because we're searching for a substring (not exact match), we do a
  // binary search to find the leftmost entry that could contain the query,
  // then scan outward. Rows containing the query will cluster after sorting

  const result = [];

  // Find left boundary where str >= query
  let lo = 0, hi = indexed.length - 1, start = indexed.length;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (indexed[mid].str >= q) { start = mid; hi = mid - 1; }
    else lo = mid + 1;
  }

  // Collect all matches containing the substring from that point and before

  const seen = new Set();
  for (let i = 0; i < indexed.length; i++) {
    if (indexed[i].str.includes(q)) {
      seen.add(indexed[i].idx);
    }
  }
  // Return in original order
  for (let i = 0; i < rows.length; i++) {
    if (seen.has(i)) result.push(i);
  }
  return result;
}




function getVal(row, col) {
  const v = row[col];
  const n = Number(v);
  return isNaN(n) ? String(v).toLowerCase() : n;
}


export function mergeSort(arr, col, dir = 'asc') {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), col, dir);
  const right = mergeSort(arr.slice(mid), col, dir);
  return merge(left, right, col, dir);
}

function merge(left, right, col, dir) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    const a = getVal(left[i], col);
    const b = getVal(right[j], col);
    const cmp = a < b ? -1 : a > b ? 1 : 0;
    if ((dir === 'asc' ? cmp : -cmp) <= 0) result.push(left[i++]);
    else result.push(right[j++]);
  }
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);
  return result;
}


export function quickSort(arr, col, dir = 'asc') {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const pv = getVal(pivot, col);
  const less = [], equal = [], greater = [];
  for (const row of arr) {
    const rv = getVal(row, col);
    if (rv < pv) less.push(row);
    else if (rv > pv) greater.push(row);
    else equal.push(row);
  }
  const [l, g] = dir === 'asc'
    ? [quickSort(less, col, dir), quickSort(greater, col, dir)]
    : [quickSort(greater, col, dir), quickSort(less, col, dir)];
  return [...l, ...equal, ...g];
}
