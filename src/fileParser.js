import * as XLSX from 'xlsx';

export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (!['xlsx', 'csv', 'txt', 'dat'].includes(ext)) {
    throw new Error(`Unsupported file type: .${ext}`);
  }

  const buffer = await file.arrayBuffer();

  if (ext === 'xlsx') {
    return parseWithXLSX(buffer);
  }


  let text = new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '');


  text = text
    .split(/\r?\n/)
    .map(line => {
      let trimmed = line.trim();
   
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.substring(1, trimmed.length - 1);
      }
      return trimmed;
    })
    .filter(l => l !== '')
    .join('\n');

  const lines = text.split('\n');
  if (lines.length < 2) throw new Error('File must have at least a header row and one data row.');

  // 3. Detect Delimiter (now works on cleaned headers)
  const delimiter = detectDelimiter(lines[0], ext);

  // 4. Parse with XLSX
  const wb = XLSX.read(text, {
    type: 'string',
    FS: delimiter,
    raw: false,
  });

  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (raw.length === 0) throw new Error('No data found in file.');

  const headers = raw[0].map(h => String(h).trim());

  // 5. Validation & Fallback
  if (headers.length === 1) {
    // If it still fails to split, try manual fallback
    return parseManual(lines, delimiter);
  }

  const rows = raw.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = String(r[i] ?? '').trim(); });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));

  return { headers, rows };
}

function detectDelimiter(firstLine, ext) {
  // If it's explicitly .csv, we assume comma
  if (ext === 'csv') return ',';

  const candidates = [',', '\t', '|', ';'];
  let best = ',';
  let bestCount = -1;

  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function parseManual(lines, delimiter) {
  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === delimiter && !inQ) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const cells = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? '').replace(/^"|"$/g, '').trim();
    });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));

  return { headers, rows };
}

async function parseWithXLSX(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  const headers = raw[0].map(String);
  const rows = raw.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = String(r[i] ?? '').trim(); });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));
  
  return { headers, rows };
}