import React, { useState, useCallback, useRef } from 'react';
import { parseFile } from './fileParser';
import { linearSearch, binarySearch, mergeSort, quickSort } from './algorithms';
import './App.css';

const ACCEPTED = ['.txt', '.csv', '.xlsx', '.dat'];

export default function App() {
  const [tableData, setTableData] = useState(null); // { headers, rows }
  const [displayRows, setDisplayRows] = useState([]);
  const [matchedIndices, setMatchedIndices] = useState(null); // null = no filter
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('linear'); // 'linear' | 'binary'
  const [searchTime, setSearchTime] = useState(null);

  // Sort state
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [sortAlgo, setSortAlgo] = useState('merge'); // 'merge' | 'quick'
  const [sortTime, setSortTime] = useState(null);

  const fileInputRef = useRef();

  const loadFile = useCallback(async (file) => {
    setError('');
    setSearchQuery('');
    setMatchedIndices(null);
    setSortCol(null);
    setSearchTime(null);
    setSortTime(null);
    try {
      const data = await parseFile(file);
      if (!data.rows.length) throw new Error('No data rows found in file.');
      setTableData(data);
      setDisplayRows(data.rows);
      setFileName(file.name);
    } catch (e) {
      setError(e.message);
      setTableData(null);
      setDisplayRows([]);
    }
  }, []);

  // Drag and drop
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onFileInput = (e) => {
    const file = e.target.files[0];
    if (file) loadFile(file);
  };

  // ── Search ──────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!tableData) return;
    if (!searchQuery.trim()) {
      setMatchedIndices(null);
      setDisplayRows(tableData.rows);
      setSearchTime(null);
      return;
    }
    const ITERATIONS = 500;
    const searchFn = searchMode === 'binary' ? binarySearch : linearSearch;
    // Warmup to avoid JIT skew
    searchFn(tableData.rows, searchQuery);
    const t0 = performance.now();
    let indices;
    for (let i = 0; i < ITERATIONS; i++) {
      indices = searchFn(tableData.rows, searchQuery);
    }
    const t1 = performance.now();
    const perOpMs = (t1 - t0) / ITERATIONS;
    setMatchedIndices(indices);
    setDisplayRows(indices.map(i => tableData.rows[i]));
    setSearchTime({ algo: searchMode, ms: perOpMs.toFixed(4), totalMs: (t1 - t0).toFixed(2), iterations: ITERATIONS, count: indices.length });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setMatchedIndices(null);
    setDisplayRows(tableData ? tableData.rows : []);
    setSearchTime(null);
  };

  // ── Sort ────────────────────────────────────────────────────────
  const handleSort = (col, algo) => {
    if (!tableData) return;
    const source = displayRows.length ? displayRows : tableData.rows;
    const newDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc';
    const SORT_ITERS = 100;
    const sortFn = algo === 'quick' ? quickSort : mergeSort;
    // Warmup
    sortFn([...source], col, newDir);
    const t0 = performance.now();
    let sorted;
    for (let i = 0; i < SORT_ITERS; i++) {
      sorted = sortFn([...source], col, newDir);
    }
    const t1 = performance.now();
    const perOpMs = (t1 - t0) / SORT_ITERS;
    setDisplayRows(sorted);
    setSortCol(col);
    setSortDir(newDir);
    setSortAlgo(algo);
    setSortTime({ algo, ms: perOpMs.toFixed(4), totalMs: (t1 - t0).toFixed(2), iterations: SORT_ITERS, col });
  };

  const sortIndicator = (col) => {
    if (sortCol !== col) return <span className="sort-icon">⇅</span>;
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>SEARCH AND<span> SORT</span></h1>
        <p className="subtitle">search · sort · files</p>
      </header>

      {/* Drop Zone */}
      {!tableData && (
        <div
          className={`dropzone ${dragging ? 'dragging' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="drop-icon">⬆</div>
          <p>Drop your file here or <span className="link">click to browse</span></p>
          <p className="drop-hint">Supports: .txt .csv .xlsx .dat (tabular data)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            style={{ display: 'none' }}
            onChange={onFileInput}
          />
        </div>
      )}

      {error && <div className="error-msg">⚠ {error}</div>}

      {/* Controls */}
      {tableData && (
        <>
          <div className="controls-bar">
            <div className="file-info">
              <span className="file-badge">📄 {fileName}</span>
              <span className="row-count">{tableData.rows.length} rows · {tableData.headers.length} cols detected</span>
              <button className="btn btn-ghost" onClick={() => { setTableData(null); setDisplayRows([]); setFileName(''); }}>
                ✕ New File
              </button>
            </div>

            <div className="controls-row">
              {/* Search */}
              <div className="control-group">
                <label className="group-label">SEARCH</label>
                <div className="search-row">
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Search keyword..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <select
                    className="select"
                    value={searchMode}
                    onChange={e => setSearchMode(e.target.value)}
                  >
                    <option value="linear">Linear Search</option>
                    <option value="binary">Binary Search</option>
                  </select>
                  <button className="btn btn-primary" onClick={handleSearch}>Search</button>
                  {matchedIndices !== null && (
                    <button className="btn btn-ghost" onClick={clearSearch}>Clear</button>
                  )}
                </div>
                {searchTime && (
                  <div className="stat-bar">
                    {searchTime.algo} search → {searchTime.count} rows matched
                    {' | '}avg per run: <strong>{searchTime.ms}ms</strong>
                    {' | '}total ({searchTime.iterations} runs): {searchTime.totalMs}ms
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="control-group">
                <label className="group-label">SORT ALGORITHM</label>
                <div className="sort-algo-row">
                  <button
                    className={`btn ${sortAlgo === 'merge' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSortAlgo('merge')}
                  >Merge Sort</button>
                  <button
                    className={`btn ${sortAlgo === 'quick' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSortAlgo('quick')}
                  >Quick Sort</button>
                </div>
                {sortTime && (
                  <div className="stat-bar">
                    {sortTime.algo} sort on "{sortTime.col}"
                    {' | '}avg per run: <strong>{sortTime.ms}ms</strong>
                    {' | '}total ({sortTime.iterations} runs): {sortTime.totalMs}ms
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            {displayRows.length === 0 ? (
              <div className="no-results">No rows match your search.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="row-num">#</th>
                    {tableData.headers.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col, sortAlgo)}
                        className={sortCol === col ? 'sorted' : ''}
                        title={`Click to sort by "${col}" using ${sortAlgo} sort`}
                      >
                        <span className="th-content">
                          {col}
                          {sortIndicator(col)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'even' : 'odd'}>
                      <td className="row-num">{ri + 1}</td>
                      {tableData.headers.map(col => (
                        <td key={col} title={String(row[col])}>
                          {highlight(String(row[col]), searchQuery, matchedIndices !== null)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Highlight matching substring in cell
function highlight(text, query, active) {
  if (!active || !query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
