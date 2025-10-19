const Benchmark = require('benchmark');
const { faker } = require('@faker-js/faker');
const fastJsonFormat = require('./src/index.js');

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

console.log('Fast JSON Format Benchmark\n');
console.log('Comparing fastJsonFormat() vs JSON.stringify(JSON.parse(), null, 2)\n');
console.log('Generating test data...\n');

const testCases = testSizes.map(size => {
  console.log(`Generating ${size.name} JSON...`);
  const data = generateNestedJSON(size.bytes);
  const actualSize = data.length;
  console.log(`  Generated: ${(actualSize / 1024).toFixed(1)} KB (${((actualSize / size.bytes) * 100).toFixed(1)}% of target)`);
  return {
    name: size.name,
    data: data,
    actualSize: actualSize
  };
});

console.log('\nRunning benchmarks...\n');

testCases.forEach(testCase => {
  console.log(`\n=== ${testCase.name} ===`);
  console.log(`Actual size: ${(testCase.actualSize / 1024).toFixed(1)} KB`);
  
  const suite = new Benchmark.Suite();
  
  suite
    .add('fastJsonFormat', function() {
      fastJsonFormat(testCase.data, '  ');
    })
    .add('JSON.stringify', function() {
      JSON.stringify(JSON.parse(testCase.data), null, 2);
    })
    .on('cycle', function(event) {
      console.log(String(event.target));
    })
    .on('complete', function() {
      const fastest = this.filter('fastest')[0];
      const slowest = this.filter('slowest')[0];
      const speedup = fastest.hz / slowest.hz;
      
      console.log(`${fastest.name} is ${speedup.toFixed(2)}x faster than ${slowest.name}`);
    })
    .run({ 'async': false });
});