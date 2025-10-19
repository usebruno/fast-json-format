const { assertEqual } = require('./utils');

describe('basic functionality', () => {
  it('should format a simple object', () => {
    const input = '{"name":"John","age":30}';
    const expected = `{
  "name": "John",
  "age": 30
}`;

    assertEqual(input, expected);
  });

  it('should format a simple array', () => {
    const input = '[1,2,3,4,5]';
    const expected = `[
  1,
  2,
  3,
  4,
  5
]`;

    assertEqual(input, expected);
  });

  it('should preserve whitespace inside strings', () => {
    const input = '{"text":"Hello   World"}';
    const expected = `{
  "text": "Hello   World"
}`;
    assertEqual(input, expected);
  });
});

describe('boolean and null values', () => {
  it('should format boolean values', () => {
    const input = '{"active":true,"deleted":false}';
    const expected = `{
  "active": true,
  "deleted": false
}`;
    assertEqual(input, expected);
  });

  it('should format null values', () => {
    const input = '{"value":null}';
    const expected = `{
  "value": null
}`;
    assertEqual(input, expected);
  });

  it('should format mixed value types', () => {
    const input = '{"string":"text","number":42,"boolean":true,"null":null}';
    const expected = `{
  "string": "text",
  "number": 42,
  "boolean": true,
  "null": null
}`;
    assertEqual(input, expected);
  });
});

describe('numeric values', () => {
  it('should format integer values', () => {
    const input = '{"count":100}';
    const expected = `{
  "count": 100
}`;
    assertEqual(input, expected);
  });

  it('should format floating point values', () => {
    const input = '{"price":19.99,"tax":2.5}';
    const expected = `{
  "price": 19.99,
  "tax": 2.5
}`;
    assertEqual(input, expected);
  });

  it('should format negative numbers', () => {
    const input = '{"temperature":-10,"balance":-500.25}';
    const expected = `{
  "temperature": -10,
  "balance": -500.25
}`;
    assertEqual(input, expected);
  });
});