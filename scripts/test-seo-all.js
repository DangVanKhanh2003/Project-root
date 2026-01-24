/**
 * Script to run SEO tests for all sites in the `apps` directory.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const appsDir = join(process.cwd(), 'apps');
const sites = readdirSync(appsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log(`Found ${sites.length} sites to test: ${sites.join(', ')}`);

for (const site of sites) {
  console.log(`\n\n========================================`);
  console.log(`  Running SEO tests for: ${site}`);
  console.log(`========================================\n`);
  
  try {
    execSync(
      `tsx skills/test-seo/src/index.ts --site ${site}`,
      { stdio: 'inherit', shell: true }
    );
  } catch (error) {
    console.error(`\nError running SEO tests for ${site}.`);
    // The error from the child process is already printed to the console.
    // We exit with 1 to indicate that the overall script failed.
    process.exit(1);
  }
}

console.log(`\n\n========================================`);
console.log(`  All SEO tests passed!`);
console.log(`========================================\n`);
process.exit(0);
