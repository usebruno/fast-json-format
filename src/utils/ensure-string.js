/**
 * Safely convert a String object to a primitive string.
 *
 * @template T
 * @param {T} value - Any input value
 * @returns {string | T} String value if applicable, otherwise unchanged
 */
function ensureString(input) {
  return input instanceof String ? input.toString() : input;
}

module.exports = { ensureString };
