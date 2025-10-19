/**
 * Pretty-prints a JSON-like string without parsing.
 * Fast path: chunked copying, fast string scan, lookahead for empty {} / [].
 *
 * @param {string} input
 * @param {string} indent
 * @returns {string}
 */
function fastJsonFormat(input, indent = '  ') {
  if (input === undefined) return '';

  // For non-string input, fall back to JSON.stringify behavior.
  if (typeof input !== 'string') {
    try {
      return JSON.stringify(input, null, indent);
    } catch {
      return '';
    }
  }

  const s = String(input);
  const n = s.length;

  // Fast minify-like path when indent is empty.
  const useIndent = typeof indent === 'string' ? indent : '  ';
  const pretty = useIndent.length > 0;

  // Output as array of chunks (strings). Much faster than char-by-char.
  const out = [];
  let level = 0;

  // Cached indents.
  const indents = [''];
  const getIndent = (k) => {
    if (!pretty) return ''; // minify fast-path
    if (indents[k] !== undefined) return indents[k];
    let cur = indents[indents.length - 1];
    for (let j = indents.length; j <= k; j++) {
      cur += useIndent;
      indents[j] = cur;
    }
    return indents[k];
  };

  // Character codes
  const QUOTE = 34;        // "
  const BACKSLASH = 92;    // \
  const OPEN_BRACE = 123;  // {
  const CLOSE_BRACE = 125; // }
  const OPEN_BRACKET = 91; // [
  const CLOSE_BRACKET = 93;// ]
  const COMMA = 44;        // ,
  const COLON = 58;        // :
  const SPACE = 32;        // ' '
  const TAB = 9;           // '\t'
  const NEWLINE = 10;      // '\n'
  const CR = 13;           // '\r'

  const isSpaceCode = (c) =>
    c === SPACE || c === TAB || c === NEWLINE || c === CR;

  // Skip whitespace starting at idx; return first non-space index (<= n)
  const skipWS = (idx) => {
    while (idx < n && isSpaceCode(s.charCodeAt(idx))) idx++;
    return idx;
  };

  // Scan a JSON string starting at index of opening quote `i` (s[i] === '"').
  // Returns index just after the closing quote and pushes the entire slice.
  const scanString = (i) => {
    let j = i + 1;
    while (j < n) {
      const c = s.charCodeAt(j);
      if (c === QUOTE) { // end of string
        j++;
        out.push(s.slice(i, j));
        return j;
      }
      if (c === BACKSLASH) {
        // Handle escape: \" \\ \/ \b \f \n \r \t or \uXXXX
        j++;
        if (j < n && s.charCodeAt(j) === 117 /* 'u' */) {
          // Skip 'u' + 4 hex digits if present
          // (Keep it forgiving; don't validate hex strictly)
          j += 5; // 'u' + 4 chars
        } else {
          j++; // skip the escaped char
        }
        continue;
      }
      j++;
    }
    // Unterminated: copy to end (forgiving)
    out.push(s.slice(i, n));
    return n;
  };

  // Copy a run of non-structural, non-space characters starting at i.
  // Stops at space or one of the structural chars ,:{}[]"
  const scanAtom = (i) => {
    let j = i;
    scan: while (j < n) {
      const c = s.charCodeAt(j);
      switch (c) {
        case SPACE:
        case TAB:
        case NEWLINE:
        case CR:
        case QUOTE:
        case OPEN_BRACE:
        case CLOSE_BRACE:
        case OPEN_BRACKET:
        case CLOSE_BRACKET:
        case COMMA:
        case COLON:
          break scan;
      }
      j++;
    }
    if (j > i) out.push(s.slice(i, j));
    return j;
  };

  let i = 0;

  while (i < n) {
    i = skipWS(i);
    if (i >= n) break;

    const c = s.charCodeAt(i);

    // Strings
    if (c === QUOTE) {
      i = scanString(i);
      continue;
    }

    // Structural tokens
    if (c === OPEN_BRACE || c === OPEN_BRACKET) {
      const openCh = s[i];
      const isBrace = c === OPEN_BRACE;
      const closeCh = isBrace ? '}' : ']';

      // Lookahead for empty {} or []: skip spaces to next significant char
      let k = skipWS(i + 1);
      if (k < n && s[k] === closeCh) {
        // Emit {} / [] (no newline/indent)
        out.push(openCh, closeCh);
        i = k + 1;
        continue;
      }

      // Non-empty: normal pretty formatting
      out.push(openCh);
      if (pretty) {
        out.push('\n', getIndent(level + 1));
      }
      level++;
      i++;
      continue;
    }

    if (c === CLOSE_BRACE || c === CLOSE_BRACKET) {
      level = level > 0 ? level - 1 : 0;
      if (pretty) {
        out.push('\n', getIndent(level));
      }
      out.push(s[i]);
      i++;
      continue;
    }

    if (c === COMMA) {
      out.push(',');
      if (pretty) {
        out.push('\n', getIndent(level));
      }
      i++;
      continue;
    }

    if (c === COLON) {
      if (pretty) {
        out.push(':', ' ');
      } else {
        out.push(':');
      }
      i++;
      continue;
    }

    // Outside strings & not structural: copy a whole run (numbers, literals, bigint suffix, identifiers)
    i = scanAtom(i);
  }

  return out.join('');
}

module.exports = fastJsonFormat;
