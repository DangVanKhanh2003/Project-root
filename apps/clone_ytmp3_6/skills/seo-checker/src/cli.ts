/**
 * SEO Checker CLI
 * Wrapper CLI cho việc chạy từng validator riêng lẻ
 */

import { runSingleValidator, runSEOAudit } from './index.js';
import { getAllValidatorSlugs } from './validators/index.js';
import { colors, icons } from './logger/formats.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run all validators
    const summary = await runSEOAudit();
    process.exit(summary.passed ? 0 : 1);
  }

  const validatorSlug = args[0];

  // Handle help
  if (validatorSlug === '--help' || validatorSlug === '-h') {
    printHelp();
    process.exit(0);
  }

  // Handle list
  if (validatorSlug === '--list' || validatorSlug === '-l') {
    console.log(colors.highlight('\nAvailable validators:'));
    for (const slug of getAllValidatorSlugs()) {
      console.log(`  - ${slug}`);
    }
    console.log('');
    process.exit(0);
  }

  // Run specific validator
  const result = await runSingleValidator(validatorSlug);

  if (!result) {
    process.exit(1);
  }

  process.exit(result.passed ? 0 : 1);
}

function printHelp(): void {
  console.log(`
${colors.bold('SEO Checker CLI')}

${colors.highlight('Usage:')}
  npx tsx src/cli.ts [validator-slug]

${colors.highlight('Commands:')}
  <validator-slug>    Run a specific validator
  --list, -l          List all available validators
  --help, -h          Show this help message

${colors.highlight('Available validators:')}
  ${getAllValidatorSlugs().join(', ')}

${colors.highlight('Examples:')}
  npx tsx src/cli.ts canonical        # Check canonical tags
  npx tsx src/cli.ts meta-tags        # Check meta tags
  npx tsx src/cli.ts sitemap          # Check sitemap.xml
`);
}

main();
