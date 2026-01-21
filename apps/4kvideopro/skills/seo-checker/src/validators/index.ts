/**
 * Validators Index
 * Export tất cả validators
 */

export { canonicalValidator } from './canonical.js';
export { alternateValidator } from './alternate.js';
export { metaTagsValidator } from './meta-tags.js';
export { structuredDataValidator } from './structured-data.js';
export { sitemapValidator } from './sitemap.js';
export { i18nCompletenessValidator } from './i18n-completeness.js';
export { urlFormatValidator } from './url-format.js';
export { langDropdownsValidator } from './lang-dropdowns.js';
export { jsonldContentValidator } from './jsonld-content.js';

import { canonicalValidator } from './canonical.js';
import { alternateValidator } from './alternate.js';
import { metaTagsValidator } from './meta-tags.js';
import { structuredDataValidator } from './structured-data.js';
import { sitemapValidator } from './sitemap.js';
import { i18nCompletenessValidator } from './i18n-completeness.js';
import { urlFormatValidator } from './url-format.js';
import { langDropdownsValidator } from './lang-dropdowns.js';
import { jsonldContentValidator } from './jsonld-content.js';

import type { Validator } from '../types.js';

/**
 * All validators in recommended execution order
 */
export const allValidators: Validator[] = [
  canonicalValidator,
  alternateValidator,
  metaTagsValidator,
  structuredDataValidator,
  sitemapValidator,
  i18nCompletenessValidator,
  urlFormatValidator,
  langDropdownsValidator,
  jsonldContentValidator,
];

/**
 * Get validator by slug
 */
export function getValidatorBySlug(slug: string): Validator | undefined {
  return allValidators.find((v) => v.slug === slug);
}

/**
 * Get all validator slugs
 */
export function getAllValidatorSlugs(): string[] {
  return allValidators.map((v) => v.slug);
}

export default allValidators;
