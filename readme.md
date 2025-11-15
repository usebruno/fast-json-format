# fast-json-format

A blazing fast JSON formatting library that pretty-prints JSON like strings

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
Size         │ fast-json-format     │ jsonc-parser         │ json-bigint          │ lossless-json        │ JSON.stringify
─────────────┼──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┼─────────────────────
100 KB       │ 1839 ops/sec         │ 1265 ops/sec         │ 1053 ops/sec         │ 886 ops/sec          │ 3025 ops/sec
1 MB         │ 178 ops/sec          │ 125 ops/sec          │ 98 ops/sec           │ 61 ops/sec           │ 296 ops/sec
5 MB         │ 28 ops/sec           │ 21 ops/sec           │ 18 ops/sec           │ 9 ops/sec            │ 58 ops/sec
10 MB        │ 15 ops/sec           │ 11 ops/sec           │ 9 ops/sec            │ 4 ops/sec            │ 30 ops/sec          
```

## Testing

```bash
npm test
```

## License

MIT License - Copyright (c) Bruno Software Inc.

## Contributing

Issues and pull requests are welcome on the project repository.

