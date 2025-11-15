/**
 * Lookup table for structural characters in JSON such as {}[],:"
 * @type {Uint8Array}
 */
const STRUCTURAL_CHARS = new Uint8Array(128);

/**
 * Lookup table for whitespace characters (tab, newline, carriage return, space)
 * @type {Uint8Array}
 */
const WHITESPACE_CHARS = new Uint8Array(128);

/**
 * Common JSON structural character codes.
 * @readonly
 * @enum {number}
 */
const CHAR_CODE = {
  QUOTE: 34, // "
  BACKSLASH: 92, // \
  SLASH: 47, // /
  OPEN_BRACE: 123, // {
  CLOSE_BRACE: 125, // }
  OPEN_BRACKET: 91, // [
  CLOSE_BRACKET: 93, // ]
  COMMA: 44, // ,
  COLON: 58, // :
};

// Initialize lookup tables
(() => {
  /** @type {number[]} JSON structural characters: " , : [ ] { } */
  const structuralCodes = [34, 44, 58, 91, 93, 123, 125];
  structuralCodes.forEach((code) => (STRUCTURAL_CHARS[code] = 1));

  /** @type {number[]} Whitespace characters: \t \n \r space */
  const whitespaceCodes = [9, 10, 13, 32];
  whitespaceCodes.forEach((code) => (WHITESPACE_CHARS[code] = 1));
})();

module.exports = { STRUCTURAL_CHARS, WHITESPACE_CHARS, CHAR_CODE };
