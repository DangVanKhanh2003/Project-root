#!/usr/bin/env node

/**
 * Script to modify meta robots tags for test/staging environments
 *
 * This script automatically replaces 'index, follow' with 'noindex'
 * in all HTML files to prevent search engine indexing in test environments.
 *
 * Usage:
 *   node scripts/modify-robots-meta.js
 *   NODE_ENV=test node scripts/modify-robots-meta.js
 *
 * Environment Variables:
 *   NODE_ENV: Set to 'test' or 'staging' to enable robots modification
 *   TARGET_DIR: Directory to process (default: current directory)
 */

import fs from 'fs';
import path from 'path';

// Configuration
const TARGET_ENV = process.env.NODE_ENV;
const TARGET_DIR = process.env.TARGET_DIR || process.cwd();

// Only run in test/staging environments
const ALLOWED_ENVIRONMENTS = ['test', 'staging', 'test-production'];

console.log(`🔧 Meta Robots Modifier Script`);
console.log(`📁 Target Directory: ${TARGET_DIR}`);
console.log(`🌍 Environment: ${TARGET_ENV || 'production (no change)'}`);

// Check if we should modify robots tags
if (!TARGET_ENV || !ALLOWED_ENVIRONMENTS.includes(TARGET_ENV)) {
    console.log(`ℹ️  Environment '${TARGET_ENV}' not in allowed list [${ALLOWED_ENVIRONMENTS.join(', ')}]`);
    console.log(`✅ Skipping robots meta modification - keeping 'index, follow' for production`);
    process.exit(0);
}

/**
 * Find all HTML files recursively in the target directory
 */
async function findHtmlFiles(dir = TARGET_DIR, htmlFiles = []) {
    try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            // Skip node_modules and hidden directories
            if (item === 'node_modules' || item.startsWith('.')) {
                continue;
            }

            if (stat.isDirectory()) {
                // Recursively search subdirectories
                await findHtmlFiles(fullPath, htmlFiles);
            } else if (item.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }

        return htmlFiles;
    } catch (error) {
        console.error(`❌ Error finding HTML files:`, error);
        return [];
    }
}

/**
 * Modify robots meta tag in HTML content
 */
function modifyRobotsTag(content) {
    // Pattern to match meta robots tags with various spacing
    const robotsPattern = /<meta\s+name=["']robots["']\s+content=["']index,\s*follow["']\s*\/?>/gi;

    // Replace with noindex
    const modifiedContent = content.replace(robotsPattern, '<meta name="robots" content="noindex">');

    // Check if any changes were made
    const wasModified = content !== modifiedContent;

    return {
        content: modifiedContent,
        wasModified
    };
}

/**
 * Process a single HTML file
 */
async function processFile(filePath) {
    try {
        // Read file content
        const originalContent = fs.readFileSync(filePath, 'utf8');

        // Modify robots tags
        const { content: modifiedContent, wasModified } = modifyRobotsTag(originalContent);

        if (wasModified) {
            // Write modified content back
            fs.writeFileSync(filePath, modifiedContent, 'utf8');
            console.log(`✅ Modified: ${path.relative(TARGET_DIR, filePath)}`);
            return true;
        } else {
            console.log(`⏭️  No changes: ${path.relative(TARGET_DIR, filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log(`🔄 Starting robots meta modification for '${TARGET_ENV}' environment...`);

    // Find all HTML files
    const htmlFiles = await findHtmlFiles();

    if (htmlFiles.length === 0) {
        console.log(`⚠️  No HTML files found in ${TARGET_DIR}`);
        return;
    }

    console.log(`📋 Found ${htmlFiles.length} HTML files to process`);

    // Process each file
    let modifiedCount = 0;
    for (const filePath of htmlFiles) {
        const wasModified = await processFile(filePath);
        if (wasModified) modifiedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total files processed: ${htmlFiles.length}`);
    console.log(`   Files modified: ${modifiedCount}`);
    console.log(`   Files unchanged: ${htmlFiles.length - modifiedCount}`);

    if (modifiedCount > 0) {
        console.log(`\n🔒 Successfully set meta robots to 'noindex' for ${TARGET_ENV} environment`);
        console.log(`🚫 Search engines will NOT index this deployment`);
    } else {
        console.log(`\nℹ️  No files required modification`);
    }
}

// Run the script
main().catch(error => {
    console.error(`💥 Script failed:`, error);
    process.exit(1);
});