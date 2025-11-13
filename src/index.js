const {
  CHAR_CODE,
  STRUCTURAL_CHARS,
  WHITESPACE_CHARS,
} = require("./constants/index");
const { decodeEscapedUnicode } = require("./utils/decode-escaped-unicode");
const { ensureString } = require("./utils/ensure-string");

/**
 * Fast JSON pretty printer with streaming-style buffering.
 *
 * @param {string | object} inputRaw - Input JSON string or object
 * @param {string} [indent="  "] - Indentation characters, e.g. two spaces or "\t"
 * @returns {string} Pretty-printed JSON
 */
function fastJsonFormat(inputRaw, indentString = "  ") {
  /** @type {string | object} */
  const input = ensureString(inputRaw);
  if (input === undefined) return "";

  // Handle non-string input by delegating to JSON.stringify
  if (typeof input !== "string") {
    try {
      return JSON.stringify(input, null, indentString);
    } catch {
      return "";
    }
  }

  /** @type {string} */
  const json = input;
  const jsonLength = json.length;
  const shouldPrettyPrint =
    typeof indentString === "string" && indentString.length > 0;

  /** @type {number} */
  const CHUNK_SIZE = Math.min(1 << 16, Math.max(1 << 12, input.length / 8)); // 64 KB

  /** @type {string} */
  let textBuffer = "";

  /** @type {TextEncoder} */
  const encoder = new TextEncoder();

  /** @type {Uint8Array} */
  let outputArray = new Uint8Array((jsonLength * 3) << 1);

  /** @type {number} */
  let offset = 0;

  /**
   * Flush buffered text into outputArray.
   * @param {boolean} [isFinal=false] - Whether this is the final flush
   * @returns {void}
   */
  const flushBuffer = (exit) => {
    if (!textBuffer) return;
    const encoded = encoder.encode(textBuffer);
    const needed = offset + encoded.length;

    if (needed > outputArray.length) {
      const newLength = Math.max(needed, outputArray.length << 1);
      const newArray = new Uint8Array(newLength);
      newArray.set(outputArray.subarray(0, offset));
      outputArray = newArray;
    }

    outputArray.set(encoded, offset);
    offset = needed;

    if (!exit) textBuffer = "";
  };

  /**
   * Append text to the buffer, flushing automatically if necessary.
   * @param {string} text
   * @returns {void}
   */
  const append = (content) => {
    textBuffer += content;
    if (textBuffer.length > CHUNK_SIZE) flushBuffer();
  };

  /**
   * Generate an indentation string for a given depth level.
   * @param {number} level
   * @returns {string}
   */
  const makeIndent = (level) => indentString.repeat(level);

  /** @type {number} */
  let index = 0;

  /** @type {number} */
  let depth = 0;

  // === Main scanning loop ===
  while (index < jsonLength) {
    // Skip whitespace
    for (
      ;
      index < jsonLength && WHITESPACE_CHARS[json.charCodeAt(index)];
      index++
    );
    if (index >= jsonLength) break;

    const currentCharCode = json.charCodeAt(index);

    // String literals
    if (currentCharCode === CHAR_CODE.QUOTE) {
      const stringStart = index++;
      while (index < jsonLength) {
        const nextChar = json.charCodeAt(index);
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

      const innerContent = json.slice(stringStart + 1, index - 1);
      const decodedString = decodeEscapedUnicode(innerContent);

      append(`"${decodedString}"`);
      continue;
    }

    // Opening braces/brackets
    if (
      currentCharCode === CHAR_CODE.OPEN_BRACE ||
      currentCharCode === CHAR_CODE.OPEN_BRACKET
    ) {
      const openChar = json[index];
      const closeChar = currentCharCode === CHAR_CODE.OPEN_BRACE ? "}" : "]";

      let lookahead = index + 1;
      while (
        lookahead < jsonLength &&
        WHITESPACE_CHARS[json.charCodeAt(lookahead)]
      )
        lookahead++;

      // Empty object/array
      if (lookahead < jsonLength && json[lookahead] === closeChar) {
        append(openChar + closeChar);
        index = lookahead + 1;
        continue;
      }

      append(openChar);
      if (shouldPrettyPrint) {
        append(`\n${makeIndent(depth + 1)}`);
      }
      depth++;
      index++;
      continue;
    }

    // Closing braces/brackets
    if (
      currentCharCode === CHAR_CODE.CLOSE_BRACE ||
      currentCharCode === CHAR_CODE.CLOSE_BRACKET
    ) {
      depth = Math.max(0, depth - 1);
      if (shouldPrettyPrint) {
        append(`\n${makeIndent(depth)}`);
      }
      append(json[index++]);
      continue;
    }

    // Comma
    if (currentCharCode === CHAR_CODE.COMMA) {
      append(",");
      if (shouldPrettyPrint) {
        append(`\n${makeIndent(depth)}`);
      }
      index++;
      continue;
    }

    // Colon
    if (currentCharCode === CHAR_CODE.COLON) {
      if (shouldPrettyPrint) append(": ");
      else append(":");
      index++;
      continue;
    }

    // Regular values (numbers, literals, etc.)
    const tokenStart = index;
    while (
      index < jsonLength &&
      !STRUCTURAL_CHARS[json.charCodeAt(index)] &&
      !WHITESPACE_CHARS[json.charCodeAt(index)]
    ) {
      index++;
    }
    append(json.slice(tokenStart, index));
  }

  // Flush any remaining buffer
  if (textBuffer.length) flushBuffer(1);

  return new TextDecoder().decode(outputArray.subarray(0, offset));
}

module.exports = fastJsonFormat;
