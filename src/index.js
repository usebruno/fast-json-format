/**
 * Character classification lookup tables for JSON formatting.
 * STRUCTURAL: Marks structural JSON characters like { } [ ] : ,
 * WHITESPACE: Marks whitespace characters (space, tab, newline, etc.)
 */
const STRUCTURAL_CHAR_CODES = new Uint8Array(128);
const WHITESPACE_CHAR_CODES = new Uint8Array(128);

// Character codes for key JSON tokens
const CHAR_CODE = {
  QUOTE: 34,
  BACKSLASH: 92,
  FORWARD_SLASH: 47,
  OPEN_BRACE: 123,
  CLOSE_BRACE: 125,
  OPEN_BRACKET: 91,
  CLOSE_BRACKET: 93,
  COMMA: 44,
  COLON: 58,
};

(() => {
  // JSON structural characters: " , : [ ] { }
  [34, 44, 58, 91, 93, 123, 125].forEach(
    (charCode) => (STRUCTURAL_CHAR_CODES[charCode] = 1)
  );
  // Whitespace characters: \t \n \r space
  [9, 10, 13, 32].forEach((charCode) => (WHITESPACE_CHAR_CODES[charCode] = 1));
})();

/**
 * Decodes escaped Unicode sequences (e.g. "\\u0041") to actual characters.
 * Optimized to avoid regex and minimize string allocations.
 *
 * @param {string} input - String potentially containing \uXXXX sequences.
 * @returns {string} - Decoded string with proper Unicode characters.
 */
function decodeUnicodeEscapes(input) {
  if (input.indexOf("\\u") === -1 && input.indexOf("\\/") === -1) {
    return input;
  }

  let output = "";
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input.charCodeAt(i);

    // Handle \uXXXX
    if (ch === 92 && i + 5 < len && input.charCodeAt(i + 1) === 117) {
      const hex = input.substr(i + 2, 4);
      const code = parseInt(hex, 16);
      if (!isNaN(code)) {
        output += String.fromCharCode(code);
        i += 6;
        continue;
      }
    }

    // Handle escaped forward slash
    if (ch === 92 && i + 1 < len && input.charCodeAt(i + 1) === 47) {
      output += "/";
      i += 2;
      continue;
    }

    // Copy normal character
    output += input[i];
    i++;
  }

  return output;
}

/**
 * Safely converts a string or `String` object to its primitive string representation.
 * If the input is a `String` object, it calls `toString()`; if it is already a primitive string,
 * the function returns it unchanged. This ensures safe conversion without throwing errors.
 *
 * @param {any | String} str - The string or `String` object to convert.
 * @returns {string} The primitive string representation of the input.
 *
 * @example
 * toStringSafe("hello"); // "hello"
 * toStringSafe(new String("world")); // "world"
 */
function toStringSafe(input) {
  return input instanceof String ? input.toString() : input;
}

/**
 * High-performance JSON pretty printer.
 * Works directly on strings (no JSON.parse), efficiently scanning and reformatting.
 *
 * @param {string|object} input - The JSON string or JS object to format.
 * @param {string} indentString - Indentation (e.g., "  " or "\t"). Defaults to 2 spaces.
 * @returns {string} - Formatted JSON-like output.
 */
function fastJsonFormat(inputRaw, indentString = "  ") {
  const input = toStringSafe(inputRaw);
  if (input === undefined) return "";

  // Handle non-string input by delegating to JSON.stringify
  if (typeof input !== "string") {
    try {
      return JSON.stringify(input, null, indentString);
    } catch {
      return "";
    }
  }

  const jsonText = input;
  const jsonLength = jsonText.length;
  const shouldPrettyPrint =
    typeof indentString === "string" && indentString.length > 0;

  // Buffered writer setup to reduce string concatenation cost
  const CHUNK_SIZE = Math.min(1 << 16, Math.max(1 << 12, input.length / 8)); // 64 KB
  let writeBuffer = "";

  // On Over-provision by 50% to avoid reallocation.
  // Pretty printing usually expands text by less then 2 times.
  const encoder = new TextEncoder();
  let resultArray = new Uint8Array((jsonLength * 3) << 1);
  let offset = 0;

  const flushBuffer = (exit) => {
    if (!writeBuffer) return;
    const encoded = encoder.encode(writeBuffer);
    const needed = offset + encoded.length;

    if (needed > resultArray.length) {
      const newLength = Math.max(needed, resultArray.length << 1);
      const newArray = new Uint8Array(newLength);
      newArray.set(resultArray.subarray(0, offset));
      resultArray = newArray;
    }

    resultArray.set(encoded, offset);
    offset = needed;

    if (!exit) writeBuffer = "";
  };

  const writeToBuffer = (content) => {
    writeBuffer += content;
    if (writeBuffer.length > CHUNK_SIZE) flushBuffer();
  };

  // Cache indentation strings to avoid recomputation
  const indentCache = [""];
  const getIndentation = (level) => {
    if (!shouldPrettyPrint) return "";
    if (indentCache[level]) return indentCache[level];
    let lastIndent = indentCache[indentCache.length - 1];
    for (let depth = indentCache.length; depth <= level; depth++) {
      lastIndent += indentString;
      indentCache[depth] = lastIndent;
    }
    return indentCache[level];
  };

  let index = 0;
  let currentIndentLevel = 0;

  // === Main scanning loop ===
  while (index < jsonLength) {
    // Skip whitespace
    while (
      index < jsonLength &&
      WHITESPACE_CHAR_CODES[jsonText.charCodeAt(index)]
    ) {
      index++;
    }
    if (index >= jsonLength) break;

    const currentCharCode = jsonText.charCodeAt(index);

    // === Handle String Literals ===
    if (currentCharCode === CHAR_CODE.QUOTE) {
      const stringStart = index++;
      while (index < jsonLength) {
        const nextChar = jsonText.charCodeAt(index);
        if (nextChar === CHAR_CODE.QUOTE) {
          index++;
          break;
        }
        if (nextChar === CHAR_CODE.BACKSLASH) {
          index += 2;
        } else {
          index++;
        }
      }

      const innerContent = jsonText.slice(stringStart + 1, index - 1);
      const decodedString = decodeUnicodeEscapes(innerContent);

      writeToBuffer('"');
      writeToBuffer(decodedString);
      writeToBuffer('"');
      continue;
    }

    // === Handle Opening Braces / Brackets ===
    if (
      currentCharCode === CHAR_CODE.OPEN_BRACE ||
      currentCharCode === CHAR_CODE.OPEN_BRACKET
    ) {
      const openChar = jsonText[index];
      const closeChar = currentCharCode === CHAR_CODE.OPEN_BRACE ? "}" : "]";

      // Check for empty object/array: {} or []
      let lookaheadIndex = index + 1;
      while (
        lookaheadIndex < jsonLength &&
        WHITESPACE_CHAR_CODES[jsonText.charCodeAt(lookaheadIndex)]
      ) {
        lookaheadIndex++;
      }
      if (
        lookaheadIndex < jsonLength &&
        jsonText[lookaheadIndex] === closeChar
      ) {
        writeToBuffer(openChar + closeChar);
        index = lookaheadIndex + 1;
        continue;
      }

      writeToBuffer(openChar);
      if (shouldPrettyPrint) {
        writeToBuffer("\n");
        writeToBuffer(getIndentation(currentIndentLevel + 1));
      }
      currentIndentLevel++;
      index++;
      continue;
    }

    // === Handle Closing Braces / Brackets ===
    if (
      currentCharCode === CHAR_CODE.CLOSE_BRACE ||
      currentCharCode === CHAR_CODE.CLOSE_BRACKET
    ) {
      currentIndentLevel = Math.max(0, currentIndentLevel - 1);
      if (shouldPrettyPrint) {
        writeToBuffer("\n");
        writeToBuffer(getIndentation(currentIndentLevel));
      }
      writeToBuffer(jsonText[index++]);
      continue;
    }

    // === Handle Commas ===
    if (currentCharCode === CHAR_CODE.COMMA) {
      writeToBuffer(",");
      if (shouldPrettyPrint) {
        writeToBuffer("\n");
        writeToBuffer(getIndentation(currentIndentLevel));
      }
      index++;
      continue;
    }

    // === Handle Colons ===
    if (currentCharCode === CHAR_CODE.COLON) {
      if (shouldPrettyPrint) writeToBuffer(": ");
      else writeToBuffer(":");
      index++;
      continue;
    }

    // === Handle Primitive Values (numbers, booleans, null, etc.) ===
    const tokenStart = index;
    while (
      index < jsonLength &&
      !STRUCTURAL_CHAR_CODES[jsonText.charCodeAt(index)] &&
      !WHITESPACE_CHAR_CODES[jsonText.charCodeAt(index)]
    ) {
      index++;
    }
    writeToBuffer(jsonText.slice(tokenStart, index));
  }

  // Flush any remaining buffer
  if (writeBuffer.length) flushBuffer(1);

  return new TextDecoder().decode(resultArray.subarray(0, offset));
}

module.exports = fastJsonFormat;
