const STRUCTURAL = new Uint8Array(128);
const WHITESPACE = new Uint8Array(128);
(() => {
  [34, 44, 58, 91, 93, 123, 125].forEach((c) => (STRUCTURAL[c] = 1)); // " , : [ ] { }
  [9, 10, 13, 32].forEach((c) => (WHITESPACE[c] = 1)); // \t \n \r space
})();

function fastJsonFormat(input, indent = '  ') {
  if (input === undefined) return '';
  if (typeof input !== 'string') {
    try { return JSON.stringify(input, null, indent); } catch { return ''; }
  }

  const s = String(input);
  const n = s.length;
  const pretty = typeof indent === 'string' && indent.length > 0;
  const out = [];
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
  let decodeUnicode = s.indexOf('\\u') >= 0; // enable only if needed

  const parseHex4 = (j) => {
    const c1 = s.charCodeAt(j), c2 = s.charCodeAt(j + 1),
          c3 = s.charCodeAt(j + 2), c4 = s.charCodeAt(j + 3);
    const isHex = (x) => (x >= 48 && x <= 57) || (x >= 65 && x <= 70) || (x >= 97 && x <= 102);
    if (!isHex(c1) || !isHex(c2) || !isHex(c3) || !isHex(c4)) return -1;
    return ((c1 & 15) << 12) | ((c2 & 15) << 8) | ((c3 & 15) << 4) | (c4 & 15);
  };

  while (i < n) {
    // skip whitespace inline
    while (i < n && WHITESPACE[s.charCodeAt(i)]) i++;
    if (i >= n) break;

    const c = s.charCodeAt(i);

    if (c === QUOTE) {
      const start = i++;
      while (i < n) {
        const cc = s.charCodeAt(i);
        if (cc === QUOTE) { i++; break; }
        if (cc === BACKSLASH) {
          i++;
          if (decodeUnicode && s[i] === 'u' && i + 4 < n) i += 5;
          else i++;
        } else i++;
      }
      out.push(s.slice(start, i));
      continue;
    }

    if (c === OPEN_BRACE || c === OPEN_BRACKET) {
      const openCh = s[i], closeCh = c === OPEN_BRACE ? '}' : ']';
      let k = i + 1;
      while (k < n && WHITESPACE[s.charCodeAt(k)]) k++;
      if (k < n && s[k] === closeCh) { out.push(openCh + closeCh); i = k + 1; continue; }
      out.push(openCh);
      if (pretty) out.push('\n', getIndent(level + 1));
      level++;
      i++;
      continue;
    }

    if (c === CLOSE_BRACE || c === CLOSE_BRACKET) {
      level = Math.max(0, level - 1);
      if (pretty) out.push('\n', getIndent(level));
      out.push(s[i++]);
      continue;
    }

    if (c === COMMA) {
      out.push(',');
      if (pretty) out.push('\n', getIndent(level));
      i++;
      continue;
    }

    if (c === COLON) {
      out.push(pretty ? ': ' : ':');
      i++;
      continue;
    }

    // atom (fast inline scan)
    const start = i;
    while (i < n && !STRUCTURAL[s.charCodeAt(i)] && !WHITESPACE[s.charCodeAt(i)]) i++;
    out.push(s.slice(start, i));
  }

  return out.join('');
}

module.exports = fastJsonFormat;
