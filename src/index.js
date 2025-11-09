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

  // Helper: check if character code is a valid hex digit (0-9, A-F, a-f)
  const isHexDigit = (code) => {
    return (code >= 48 && code <= 57) ||   // 0-9
           (code >= 65 && code <= 70) ||   // A-F
           (code >= 97 && code <= 102);    // a-f
  };

  // Helper: parse 4 hex digits starting at position j
  // Returns -1 if invalid, otherwise the code point
  const parseHex4 = (j) => {
    if (j + 4 > n) return -1;
    const c1 = s.charCodeAt(j);
    const c2 = s.charCodeAt(j + 1);
    const c3 = s.charCodeAt(j + 2);
    const c4 = s.charCodeAt(j + 3);
    if (!isHexDigit(c1) || !isHexDigit(c2) || !isHexDigit(c3) || !isHexDigit(c4)) {
      return -1;
    }
    // Fast hex parsing without parseInt
    let val = 0;
    // First digit
    val = c1 <= 57 ? c1 - 48 : (c1 <= 70 ? c1 - 55 : c1 - 87);
    // Second digit
    val = (val << 4) | (c2 <= 57 ? c2 - 48 : (c2 <= 70 ? c2 - 55 : c2 - 87));
    // Third digit
    val = (val << 4) | (c3 <= 57 ? c3 - 48 : (c3 <= 70 ? c3 - 55 : c3 - 87));
    // Fourth digit
    val = (val << 4) | (c4 <= 57 ? c4 - 48 : (c4 <= 70 ? c4 - 55 : c4 - 87));
    return val;
  };

  // Scan a JSON string starting at index of opening quote `i` (s[i] === '"').
  // Returns index just after the closing quote and decodes \uXXXX sequences.
  const scanString = (i) => {
    out.push('"'); // opening quote
    let j = i + 1;
    let lastCopy = j; // track where we last copied from
    
    while (j < n) {
      const c = s.charCodeAt(j);
      if (c === QUOTE) { // end of string
        // Copy any remaining content before the closing quote
        if (j > lastCopy) {
          out.push(s.slice(lastCopy, j));
        }
        out.push('"'); // closing quote
        return j + 1;
      }
      if (c === BACKSLASH) {
        const backslashPos = j;
        j++;
        if (j < n && s.charCodeAt(j) === 117 /* 'u' */) {
          // Found \uXXXX - try to decode it to actual unicode character
          const codePoint = parseHex4(j + 1);
          
          if (codePoint >= 0) {
            // Valid hex sequence - decode it
            // Copy everything up to the backslash
            if (backslashPos > lastCopy) {
              out.push(s.slice(lastCopy, backslashPos));
            }
            // Convert to actual unicode character
            out.push(String.fromCharCode(codePoint));
            j += 5; // skip 'u' + 4 hex digits
            lastCopy = j;
            continue;
          }
          // If parsing failed, reset and let it be copied as-is
          j = backslashPos + 1;
        }
        // For other escapes (or invalid \u), just skip the escaped char
        if (j < n) j++;
        continue;
      }
      j++;
    }
    // Unterminated: copy remaining content (forgiving)
    if (n > lastCopy) {
      out.push(s.slice(lastCopy, n));
    }
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
