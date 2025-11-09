const STRUCTURAL = new Uint8Array(128);
const WHITESPACE = new Uint8Array(128);
(() => {
  [34, 44, 58, 91, 93, 123, 125].forEach((c) => (STRUCTURAL[c] = 1)); // " , : [ ] { }
  [9, 10, 13, 32].forEach((c) => (WHITESPACE[c] = 1)); // \t \n \r space
})();

// High-performance Unicode decoding without regex
function decodeUnicodeString(str) {
  if (str.indexOf('\\u') === -1) return str;
  let out = '';
  const n = str.length;
  for (let i = 0; i < n; i++) {
    const ch = str.charCodeAt(i);
    if (ch === 92 && str.charCodeAt(i + 1) === 117 && i + 5 < n) { // \u
      const code = parseInt(str.substr(i + 2, 4), 16);
      if (!isNaN(code)) {
        // Handle surrogate pairs
        if (code >= 0xd800 && code <= 0xdbff && i + 11 < n &&
            str.charCodeAt(i + 6) === 92 && str.charCodeAt(i + 7) === 117) {
          const low = parseInt(str.substr(i + 8, 4), 16);
          if (!isNaN(low) && low >= 0xdc00 && low <= 0xdfff) {
            out += String.fromCodePoint(((code - 0xd800) << 10) + (low - 0xdc00) + 0x10000);
            i += 11;
            continue;
          }
        }
        out += String.fromCharCode(code);
        i += 5;
        continue;
      }
    }
    out += str[i];
  }
  return out;
}

// High-performance JSON formatter
function fastJsonFormat(input, indent = '  ') {
  if (input === undefined) return '';
  if (typeof input !== 'string') {
    try { return JSON.stringify(input, null, indent); } catch { return ''; }
  }

  const s = input;
  const n = s.length;
  const pretty = typeof indent === 'string' && indent.length > 0;

  // chunked output builder (avoids large Array.push overhead)
  const CHUNK_SIZE = 1 << 16; // 64KB per chunk
  const chunks = [];
  let buffer = '';
  const flush = () => { chunks.push(buffer); buffer = ''; };
  const write = (x) => {
    buffer += x;
    if (buffer.length > CHUNK_SIZE) flush();
  };

  // precomputed indents
  const indents = [''];
  const getIndent = (k) => {
    if (!pretty) return '';
    if (indents[k]) return indents[k];
    let cur = indents[indents.length - 1];
    for (let j = indents.length; j <= k; j++) {
      cur += indent;
      indents[j] = cur;
    }
    return indents[k];
  };

  const QUOTE = 34, BACKSLASH = 92, OPEN_BRACE = 123, CLOSE_BRACE = 125,
        OPEN_BRACKET = 91, CLOSE_BRACKET = 93, COMMA = 44, COLON = 58;

  let i = 0, level = 0;

  while (i < n) {
    while (i < n && WHITESPACE[s.charCodeAt(i)]) i++;
    if (i >= n) break;

    const c = s.charCodeAt(i);

    if (c === QUOTE) {
      const start = i++;
      while (i < n) {
        const cc = s.charCodeAt(i);
        if (cc === QUOTE) { i++; break; }
        if (cc === BACKSLASH) i += 2;
        else i++;
      }
      const inner = s.slice(start + 1, i - 1);
      const decoded = decodeUnicodeString(inner);
      write('"'); write(decoded); write('"');
      continue;
    }

    if (c === OPEN_BRACE || c === OPEN_BRACKET) {
      const openCh = s[i];
      const closeCh = c === OPEN_BRACE ? '}' : ']';
      let k = i + 1;
      while (k < n && WHITESPACE[s.charCodeAt(k)]) k++;
      if (k < n && s[k] === closeCh) { write(openCh + closeCh); i = k + 1; continue; }
      write(openCh);
      if (pretty) { write('\n'); write(getIndent(level + 1)); }
      level++;
      i++;
      continue;
    }

    if (c === CLOSE_BRACE || c === CLOSE_BRACKET) {
      level = Math.max(0, level - 1);
      if (pretty) { write('\n'); write(getIndent(level)); }
      write(s[i++]);
      continue;
    }

    if (c === COMMA) {
      write(',');
      if (pretty) { write('\n'); write(getIndent(level)); }
      i++;
      continue;
    }

    if (c === COLON) {
      if (pretty) write(': ');
      else write(':');
      i++;
      continue;
    }

    const start = i;
    while (i < n && !STRUCTURAL[s.charCodeAt(i)] && !WHITESPACE[s.charCodeAt(i)]) i++;
    write(s.slice(start, i));
  }

  if (buffer.length) chunks.push(buffer);
  return chunks.join('');
}

module.exports = fastJsonFormat;
