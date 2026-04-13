/**
 * Copies the compiled engine into the CLI dist folder
 * so the CLI can start the engine without needing the monorepo structure.
 */
const fs = require('fs');
const path = require('path');

const engineDist = path.resolve(__dirname, '../../engine/dist');
const enginePrisma = path.resolve(__dirname, '../../engine/prisma');
const engineGenerated = path.resolve(__dirname, '../../engine/generated');
const destEngine = path.resolve(__dirname, '../dist/engine');
const destPrisma = path.resolve(__dirname, '../dist/prisma');
const destGenerated = path.resolve(__dirname, '../dist/generated');

if (!fs.existsSync(engineDist)) {
  console.warn('⚠ Engine dist not found. Run: cd packages/engine && npm run build');
  process.exit(0);
}

fs.cpSync(engineDist, destEngine, { recursive: true });
console.log('✓ Engine dist copied to dist/engine');

if (fs.existsSync(enginePrisma)) {
  fs.cpSync(enginePrisma, destPrisma, { recursive: true });
  console.log('✓ Prisma folder copied to dist/prisma');
}

if (fs.existsSync(engineGenerated)) {
  fs.cpSync(engineGenerated, destGenerated, { recursive: true });
  console.log('✓ Generated Prisma client copied to dist/generated');
}

console.log('\nCLI is ready to use as a standalone package.');
