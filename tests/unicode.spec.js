const { assertEqual } = require('./utils');
const fastJsonFormat = require('../src/index');

describe('unicode handling', () => {
  it('should decode \\uXXXX escape sequences to unicode characters', () => {
    const input = '{"name":"\\u4e16\\u754c"}';
    const expected = `{
  "name": "世界"
}`;
    assertEqual(input, expected);
  });

  it('should handle mixed ASCII and unicode escapes', () => {
    const input = '{"greeting":"Hello \\u4e16\\u754c"}';
    const expected = `{
  "greeting": "Hello 世界"
}`;
    assertEqual(input, expected);
  });

  it('should decode multiple unicode strings', () => {
    const input = '{"chinese":"\\u4f60\\u597d","japanese":"\\u3053\\u3093\\u306b\\u3061\\u306f"}';
    const expected = `{
  "chinese": "你好",
  "japanese": "こんにちは"
}`;
    assertEqual(input, expected);
  });

  it('should handle emoji surrogate pairs', () => {
    const input = '{"emoji":"\\ud83d\\ude00"}';
    const expected = `{
  "emoji": "😀"
}`;
    assertEqual(input, expected);
  });

  it('should decode unicode in nested objects', () => {
    const input = '{"outer":{"inner":"\\u4e2d\\u6587"}}';
    const expected = `{
  "outer": {
    "inner": "中文"
  }
}`;
    assertEqual(input, expected);
  });

  it('should handle unicode in array values', () => {
    const input = '["\\u4e00","\\u4e8c","\\u4e09"]';
    const expected = `[
  "一",
  "二",
  "三"
]`;
    assertEqual(input, expected);
  });

  it('should handle uppercase hex in unicode escapes', () => {
    const input = '{"text":"\\u4E16\\u754C"}';
    const expected = `{
  "text": "世界"
}`;
    assertEqual(input, expected);
  });

  it('should preserve invalid unicode escapes as-is', () => {
    // Note: This is invalid JSON that JSON.parse would reject
    // Testing forgiving behavior only
    const input = '{"invalid":"\\uXYZ"}';
    const expected = `{
  "invalid": "\\uXYZ"
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it('should preserve incomplete unicode escapes as-is', () => {
    // Note: This is invalid JSON that JSON.parse would reject
    // Testing forgiving behavior only
    const input = '{"incomplete":"\\u12"}';
    const expected = `{
  "incomplete": "\\u12"
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it('should handle unicode mixed with other escape sequences', () => {
    const input = '{"text":"\\u4e16\\n\\u754c\\t\\u0021"}';
    const expected = `{
  "text": "世\\n界\\t!"
}`;
    assertEqual(input, expected);
  });

  it('should behave like JSON.stringify for unicode content', () => {
    // JSON.stringify preserves actual unicode characters (doesn't escape them)
    const obj = { name: "世界" };
    const fromStringify = JSON.stringify(obj, null, 2);
    
    // fastJsonFormat should decode \uXXXX to match that behavior
    const input = '{"name":"\\u4e16\\u754c"}';
    const fromFormatter = fastJsonFormat(input);
    
    expect(fromFormatter).toBe(fromStringify);
  });
});

