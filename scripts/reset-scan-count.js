// Script to reset scan count for guest users
// This clears the localStorage scan count

console.log('🔄 Resetting scan count...');

// Note: This script needs to be run in the browser console
// Since localStorage is browser-specific, we can't reset it from Node.js
// Instead, use the browser console command below

console.log('\n📋 To reset scan count, open browser console and run:');
console.log('localStorage.removeItem("cardScanner_scanCount");');
console.log('\nOr check current scan count:');
console.log('localStorage.getItem("cardScanner_scanCount");');
