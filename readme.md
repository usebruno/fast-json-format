# fast-json-format

A JSON formatting library that pretty-prints JSON like strings

## Why?

`JSON.stringify(JSON.parse(str), null, 2)` is fast — but it’s also **lossy** and **strict**:

- **❌ Breaks on BigInt:** `12345678901234567890n`, precision is lost.  
- **⚙️ Loses numeric precision:** `1.2300` becomes `1.23`, zeroes are dropped.  
- **🚫 Fails on imperfect JSON:** Minor syntax issues in “JSON-like” strings can crash it.

`fast-json-format` aims to pretty-print **without losing data or precision**, while staying lightweight and forgiving.  
It preserves **BigInt literals**, **decimal formatting**, and **handles malformed input** gracefully

## Features

- 🔧 Handles invalid/malformed JSON gracefully
- 📦 Works with BigInt literals
- 🎨 Custom indentation support
- 🪶 Lightweight - single file, zero dependencies
- ✅ Thoroughly tested

## Installation

```bash
npm install fast-json-format
```

## Usage

### Basic Usage

```javascript
const fastJsonFormat = require('fast-json-format');

const minified = '{"name":"John","age":30,"city":"New York"}';
const formatted = fastJsonFormat(minified);

console.log(formatted);
// {
//   "name": "John",
//   "age": 30,
//   "city": "New York"
// }
```

### Custom Indentation

```javascript
// Use 4 spaces
const formatted = fastJsonFormat(jsonString, '    ');
```

## Performance

Run benchmarks yourself:

```bash
npm run benchmark
```

JSON.stringify is inherently faster (as it’s native and C++-optimized)
Performance improvements are welcome :)

```text
⚡ 100 KB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Size: 100.2 KB
   ├─ fastJsonFormat: 382 ops/sec ±5.40%
   └─ JSON.stringify: 2,156 ops/sec ±8.13%

   🏆 JSON.stringify is 5.65x faster than fastJsonFormat

⚡ 1 MB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Size: 1024.2 KB
   ├─ fastJsonFormat: 28 ops/sec ±6.97%
   └─ JSON.stringify: 231 ops/sec ±1.16%

   🏆 JSON.stringify is 8.25x faster than fastJsonFormat

⚡ 5 MB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Size: 5120.1 KB
   ├─ fastJsonFormat: 5 ops/sec ±2.87%
   └─ JSON.stringify: 43 ops/sec ±4.72%

   🏆 JSON.stringify is 7.98x faster than fastJsonFormat

⚡ 10 MB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Size: 10240.5 KB
   ├─ fastJsonFormat: 3 ops/sec ±7.90%
   └─ JSON.stringify: 23 ops/sec ±0.32%

   🏆 JSON.stringify is 8.99x faster than fastJsonFormat
```

## Testing

```bash
npm test
```

## License

MIT License - Copyright (c) Bruno Software Inc.

## Contributing

Issues and pull requests are welcome on the project repository.

