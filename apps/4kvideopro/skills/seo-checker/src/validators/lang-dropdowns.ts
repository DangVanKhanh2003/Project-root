/**
 * Language Dropdown Validator
 * Kiểm tra có language selector UI không
 */

import { getTargetDir } from '../config.js';
import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';
import { scanHtmlFiles } from '../utils/file-scanner.js';
import { parseHtmlFile, hasLanguageDropdown, hasElement } from '../utils/html-parser.js';

// Target directory determined at runtime via getTargetDir()

export const langDropdownsValidator: Validator = {
  name: 'Language Dropdowns',
  slug: 'lang-dropdowns',
  description: 'Validates language selector UI presence',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    logger.info('Checking for language dropdown elements...');

    const files = await scanHtmlFiles({
      rootDir: getTargetDir(),
      include: ['**/*.html', 'pages/**/*.html'],
      exclude: ['**/node_modules/**', '**/_templates/**', '**/404.html'],
    });

    for (const file of files) {
      filesChecked++;

      try {
        const parsed = parseHtmlFile(file.absolutePath);

        // Check for language dropdown
        const hasDropdown = hasLanguageDropdown(parsed);

        if (!hasDropdown) {
          // Check if this is a multilingual site
          // Only warn if there are multiple languages
          logger.warning({
            file: file.relativePath,
            location: '<header> or navigation',
            component: 'Language Dropdown',
            issue: 'No language selector found',
            reason: 'Users should be able to switch languages easily',
            fix: 'Add a language selector with id="language-dropdown" or class="language-dropdown"',
          });
          continue;
        }

        // Additional checks for language dropdown quality
        const dropdownSelectors = [
          '#language-dropdown',
          '.language-dropdown',
          '[data-language-dropdown]',
          '.lang-selector',
          '#lang-selector',
        ];

        for (const selector of dropdownSelectors) {
          if (hasElement(parsed, selector)) {
            // Check if it has options/links
            const { $ } = parsed;
            const dropdown = $(selector);

            // Check for select element
            const isSelect = dropdown.is('select');
            if (isSelect) {
              const options = dropdown.find('option');
              if (options.length < 2) {
                logger.warning({
                  file: file.relativePath,
                  location: selector,
                  component: 'Language Dropdown',
                  issue: 'Language selector has fewer than 2 options',
                  reason: 'A language selector should have at least 2 languages',
                  fix: 'Add more language options',
                });
              }
            }

            // Check for links inside dropdown
            const links = dropdown.find('a[href]');
            if (!isSelect && links.length < 2) {
              // Check if dropdown has child ul/li structure
              const listItems = dropdown.find('li');
              if (listItems.length < 2) {
                logger.warning({
                  file: file.relativePath,
                  location: selector,
                  component: 'Language Dropdown',
                  issue: 'Language dropdown may have insufficient language options',
                  reason: 'Dropdown should contain links or options for each language',
                  fix: 'Add language links inside the dropdown',
                });
              }
            }

            // Check for aria-label or accessible name
            const ariaLabel = dropdown.attr('aria-label');
            const title = dropdown.attr('title');
            if (!ariaLabel && !title) {
              logger.warning({
                file: file.relativePath,
                location: selector,
                component: 'Language Dropdown',
                issue: 'Language selector missing aria-label',
                reason: 'Accessibility: screen readers need a label',
                fix: 'Add aria-label="Select language" or similar',
              });
            }

            break; // Found one, no need to check others
          }
        }

      } catch (error) {
        logger.error({
          file: file.relativePath,
          component: 'File parsing',
          issue: `Failed to parse HTML file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    const stats = logger.getStats();
    const duration = Date.now() - startTime;

    return {
      name: langDropdownsValidator.name,
      slug: langDropdownsValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration,
    };
  },
};

export default langDropdownsValidator;
