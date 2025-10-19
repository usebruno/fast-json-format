/**
 * Pretty-prints a JSON-like string without parsing.
 * - Works with invalid JSON and BigInt literals (because it never parses).
 * - Skips whitespace outside strings; preserves whitespace inside strings.
 * - Handles escaped quotes via backslash counting.
 *
 * @param {string} input  The JSON-ish string to format
 * @param {string} indent The indent unit (default: two spaces)
 * @returns {string}
 */
function fastJsonFormat(input, indent = '  ') {
  // Gracefully handle undefined
  if(input === undefined) {
    return '';
  }

  // fon non string input - default to JSON.stringify behavior
  if(typeof input !== 'string') {
    try {
      return JSON.stringify(input, null, indent);
    } catch (e) {
      return ''; // return empty string for invalid JSON
    }
  }

  const s = String(input);
  const n = s.length;
  const out = [];
  let level = 0;
  let inString = false;
  let i = 0;

  // Cache indent strings to avoid recomputing/allocating repeats.
  const indents = [''];
  const getIndent = (k) => {
    if (indents[k] !== undefined) return indents[k];
    // Build incrementally from the last known indent.
    let cur = indents[indents.length - 1];
    for (let j = indents.length; j <= k; j++) {
      cur += indent;
      indents[j] = cur;
    }
    return indents[k];
  };

  // Check if quote at position `pos` is escaped: count trailing backslashes before it.
  const isEscapedQuote = (pos) => {
    let backslashes = 0, j = pos - 1;
    while (j >= 0 && s.charCodeAt(j) === 92) { // 92 = '\'
      backslashes++; j--;
    }
    return (backslashes & 1) === 1; // odd => escaped
  };

  while (i < n) {
    const ch = s[i];

    if (inString) {
      out.push(ch);
      if (ch === '"' && !isEscapedQuote(i)) inString = false;
      i++;
      continue;
    }

    switch (ch) {
      case '"':
        inString = true;
        out.push(ch);
        break;

      case '{':
      case '[':
        out.push(ch, '\n', getIndent(level + 1));
        level++;
        break;

      case '}':
      case ']':
        level = level > 0 ? level - 1 : 0;
        // Check if this is an empty object/array
        // Pattern: last 3 elements are ['{' or '[', '\n', whitespace-only-string]
        const expectedOpen = ch === '}' ? '{' : '[';
        if (out.length >= 3 &&
            out[out.length - 3] === expectedOpen &&
            out[out.length - 2] === '\n' &&
            typeof out[out.length - 1] === 'string' &&
            out[out.length - 1].trim() === '') {
          // Empty object/array: remove the newline and indent
          out.pop(); // remove indent
          out.pop(); // remove newline
          out.push(ch);
        } else {
          out.push('\n', getIndent(level), ch);
        }
        break;

      case ',':
        out.push(',', '\n', getIndent(level));
        break;

      case ':':
        out.push(': ');
        break;

      // Skip extraneous whitespace outside strings
      case ' ':
      case '\t':
      case '\n':
      case '\r':
        break;

      default:
        out.push(ch);
        break;
    }
    i++;
  }

  return out.join('');
}

module.exports = fastJsonFormat;