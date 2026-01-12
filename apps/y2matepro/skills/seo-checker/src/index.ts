/**
 * SEO Checker - Main Orchestrator
 * Chạy tất cả validators và tạo báo cáo tổng hợp
 */

import { CentralLogger } from './logger/index.js';
import { allValidators, getValidatorBySlug } from './validators/index.js';
import type { ValidatorResult, AuditSummary } from './types.js';
import { colors, icons, boxHeader, divider } from './logger/formats.js';

// ============================================
// Configuration
// ============================================

export interface SEOCheckerOptions {
  /** Thư mục chứa logs */
  logDir?: string;
  /** Có log ra console không */
  console?: boolean;
  /** Có ghi log ra file không */
  file?: boolean;
  /** Chỉ chạy các validators cụ thể (by slug) */
  only?: string[];
  /** Bỏ qua các validators cụ thể (by slug) */
  skip?: string[];
}

// ============================================
// Main Function
// ============================================

/**
 * Chạy SEO audit với tất cả validators
 */
export async function runSEOAudit(options: SEOCheckerOptions = {}): Promise<AuditSummary> {
  const logger = new CentralLogger({
    logDir: options.logDir || './logs/seo-checks',
    console: options.console ?? true,
    file: options.file ?? true,
  });

  // Determine which validators to run
  let validatorsToRun = [...allValidators];

  if (options.only && options.only.length > 0) {
    validatorsToRun = validatorsToRun.filter((v) => options.only!.includes(v.slug));
  }

  if (options.skip && options.skip.length > 0) {
    validatorsToRun = validatorsToRun.filter((v) => !options.skip!.includes(v.slug));
  }

  // Print header
  console.log(colors.bold(boxHeader('SEO AUDIT')));
  console.log(colors.muted(`Running ${validatorsToRun.length} validators...\n`));

  // Run validators
  const results: ValidatorResult[] = [];

  for (const validator of validatorsToRun) {
    console.log(colors.highlight(`\n${icons.clock} Running: ${validator.name}...`));

    const validatorLogger = logger.createValidatorLogger(validator.name, validator.slug);

    try {
      const result = await validator.run(validatorLogger);
      results.push(result);
      logger.logValidatorResult(result);
    } catch (error) {
      console.error(colors.error(`${icons.error} Validator "${validator.name}" crashed:`));
      console.error(error);

      results.push({
        name: validator.name,
        slug: validator.slug,
        passed: false,
        errorCount: 1,
        warningCount: 0,
        filesChecked: 0,
        duration: 0,
      });
    }
  }

  // Finalize and get summary
  const summary = logger.finalize(results);

  return summary;
}

/**
 * Chạy một validator cụ thể
 */
export async function runSingleValidator(
  slug: string,
  options: SEOCheckerOptions = {}
): Promise<ValidatorResult | null> {
  const validator = getValidatorBySlug(slug);

  if (!validator) {
    console.error(colors.error(`${icons.error} Unknown validator: ${slug}`));
    console.log(colors.muted(`Available validators: ${allValidators.map((v) => v.slug).join(', ')}`));
    return null;
  }

  const logger = new CentralLogger({
    logDir: options.logDir || './logs/seo-checks',
    console: options.console ?? true,
    file: options.file ?? true,
  });

  console.log(colors.bold(`\n${icons.clock} Running: ${validator.name}\n`));

  const validatorLogger = logger.createValidatorLogger(validator.name, validator.slug);
  const result = await validator.run(validatorLogger);

  logger.logValidatorResult(result);
  logger.finalize([result]);

  return result;
}

// ============================================
// CLI Entry Point
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  const options: SEOCheckerOptions = {
    console: true,
    file: true,
  };

  let specificValidator: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--no-console') {
      options.console = false;
    } else if (arg === '--no-file') {
      options.file = false;
    } else if (arg === '--log-dir' && args[i + 1]) {
      options.logDir = args[++i];
    } else if (arg === '--only' && args[i + 1]) {
      options.only = args[++i].split(',');
    } else if (arg === '--skip' && args[i + 1]) {
      options.skip = args[++i].split(',');
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      specificValidator = arg;
    }
  }

  try {
    let exitCode = 0;

    if (specificValidator) {
      const result = await runSingleValidator(specificValidator, options);
      exitCode = result && result.passed ? 0 : 1;
    } else {
      const summary = await runSEOAudit(options);
      exitCode = summary.passed ? 0 : 1;
    }

    process.exit(exitCode);
  } catch (error) {
    console.error(colors.error(`\n${icons.error} Fatal error:`));
    console.error(error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
${colors.bold('SEO Checker')} - Validate SEO elements in HTML files

${colors.highlight('Usage:')}
  npx tsx src/index.ts [validator] [options]

${colors.highlight('Validators:')}
  ${allValidators.map((v) => `${v.slug.padEnd(20)} ${v.description}`).join('\n  ')}

${colors.highlight('Options:')}
  --only <slugs>      Only run specific validators (comma-separated)
  --skip <slugs>      Skip specific validators (comma-separated)
  --log-dir <path>    Directory for log files (default: ./logs/seo-checks)
  --no-console        Disable console output
  --no-file           Disable file logging
  -h, --help          Show this help message

${colors.highlight('Examples:')}
  npx tsx src/index.ts                    # Run all validators
  npx tsx src/index.ts canonical          # Run only canonical validator
  npx tsx src/index.ts --only meta-tags,sitemap
  npx tsx src/index.ts --skip lang-dropdowns
`);
}

// Run main if this is the entry point
main();

// Export for programmatic use
export { allValidators, getValidatorBySlug } from './validators/index.js';
export { CentralLogger } from './logger/index.js';
export type * from './types.js';
