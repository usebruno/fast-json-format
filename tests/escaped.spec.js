const { assertEqual } = require('./utils');

describe('string handling', () => {
  it('should handle escaped quotes correctly', () => {
    const input = '{"quote":"She said \\"Hello\\""}';
    const expected = `{
  "quote": "She said \\"Hello\\""
}`;
    assertEqual(input, expected);
  });

  it('should handle multiple escaped quotes', () => {
    const input = '{"text":"\\"start\\" middle \\"end\\""}';
    const expected = `{
  "text": "\\"start\\" middle \\"end\\""
}`;
    assertEqual(input, expected);
  });

  it('should handle backslashes correctly', () => {
    const input = '{"path":"C:\\\\Users\\\\file.txt"}';
    const expected = `{
  "path": "C:\\\\Users\\\\file.txt"
}`;
    assertEqual(input, expected);
  });

  it('should handle strings with special characters', () => {
    const input = '{"special":"{}[],:"}';
    const expected = `{
  "special": "{}[],:"
}`;
    assertEqual(input, expected);
  });

  it('should handle strings with newlines and special chars', () => {
    const input = '{"multiline":"line1\\nline2\\nline3"}';
    const expected = `{
  "multiline": "line1\\nline2\\nline3"
}`;
    assertEqual(input, expected);
  });
});

describe('escaped characters', () => {
  it('should handle double backslash before quote', () => {
    const input = '{"path":"C:\\\\Program Files\\\\"}';
    const expected = `{
  "path": "C:\\\\Program Files\\\\"
}`;
    assertEqual(input, expected);
  });

  it('should handle odd number of backslashes before quote', () => {
    const input = '{"text":"before\\\\\\\\"}';
    const expected = `{
  "text": "before\\\\\\\\"
}`;
    assertEqual(input, expected);
  });

  it('should handle escaped backslash followed by escaped quote', () => {
    const input = '{"mixed":"test\\\\\\"end"}';
    const expected = `{
  "mixed": "test\\\\\\"end"
}`;
    assertEqual(input, expected);
  });
});

describe('forward slash escape sequences', () => {
  it('should decode \\/ escape sequences to forward slashes', () => {
    const input = '{"url":"https:\\/\\/example.com\\/api\\/v1"}';
    const expected = `{
  "url": "https://example.com/api/v1"
}`;
    assertEqual(input, expected);
  });

  it('should handle unescaped forward slashes correctly', () => {
    const input = '{"url":"https://example.com/api/v1"}';
    const expected = `{
  "url": "https://example.com/api/v1"
}`;
    assertEqual(input, expected);
  });

  it('should handle forward slashes mixed with other escape sequences', () => {
    const input = '{"text":"line1\\npath\\/to\\/file\\ttab","unicode":"\\u4e16\\u754c\\/path"}';
    const expected = `{
  "text": "line1\\npath/to/file\\ttab",
  "unicode": "世界/path"
}`;
    assertEqual(input, expected);
  });

  it('should handle a single escaped forward slash', () => {
    const input = '{"slash":"\\/"}';
    const expected = `{
  "slash": "/"
}`;
    assertEqual(input, expected);
  });

  it('should handle multiple consecutive escaped forward slashes', () => {
    const input = '{"path":"\\/\\/network\\/share"}';
    const expected = `{
  "path": "//network/share"
}`;
    assertEqual(input, expected);
  });

  it('should handle escaped forward slash at end of string', () => {
    const input = '{"url":"https://example.com\\/"}';
    const expected = `{
  "url": "https://example.com/"
}`;
    assertEqual(input, expected);
  });
});