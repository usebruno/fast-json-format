const Benchmark = require('benchmark');
const { faker } = require('@faker-js/faker');
const chalk = require('chalk');
const fastJsonFormat = require('./src/index.js');
const JSONbig = require('json-bigint');
const LosslessJSON = require('lossless-json');

/**
 * Generates a nested JSON string of approximately the target size
 * @param {number} targetSizeBytes - Target size in bytes
 * @returns {string} JSON string
 */
function generateNestedJSON(targetSizeBytes) {
  const generateUser = () => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode()
    },
    company: {
      name: faker.company.name(),
      catchPhrase: faker.company.catchPhrase(),
      bs: faker.company.buzzPhrase()
    },
    phone: faker.phone.number(),
    website: faker.internet.url(),
    createdAt: faker.date.past().toISOString()
  });

  // Cache some users for performance
  const CACHED_USERS_COUNT = 100;
  const cachedUsers = Array.from({ length: CACHED_USERS_COUNT }, generateUser);
  
  // Calculate average size of one user
  const sampleUserJson = JSON.stringify(cachedUsers[0]);
  const AVERAGE_USER_SIZE = Buffer.byteLength(sampleUserJson);
  
  // Estimate number of users needed
  const estimatedUsersNeeded = Math.ceil(targetSizeBytes / AVERAGE_USER_SIZE);
  
  const users = [];
  let currentSize = 12; // Size of '{"users":[]}'
  let userIndex = 0;
  
  // Build up users array until we reach target size
  while (currentSize < targetSizeBytes && userIndex < estimatedUsersNeeded * 1.2) {
    // Use cached user but vary the id for uniqueness
    const user = {
      ...cachedUsers[userIndex % CACHED_USERS_COUNT],
      id: faker.string.uuid()
    };
    
    users.push(user);
    
    // Estimate current size (with JSON overhead)
    const userJson = JSON.stringify(user);
    currentSize += Buffer.byteLength(userJson) + (userIndex > 0 ? 1 : 0); // Add 1 for comma
    userIndex++;
  }
  
  return JSON.stringify({ users });
}

const testSizes = [
  { name: '100 KB', bytes: 100 * 1024 },
  { name: '1 MB', bytes: 1024 * 1024 },
  { name: '5 MB', bytes: 5 * 1024 * 1024 },
  { name: '10 MB', bytes: 10 * 1024 * 1024 }
];

console.log('\n' + chalk.bold.cyan('🚀 Fast JSON Format Benchmark') + '\n');
console.log(chalk.gray('⚡ Comparing ') + chalk.yellow('fast-json-format') + chalk.gray(' vs ') + chalk.yellow('JSON.stringify(JSON.parse())') + chalk.gray(' vs ') + chalk.yellow('json-bigint') + chalk.gray(' vs ') + chalk.yellow('lossless-json') + '\n');
console.log(chalk.bold.blue('📊 Generating test data...') + '\n');

const testCases = testSizes.map(size => {
  console.log(chalk.gray('  ⏳ Generating ') + chalk.cyan(size.name) + chalk.gray(' JSON...'));
  const data = generateNestedJSON(size.bytes);
  const actualSize = data.length;
  console.log(chalk.gray('     ✅ Generated: ') + chalk.green(`${(actualSize / 1024).toFixed(1)} KB`) + chalk.gray(` (${((actualSize / size.bytes) * 100).toFixed(1)}% of target)`));
  return {
    name: size.name,
    data: data,
    actualSize: actualSize
  };
});

console.log('\n' + chalk.bold.magenta('🏁 Running benchmarks...') + '\n');

// Store all results for summary table
const allResults = [];

testCases.forEach(testCase => {
  console.log('\n' + chalk.bold.yellow(`⚡ ${testCase.name}`) + ' ' + chalk.gray('━'.repeat(50)));
  console.log(chalk.gray('   Size: ') + chalk.cyan(`${(testCase.actualSize / 1024).toFixed(1)} KB`));
  
  const suite = new Benchmark.Suite();
  
  const results = [];
  
  suite
    .add('fast-json-format', function() {
      fastJsonFormat(testCase.data, '  ');
    })
    .add('json-bigint', function() {
      JSONbig.stringify(JSONbig.parse(testCase.data), null, 2);
    })
    .add('lossless-json', function() {
      LosslessJSON.stringify(LosslessJSON.parse(testCase.data), null, 2);
    })
    .add('JSON.stringify', function() {
      JSON.stringify(JSON.parse(testCase.data), null, 2);
    })
    .on('cycle', function(event) {
      const name = event.target.name;
      const ops = event.target.hz.toLocaleString('en-US', { maximumFractionDigits: 0 });
      const margin = event.target.stats.rme.toFixed(2);
      
      results.push({ name, hz: event.target.hz });
      
      const symbol = results.length === 1 ? '├─' : results.length === 2 ? '├─' : '└─';
      const color = name === 'fast-json-format' ? chalk.green : name === 'JSON.stringify' ? chalk.blue : name === 'json-bigint' ? chalk.magenta : chalk.yellow;
      
      console.log(chalk.gray(`   ${symbol} `) + color(name) + chalk.gray(': ') + chalk.bold.white(ops) + chalk.gray(' ops/sec ±' + margin + '%'));
    })
    .on('complete', function() {
      const fastest = this.filter('fastest')[0];
      const slowest = this.filter('slowest')[0];
      const speedup = fastest.hz / slowest.hz;
      
      // Store results for summary
      allResults.push({
        size: testCase.name,
        results: results
      });
    })
    .run({ 'async': false });
});

// Display summary table
console.log('\n\n' + chalk.bold.cyan('📊 Summary Table') + '\n');

// Build table header
const libs = ['fast-json-format', 'json-bigint', 'lossless-json', 'JSON.stringify'];
const colWidths = { size: 12, lib: 20 };

// Header
console.log(
  chalk.bold.white('Size'.padEnd(colWidths.size)) + ' │ ' +
  chalk.bold.green('fast-json-format'.padEnd(colWidths.lib)) + ' │ ' +
  chalk.bold.magenta('json-bigint'.padEnd(colWidths.lib)) + ' │ ' +
  chalk.bold.yellow('lossless-json'.padEnd(colWidths.lib)) + ' │ ' +
  chalk.bold.blue('JSON.stringify'.padEnd(colWidths.lib))
);
console.log('─'.repeat(colWidths.size) + '─┼─' + '─'.repeat(colWidths.lib) + '─┼─' + '─'.repeat(colWidths.lib) + '─┼─' + '─'.repeat(colWidths.lib) + '─┼─' + '─'.repeat(colWidths.lib));

// Rows
allResults.forEach(result => {
  const fastJson = result.results.find(r => r.name === 'fast-json-format');
  const jsonBigint = result.results.find(r => r.name === 'json-bigint');
  const losslessJson = result.results.find(r => r.name === 'lossless-json');
  const jsonStringify = result.results.find(r => r.name === 'JSON.stringify');
  
  const fastJsonOps = fastJson ? fastJson.hz.toFixed(0) : 'N/A';
  const jsonBigintOps = jsonBigint ? jsonBigint.hz.toFixed(0) : 'N/A';
  const losslessJsonOps = losslessJson ? losslessJson.hz.toFixed(0) : 'N/A';
  const jsonStringifyOps = jsonStringify ? jsonStringify.hz.toFixed(0) : 'N/A';
  
  console.log(
    chalk.cyan(result.size.padEnd(colWidths.size)) + ' │ ' +
    chalk.white((fastJsonOps + ' ops/sec').padEnd(colWidths.lib)) + ' │ ' +
    chalk.white((jsonBigintOps + ' ops/sec').padEnd(colWidths.lib)) + ' │ ' +
    chalk.white((losslessJsonOps + ' ops/sec').padEnd(colWidths.lib)) + ' │ ' +
    chalk.white((jsonStringifyOps + ' ops/sec').padEnd(colWidths.lib))
  );
});

console.log('\n' + chalk.gray('Note: Higher ops/sec = better performance') + '\n');