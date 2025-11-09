/**
 * Pretty-prints a JSON-like string without parsing.
 * Optimized: static lookup tables, fewer charCodeAt() calls, and no per-call setup.
 *
 * @param {string} input
 * @param {string} indent
 * @returns {string}
 */

// --- ✅ static lookup tables created ONCE ---
const STRUCTURAL = new Uint8Array(128);
const WHITESPACE = new Uint8Array(128);
(() => {
  [34, 44, 58, 91, 93, 123, 125].forEach((c) => (STRUCTURAL[c] = 1)); // " , : [ ] { }
  [9, 10, 13, 32].forEach((c) => (WHITESPACE[c] = 1)); // \t \n \r space
})();

function fastJsonFormat(input, indent = '  ') {
  if (input === undefined) return '';

  if (typeof input !== 'string') {
    try {
      return JSON.stringify(input, null, indent);
    } catch {
      return '';
    }
  }

  const s = String(input);
  const n = s.length;
  const useIndent = typeof indent === 'string' ? indent : '  ';
  const pretty = useIndent.length > 0;

  const out = [];
  let level = 0;

  const indents = [''];
  const getIndent = (k) => {
    if (!pretty) return '';
    if (indents[k] !== undefined) return indents[k];
    let cur = indents[indents.length - 1];
    for (let j = indents.length; j <= k; j++) {
      cur += useIndent;
      indents[j] = cur;
    }
    return indents[k];
  };

  const QUOTE = 34;
  const BACKSLASH = 92;
  const OPEN_BRACE = 123;
  const CLOSE_BRACE = 125;
  const OPEN_BRACKET = 91;
  const CLOSE_BRACKET = 93;
  const COMMA = 44;
  const COLON = 58;

  // --- Unicode helper functions from main branch ---
  const isHexDigit = (code) =>
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 70) || // A-F
    (code >= 97 && code <= 102);  // a-f

  const parseHex4 = (j) => {
    if (j + 4 > n) return -1;
    const c1 = s.charCodeAt(j);
    const c2 = s.charCodeAt(j + 1);
    const c3 = s.charCodeAt(j + 2);
    const c4 = s.charCodeAt(j + 3);
    if (!isHexDigit(c1) || !isHexDigit(c2) || !isHexDigit(c3) || !isHexDigit(c4)) {
      return -1;
    }
    let val = 0;
    val = c1 <= 57 ? c1 - 48 : (c1 <= 70 ? c1 - 55 : c1 - 87);
    val = (val << 4) | (c2 <= 57 ? c2 - 48 : (c2 <= 70 ? c2 - 55 : c2 - 87));
    val = (val << 4) | (c3 <= 57 ? c3 - 48 : (c3 <= 70 ? c3 - 55 : c3 - 87));
    val = (val << 4) | (c4 <= 57 ? c4 - 48 : (c4 <= 70 ? c4 - 55 : c4 - 87));
    return val;
  };

  // --- Unified scanString: fast path + Unicode decoding ---
  const scanString = (i) => {
    out.push('"');
    let j = i + 1;
    let lastCopy = j;

    while (j < n) {
      const c = s.charCodeAt(j);
      if (c === QUOTE) {
        if (j > lastCopy) out.push(s.slice(lastCopy, j));
        out.push('"');
        return j + 1;
      }

      if (c === BACKSLASH) {
        const backslashPos = j;
        j++;
        if (j < n && s.charCodeAt(j) === 117 /* 'u' */) {
          const codePoint = parseHex4(j + 1);
          if (codePoint >= 0) {
            if (backslashPos > lastCopy) out.push(s.slice(lastCopy, backslashPos));
            out.push(String.fromCharCode(codePoint));
            j += 5; // skip 'u' + 4 hex digits
            lastCopy = j;
            continue;
          }
          j = backslashPos + 1;
        }
        if (j < n) j++;
        continue;
      }

      j++;
    }

    // Unterminated string fallback
    if (n > lastCopy) out.push(s.slice(lastCopy, n));
    return n;
  };

  // --- Main scan loop ---
  let i = 0;
  while (i < n) {
    while (i < n && WHITESPACE[s.charCodeAt(i)]) i++;
    if (i >= n) break;

    const c = s.charCodeAt(i);

    if (c === QUOTE) {
      i = scanString(i);
      continue;
    }

    if (c === OPEN_BRACE || c === OPEN_BRACKET) {
      const openCh = s[i];
      const closeCh = c === OPEN_BRACE ? '}' : ']';
      let k = i + 1;
      while (k < n && WHITESPACE[s.charCodeAt(k)]) k++;
      if (k < n && s[k] === closeCh) {
        out.push(openCh, closeCh);
        i = k + 1;
        continue;
      }
      out.push(openCh);
      if (pretty) out.push('\n', getIndent(level + 1));
      level++;
      i++;
      continue;
    }

    if (c === CLOSE_BRACE || c === CLOSE_BRACKET) {
      level = level > 0 ? level - 1 : 0;
      if (pretty) out.push('\n', getIndent(level));
      out.push(s[i]);
      i++;
      continue;
    }

    if (c === COMMA) {
      out.push(',');
      if (pretty) out.push('\n', getIndent(level));
      i++;
      continue;
    }

    if (c === COLON) {
      if (pretty) out.push(':', ' ');
      else out.push(':');
      i++;
      continue;
    }

    // Fast atom scan
    let j = i;
    while (j < n) {
      const cj = s.charCodeAt(j);
      if (STRUCTURAL[cj] || WHITESPACE[cj]) break;
      j++;
    }
    if (j > i) out.push(s.slice(i, j));
    i = j;
  }

  return out.join('');
}

module.exports = fastJsonFormat;
