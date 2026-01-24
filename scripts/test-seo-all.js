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
  console.log(`
========================================`);
  console.log(`  Processing site: ${site}`);
  console.log(`========================================`);
  
  let buildSuccessful = false;
  const appPath = join(appsDir, site);

  try {
    console.log(`Building app: ${site} in ${appPath}...`);
    execSync(`pnpm build`, { cwd: appPath, stdio: 'inherit', shell: true });
    buildSuccessful = true;
    console.log(`App ${site} built successfully.`);
  } catch (error) {
    console.error(`
Error building app ${site}:`);
    console.error(error.message);
    // Continue to next site if build fails
  }

  if (buildSuccessful) {
    try {
      console.log(`Running SEO checker for: ${site}...`);
      execSync(
        `npx tsx ${join(process.cwd(), 'skills', 'test-seo', 'src', 'index.ts')} --site ${site}`,
        { stdio: 'inherit', shell: true }
      );
    } catch (error) {
      console.error(`
Error running SEO tests for ${site}:`);
      console.error(error.message);
      // Continue to next site if SEO check fails
    }
  } else {
    console.log(`Skipping SEO check for ${site} due to build failure.`);
  }
}

console.log(`
========================================`);
console.log(`  All SEO tests completed!`);
console.log(`========================================`);
process.exit(0);
