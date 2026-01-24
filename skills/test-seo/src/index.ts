/**
 * SEO Checker - Main Orchestrator
 * Chạy tất cả validators và tạo báo cáo tổng hợp
 */

import { CentralLogger } from './logger/index.js';
import { allValidators, getValidatorBySlug } from './validators/index.js';
import type { ValidatorResult, AuditSummary, SiteConfig } from './types.js';
import { colors, icons, boxHeader } from './logger/formats.js';
import { getTargetDir, getAppRoot } from './config.js';
import { getSiteConfig, sites } from './sites.config.js';

// ============================================
// Configuration
// ============================================

export interface SEOCheckerOptions {
  /** ID của site cần check (tên thư mục trong `apps/`) */
  siteId: string;
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
export async function runSEOAudit(options: SEOCheckerOptions): Promise<AuditSummary> {
  const { siteId } = options;
  const siteConfig = getSiteConfig(siteId);
  const appRoot = getAppRoot(siteId);
  const targetDir = getTargetDir(appRoot);

  const logger = new CentralLogger({
    logDir: options.logDir || './logs/seo-checks',
    console: options.console ?? true,
    file: options.file ?? true,
  });

  // Determine which validators to run
  let validatorsToRun = [...allValidators];
  if (options.only?.length) {
    validatorsToRun = validatorsToRun.filter((v) => options.only!.includes(v.slug));
  }
  if (options.skip?.length) {
    validatorsToRun = validatorsToRun.filter((v) => !options.skip!.includes(v.slug));
  }

  // Print header
  console.log(colors.bold(boxHeader(`SEO AUDIT: ${siteId}`)));
  console.log(colors.muted(`Site: ${siteConfig.baseUrl}`));
  console.log(colors.muted(`Target: ${targetDir}`));
  console.log(colors.muted(`Running ${validatorsToRun.length} validators...
`));

  // Run validators
  const results: ValidatorResult[] = [];
  for (const validator of validatorsToRun) {
    console.log(colors.highlight(`
${icons.clock} Running: ${validator.name}...`));
    const validatorLogger = logger.createValidatorLogger(validator.name, validator.slug);
    try {
      const result = await validator.run(validatorLogger, siteConfig, targetDir, appRoot);
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
  return logger.finalize(results);
}

/**
 * Chạy một validator cụ thể
 */
export async function runSingleValidator(
  slug: string,
  options: SEOCheckerOptions
): Promise<ValidatorResult | null> {
  const { siteId } = options;
  const siteConfig = getSiteConfig(siteId);
  const appRoot = getAppRoot(siteId);
  const targetDir = getTargetDir(appRoot);

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

  console.log(colors.bold(`
${icons.clock} Running: ${validator.name} for ${siteId}
`));
  const validatorLogger = logger.createValidatorLogger(validator.name, validator.slug);
  const result = await validator.run(validatorLogger, siteConfig, targetDir, appRoot);

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
  const options: Partial<SEOCheckerOptions> = {
    console: true,
    file: true,
  };
  let specificValidator: string | null = null;
  let siteId: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--site' && nextArg) {
      siteId = nextArg;
      i++;
    } else if (arg === '--no-console') {
      options.console = false;
    } else if (arg === '--no-file') {
      options.file = false;
    } else if (arg === '--log-dir' && nextArg) {
      options.logDir = nextArg;
      i++;
    } else if (arg === '--only' && nextArg) {
      options.only = nextArg.split(',');
      i++;
    } else if (arg === '--skip' && nextArg) {
      options.skip = nextArg.split(',');
      i++;
    } else if (arg === '--target' && nextArg) {
      process.env.SEO_CHECK_TARGET = nextArg;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      specificValidator = arg;
    }
  }

  if (!siteId) {
    console.error(colors.error(`${icons.error} Error: --site argument is required.`));
    printHelp();
    process.exit(1);
  }

  const fullOptions: SEOCheckerOptions = { ...options, siteId };

  try {
    let exitCode = 0;
    if (specificValidator) {
      const result = await runSingleValidator(specificValidator, fullOptions);
      exitCode = result?.passed ? 0 : 1;
    } else {
      const summary = await runSEOAudit(fullOptions);
      exitCode = summary.passed ? 0 : 1;
    }
    process.exit(exitCode);
  } catch (error) {
    console.error(colors.error(`
${icons.error} Fatal error:`));
    console.error(error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
${colors.bold('SEO Checker')} - Validate SEO elements in HTML files

${colors.highlight('Usage:')}
  npx tsx src/index.ts --site <siteId> [validator] [options]

${colors.highlight('Required:')}
  --site <siteId>     ID of the site to test (e.g., y2matepro, 4k-downloader)

${colors.highlight('Available Sites:')}
  ${Object.keys(sites).join(', ')}

${colors.highlight('Validators:')}
  (run without a validator to run all)
  ${allValidators.map((v) => `${v.slug.padEnd(20)} ${v.description}`).join('\n  ')}

${colors.highlight('Options:')}
  --only <slugs>      Only run specific validators (comma-separated)
  --skip <slugs>      Skip specific validators (comma-separated)
  --target <path>     Override build output directory (relative to app root)
  --log-dir <path>    Directory for log files (default: ./logs/seo-checks)
  --no-console        Disable console output
  --no-file           Disable file logging
  -h, --help          Show this help message

${colors.highlight('Examples:')}
  npx tsx src/index.ts --site y2matepro
  npx tsx src/index.ts --site 4k-downloader canonical
  npx tsx src/index.ts --site ytmp3fast --only meta-tags,sitemap
`);
}

// Run main if this is the entry point
if (import.meta.url.startsWith('file:')) {
  const modulePath = new URL(import.meta.url).pathname;
  const scriptPath = process.argv[1];
  if (modulePath === scriptPath) {
    main();
  }
}

// Export for programmatic use
export { allValidators, getValidatorBySlug } from './validators/index.js';
export { CentralLogger } from './logger/index.js';
export type * from './types.js';
