/**
 * Language Dropdown Validator
 * Checks for the presence and basic quality of a language selector UI.
 */

import type { Validator, ValidatorLogger, ValidatorResult, SiteConfig } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, hasLanguageDropdown, hasElement } from '../utils/html-parser.js';

export const langDropdownsValidator: Validator = {
  name: 'Language Dropdowns',
  slug: 'lang-dropdowns',
  description: 'Validates language selector UI presence',

  async run(
    logger: ValidatorLogger,
    siteConfig: SiteConfig,
    targetDir: string,
    appRoot: string
  ): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    // Only run this check if the site supports multiple languages.
    if (siteConfig.supportedLanguages.length <= 1) {
      logger.info('Site has only one language, skipping language dropdown check.');
      return {
        name: langDropdownsValidator.name,
        slug: langDropdownsValidator.slug,
        passed: true,
        errorCount: 0,
        warningCount: 0,
        filesChecked: 0,
        duration: Date.now() - startTime,
      };
    }

    logger.info('Checking for language dropdown elements...');

    const files = await scanHtmlFiles({
      rootDir: targetDir,
      include: ['**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);
        if (!hasLanguageDropdown(parsed)) {
          logger.warning({
            file: file.relativePath,
            location: '<header> or navigation',
            component: 'Language Dropdown',
            issue: 'No language selector UI found',
            reason: 'Users should be able to switch between supported languages easily.',
            fix: 'Add a language selector with a common ID or class like #language-dropdown.',
          });
          continue;
        }

        // Optional: Add more detailed checks for dropdown quality if needed.
        // For example, check if it contains enough links for all supported languages.

      } catch (error) {
        logger.error({
          file: file.relativePath,
          component: 'File parsing',
          issue: `Failed to parse HTML file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    const stats = logger.getStats();
    return {
      name: langDropdownsValidator.name,
      slug: langDropdownsValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};

export default langDropdownsValidator;