/**
 * JSON syntax characters to their ASCII codes mapping
 */
const ASCII_CHARS = {
  QUOTE: 34,
  BACKSLASH: 92,
  SLASH: 47,
  OPEN_BRACE: 123,
  CLOSE_BRACE: 125,
  OPEN_BRACKET: 91,
  CLOSE_BRACKET: 93,
  COMMA: 44,
  COLON: 58,
  SPACE: 32,
  TAB: 9,
  LF: 10,
  CR: 13,
  u: 117,
};

/**
 * Pretty print JSON
 *
 * @param {string | object} inputRaw JSON string or object to format
 * @param {string} [indentStr="  "] Indentation string (default: two spaces)
 * @returns {string} Formatted JSON string
 */
function fastJsonFormat(inputRaw, indentStr = "  ") {
  if (inputRaw === undefined) return "";

  let input = inputRaw;
  if (
    typeof inputRaw === "object" &&
    inputRaw !== null &&
    inputRaw.constructor === String
  ) {
    input = inputRaw.valueOf();
  }

  if (typeof input !== "string") {
    try {
      return JSON.stringify(input, null, indentStr);
    } catch {
      return "";
    }
  }

  const json = input;
  const jsonLength = json.length;

  const indent =
    typeof indentStr === "string" && indentStr.length > 0 ? indentStr : "  ";
  const shouldIndent = typeof indentStr === "string" && indentStr.length > 0;

  const indentCache = new Array(101);
  indentCache[0] = "";
  for (let d = 1; d <= 100; d++) {
    indentCache[d] = indentCache[d - 1] + indent;
  }

  let output = "";
  let index = 0;
  let depth = 0;

  while (index < jsonLength) {
    while (index < jsonLength) {
      const charCode = json.charCodeAt(index);

      if (
        charCode !== ASCII_CHARS.SPACE &&
        charCode !== ASCII_CHARS.TAB &&
        charCode !== ASCII_CHARS.LF &&
        charCode !== ASCII_CHARS.CR
      )
        break;

      index++;
    }

    if (index >= jsonLength) break;

    const ch = json.charCodeAt(index);

    if (ch === ASCII_CHARS.QUOTE) {
      const strStart = index++;

      while (index < jsonLength) {
        const c = json.charCodeAt(index);

        if (c === ASCII_CHARS.QUOTE) {
          index++;
          break;
        }

        if (c === ASCII_CHARS.BACKSLASH) {
          index += 2;
        } else {
          index++;
        }
      }

      const rawContent = json.substring(strStart + 1, index - 1);

      if (
        rawContent.indexOf("\\u") === -1 &&
        rawContent.indexOf("\\/") === -1
      ) {
        output += '"' + rawContent + '"';

        continue;
      }

      let decoded = "";
      let i = 0;
      const len = rawContent.length;

      while (i < len) {
        const cc = rawContent.charCodeAt(i);

        if (
          cc === ASCII_CHARS.BACKSLASH &&
          i + 5 < len &&
          rawContent.charCodeAt(i + 1) === ASCII_CHARS.u
        ) {
          const hex = rawContent.substring(i + 2, i + 6);
          const code = parseInt(hex, 16);

          if (!isNaN(code)) {
            decoded += String.fromCharCode(code);
            i += 6;

            continue;
          }
        }

        if (
          cc === ASCII_CHARS.BACKSLASH &&
          i + 1 < len &&
          rawContent.charCodeAt(i + 1) === ASCII_CHARS.SLASH
        ) {
          decoded += "/";
          i += 2;

          continue;
        }

        decoded += rawContent[i];
        i++;
      }

      output += '"' + decoded + '"';

      continue;
    }

    if (ch === ASCII_CHARS.OPEN_BRACE || ch === ASCII_CHARS.OPEN_BRACKET) {
      const openChar = json[index];
      const closeCode =
        ch === ASCII_CHARS.OPEN_BRACE
          ? ASCII_CHARS.CLOSE_BRACE
          : ASCII_CHARS.CLOSE_BRACKET;

      let j = index + 1;
      while (j < jsonLength) {
        const c = json.charCodeAt(j);
        if (
          c !== ASCII_CHARS.SPACE &&
          c !== ASCII_CHARS.TAB &&
          c !== ASCII_CHARS.LF &&
          c !== ASCII_CHARS.CR
        ) {
          break;
        }

        j++;
      }

      if (j < jsonLength && json.charCodeAt(j) === closeCode) {
        output += openChar + json[j];
        index = j + 1;

        continue;
      }

      output += openChar;

      if (shouldIndent) {
        depth++;

        const indentStr =
          depth <= 100 ? indentCache[depth] : indent.repeat(depth);

        output += "\n" + indentStr;
      }

      index++;

      continue;
    }

    if (ch === ASCII_CHARS.CLOSE_BRACE || ch === ASCII_CHARS.CLOSE_BRACKET) {
      depth = Math.max(0, depth - 1);

      if (shouldIndent) {
        const indentStr =
          depth <= 100 ? indentCache[depth] : indent.repeat(depth);

        output += "\n" + indentStr;
      }

      output += json[index];
      index++;

      continue;
    }

    if (ch === ASCII_CHARS.COMMA) {
      output += ",";

      if (shouldIndent) {
        const indentStr =
          depth <= 100 ? indentCache[depth] : indent.repeat(depth);

        output += "\n" + indentStr;
      }

      index++;

      continue;
    }

    if (ch === ASCII_CHARS.COLON) {
      output += shouldIndent ? ": " : ":";
      index++;

      continue;
    }

    const tokenStart = index;
    while (index < jsonLength) {
      const c = json.charCodeAt(index);

      if (
        c === ASCII_CHARS.SPACE ||
        c === ASCII_CHARS.TAB ||
        c === ASCII_CHARS.LF ||
        c === ASCII_CHARS.CR ||
        c === ASCII_CHARS.COMMA ||
        c === ASCII_CHARS.COLON ||
        c === ASCII_CHARS.OPEN_BRACE ||
        c === ASCII_CHARS.CLOSE_BRACE ||
        c === ASCII_CHARS.OPEN_BRACKET ||
        c === ASCII_CHARS.CLOSE_BRACKET
      ) {
        break;
      }

      index++;
    }

    output += json.substring(tokenStart, index);
  }

  return output;
}

module.exports = fastJsonFormat;
