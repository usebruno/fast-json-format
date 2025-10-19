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
   ├─ fastJsonFormat: 1,030 ops/sec ±2.61%
   ├─ json-bigint: 711 ops/sec ±0.61%
   └─ JSON.stringify: 2,443 ops/sec ±0.55%

⚡ 1 MB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Size: 1024.3 KB
   ├─ fastJsonFormat: 90 ops/sec ±6.33%
   ├─ json-bigint: 69 ops/sec ±0.33%
   └─ JSON.stringify: 236 ops/sec ±3.07%

⚡ 5 MB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Size: 5120.3 KB
   ├─ fastJsonFormat: 15 ops/sec ±3.43%
   ├─ json-bigint: 13 ops/sec ±1.44%
   └─ JSON.stringify: 47 ops/sec ±0.45%

⚡ 10 MB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Size: 10240.3 KB
   ├─ fastJsonFormat: 7 ops/sec ±5.44%
   ├─ json-bigint: 6 ops/sec ±1.34%
   └─ JSON.stringify: 23 ops/sec ±0.95%
```

## Testing

```bash
npm test
```

## License

MIT License - Copyright (c) Bruno Software Inc.

## Contributing

Issues and pull requests are welcome on the project repository.

