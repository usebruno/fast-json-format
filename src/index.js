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
  
  // Pre-allocate array with estimated size to reduce resizing
  const estimatedSize = Math.floor(n * 1.2);
  const out = new Array(estimatedSize);
  let outIndex = 0;
  
  let level = 0;
  let inString = false;
  let i = 0;

  // Cache indent strings to avoid recomputing/allocating repeats.
  const indents = [''];
  const getIndent = (k) => {
    if (indents[k] !== undefined) return indents[k];
    // Build all indents up to k at once
    let cur = indents[indents.length - 1];
    for (let j = indents.length; j <= k; j++) {
      cur += indent;
      indents[j] = cur;
    }
    return indents[k];
  };

  // Character codes for performance
  const QUOTE = 34;      // "
  const BACKSLASH = 92;  // \
  const OPEN_BRACE = 123; // {
  const CLOSE_BRACE = 125; // }
  const OPEN_BRACKET = 91; // [
  const CLOSE_BRACKET = 93; // ]
  const COMMA = 44; // ,
  const COLON = 58; // :
  const SPACE = 32; // ' '
  const TAB = 9;    // '\t'
  const NEWLINE = 10; // '\n'
  const CARRIAGE_RETURN = 13; // '\r'

  // Inline helper to count backslashes
  const countBackslashes = (pos) => {
    let count = 0;
    let j = pos - 1;
    while (j >= 0 && s.charCodeAt(j) === BACKSLASH) {
      count++;
      j--;
    }
    return count;
  };

  while (i < n) {
    const charCode = s.charCodeAt(i);

    if (inString) {
      out[outIndex++] = s[i];
      if (charCode === QUOTE && (countBackslashes(i) & 1) === 0) {
        inString = false;
      }
      i++;
      continue;
    }

    switch (charCode) {
      case QUOTE:
        inString = true;
        out[outIndex++] = s[i];
        break;

      case OPEN_BRACE:
      case OPEN_BRACKET:
        out[outIndex++] = s[i];
        out[outIndex++] = '\n';
        out[outIndex++] = getIndent(level + 1);
        level++;
        break;

      case CLOSE_BRACE:
      case CLOSE_BRACKET:
        level = level > 0 ? level - 1 : 0;
        
        // Check if this is an empty object/array
        const expectedOpen = charCode === CLOSE_BRACE ? '{' : '[';
        if (outIndex >= 3 &&
            out[outIndex - 3] === expectedOpen &&
            out[outIndex - 2] === '\n' &&
            typeof out[outIndex - 1] === 'string' &&
            out[outIndex - 1].trim() === '') {
          // Empty object/array: remove the newline and indent
          outIndex -= 2; // remove newline and indent
          out[outIndex++] = s[i];
        } else {
          out[outIndex++] = '\n';
          out[outIndex++] = getIndent(level);
          out[outIndex++] = s[i];
        }
        break;

      case COMMA:
        out[outIndex++] = ',';
        out[outIndex++] = '\n';
        out[outIndex++] = getIndent(level);
        break;

      case COLON:
        out[outIndex++] = ':';
        out[outIndex++] = ' ';
        break;

      // Skip whitespace - no operation needed
      case SPACE:
      case TAB:
      case NEWLINE:
      case CARRIAGE_RETURN:
        break;

      default:
        out[outIndex++] = s[i];
        break;
    }
    i++;
  }

  // Join only the used portion of the array
  return out.slice(0, outIndex).join('');
}

module.exports = fastJsonFormat;