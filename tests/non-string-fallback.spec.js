const fastJsonFormat = require('../src/index');

// For non-string input, we should default to JSON.stringify behavior

describe('non-string fallback', () => {
  it('should default to JSON.stringify behavior object input', () => {
    const input = { active: true, deleted: false };
    const expected = `{
  "active": true,
  "deleted": false
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it('should default to JSON.stringify behavior array input', () => {
    const input = [1, 2, 3];
    const expected = `[
  1,
  2,
  3
]`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it('should default to JSON.stringify behavior number input', () => {
    const input = 123;
    const expected = `123`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it('should default to JSON.stringify behavior boolean input', () => {
    const input = true;
    const expected = `true`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it('should default to JSON.stringify behavior null input', () => {
    const input = null;
    const expected = `null`;
    expect(fastJsonFormat(input)).toBe(expected);
  });
});