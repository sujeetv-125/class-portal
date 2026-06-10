/**
 * ClassPortal Backend Module Integrity Test
 * Validates that all server files compile and import without syntax errors.
 */

console.log('--- ClassPortal Module Loading Integrity Tests ---');

let success = true;

function testImport(modulePath) {
  try {
    console.log(`Testing import of: ${modulePath}`);
    // Mock required environment variables for the test
    process.env.MONGODB_URI = 'mongodb://localhost:27017/mockdb';
    process.env.JWT_SECRET = 'mock-secret';
    process.env.CLOUDINARY_CLOUD_NAME = 'mock';
    process.env.CLOUDINARY_API_KEY = 'mock';
    process.env.CLOUDINARY_API_SECRET = 'mock';

    const module = require(modulePath);
    console.log(`✅ Success: ${modulePath} loaded successfully.`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to import: ${modulePath}`);
    console.error('Error Stack:', error);
    success = false;
    return false;
  }
}

// Check imports
testImport('../models');
testImport('../auth');
testImport('../cloudinary');
testImport('../routes');

if (success) {
  console.log('\n✅ All backend modular files successfully loaded and validated.');
  process.exit(0);
} else {
  console.error('\n❌ Module loading integrity test failed. Please verify syntax errors.');
  process.exit(1);
}
