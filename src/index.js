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

  const scanString = (i) => {
    let j = i + 1;
    while (j < n) {
      const c = s.charCodeAt(j);
      if (c === QUOTE) {
        j++;
        out.push(s.slice(i, j));
        return j;
      }
      if (c === BACKSLASH) {
        j++;
        if (j < n && s.charCodeAt(j) === 117) j += 5;
        else j++;
        continue;
      }
      j++;
    }
    out.push(s.slice(i, n));
    return n;
  };

  let i = 0;
  while (i < n) {
    // 🔥 Faster inline skipWS (no per-call function)
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

    // 🔥 inline scanAtom (cached charCode)
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
