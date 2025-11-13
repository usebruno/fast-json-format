/**
 * Decodes escaped Unicode sequences like "\u0041" → "A"
 * Also converts escaped forward slashes "\/" → "/"
 *
 * @param {string} str - Input string possibly containing escape sequences
 * @returns {string} Decoded string
 */
function decodeEscapedUnicode(input) {
  if (input.indexOf("\\u") === -1 && input.indexOf("\\/") === -1) {
    return input;
  }

  /** @type {string[]} */
  let output = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input.charCodeAt(i);

    // Handle \uXXXX
    if (ch === 92 && i + 5 < len && input.charCodeAt(i + 1) === 117) {
      const hex = input.substr(i + 2, 4);
      const code = parseInt(hex, 16);
      if (!isNaN(code)) {
        output.push(String.fromCharCode(code));
        i += 6;
        continue;
      }
    }

    // Handle "\/"
    if (ch === 92 && i + 1 < len && input.charCodeAt(i + 1) === 47) {
      output.push("/");
      i += 2;
      continue;
    }

    // Normal character
    output.push(input[i]);
    i++;
  }

  return output.join("");
}

module.exports = { decodeEscapedUnicode };
