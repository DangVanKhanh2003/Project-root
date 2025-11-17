#!/usr/bin/env node

/**
 * Console.log Removal Tool
 *
 * Tool để xóa tất cả console.log statements từ JavaScript files
 * Hỗ trợ:
 * - Single line console.log
 * - Multi-line console.log
 * - Console methods khác (warn, error, info, debug)
 * - Backup mode để safety
 * - Dry-run mode để preview changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConsoleLogRemover {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      backup: options.backup || false,
      includeOtherMethods: options.includeOtherMethods || false,
      verbose: options.verbose || false,
      directories: options.directories || ['src/**/*.js'],
      excludePatterns: options.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**']
    };
    this.removedCount = 0;
    this.processedFiles = 0;
  }

  /**
   * Tạo regex pattern để match console statements
   * Handles multi-line console.log với proper parentheses matching
   */
  createConsoleRegex() {
    const consoleMethods = this.options.includeOtherMethods
      ? 'log|warn|error|info|debug|trace|table|group|groupEnd|time|timeEnd'
      : 'log';

    // Regex để match console.method(...) bao gồm multi-line
    // Sử dụng recursive approach để handle nested parentheses
    return new RegExp(
      `console\\.(${consoleMethods})\\s*\\([^]*?\\);?`,
      'gm'
    );
  }

  /**
   * Improved regex để handle nested parentheses trong console.log
   */
  findConsoleStatements(content) {
    const consoleMethods = this.options.includeOtherMethods
      ? 'log|warn|error|info|debug|trace|table|group|groupEnd|time|timeEnd'
      : 'log';

    const matches = [];
    const regex = new RegExp(`console\\.(${consoleMethods})\\s*\\(`, 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const startPos = match.index;
      const openParenPos = content.indexOf('(', startPos + match[0].length - 1);

      // Tìm matching closing parenthesis
      let parenCount = 1;
      let pos = openParenPos + 1;
      let inString = false;
      let stringChar = null;
      let escaped = false;

      while (pos < content.length && parenCount > 0) {
        const char = content[pos];

        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (!inString && (char === '"' || char === "'" || char === '`')) {
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar) {
          inString = false;
          stringChar = null;
        } else if (!inString) {
          if (char === '(') {
            parenCount++;
          } else if (char === ')') {
            parenCount--;
          }
        }

        pos++;
      }

      if (parenCount === 0) {
        // Tìm semicolon hoặc end of statement
        let endPos = pos;
        while (endPos < content.length && /\s/.test(content[endPos])) {
          endPos++;
        }
        if (content[endPos] === ';') {
          endPos++;
        }

        const fullMatch = content.substring(startPos, endPos);
        matches.push({
          match: fullMatch,
          start: startPos,
          end: endPos,
          method: match[1]
        });
      }
    }

    return matches;
  }

  /**
   * Xóa console statements từ content
   */
  removeConsoleStatements(content) {
    const statements = this.findConsoleStatements(content);

    if (statements.length === 0) {
      return { content, removedCount: 0 };
    }

    // Sort theo position (reverse order để không affect indices)
    statements.sort((a, b) => b.start - a.start);

    let modifiedContent = content;
    let removedCount = 0;

    for (const statement of statements) {
      const before = modifiedContent.substring(0, statement.start);
      const after = modifiedContent.substring(statement.end);

      // Check nếu console.log là entire line thì xóa cả line
      const beforeTrimmed = before.split('\n').pop().trim();
      const afterTrimmed = after.split('\n')[0].trim();

      if (beforeTrimmed === '' && afterTrimmed === '') {
        // Xóa entire line
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        beforeLines.pop(); // Remove empty line
        afterLines.shift(); // Remove empty line
        modifiedContent = beforeLines.join('\n') + '\n' + afterLines.join('\n');
      } else {
        // Chỉ xóa console statement
        modifiedContent = before + after;
      }

      removedCount++;

      if (this.options.verbose) {
        console.log(`  Removed: ${statement.match.substring(0, 50)}${statement.match.length > 50 ? '...' : ''}`);
      }
    }

    return { content: modifiedContent, removedCount };
  }

  /**
   * Backup file trước khi modify
   */
  createBackup(filePath) {
    if (!this.options.backup) return;

    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`  Backup created: ${backupPath}`);
  }

  /**
   * Process một file
   */
  async processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = this.removeConsoleStatements(content);

      if (result.removedCount > 0) {
        console.log(`\n📁 ${filePath}`);
        console.log(`  Found ${result.removedCount} console statement(s)`);

        if (this.options.dryRun) {
          console.log('  [DRY RUN] Would remove console statements');
        } else {
          this.createBackup(filePath);
          fs.writeFileSync(filePath, result.content, 'utf8');
          console.log(`  ✅ Removed ${result.removedCount} console statement(s)`);
        }

        this.removedCount += result.removedCount;
      }

      this.processedFiles++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  /**
   * Tìm tất cả JavaScript files
   */
  async findFiles() {
    const allFiles = [];

    for (const pattern of this.options.directories) {
      // Simple pattern matching - nếu pattern có 'src/**/*.js' thì tìm trong src directory
      let baseDir = pattern.includes('src/') ? 'src' : '.';

      const files = this.walkDirectory(baseDir);
      allFiles.push(...files);
    }

    // Remove duplicates và filter .js files
    return [...new Set(allFiles)].filter(file => file.endsWith('.js'));
  }

  /**
   * Recursively walk directory để tìm JS files
   */
  walkDirectory(dir) {
    const files = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);

        // Skip excluded patterns
        if (this.options.excludePatterns.some(pattern =>
          fullPath.includes(pattern.replace(/\*/g, ''))
        )) {
          continue;
        }

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.walkDirectory(fullPath));
        } else if (stat.isFile() && item.endsWith('.js')) {
          files.push(path.resolve(fullPath));
        }
      }
    } catch (error) {
      // Ignore directories we can't read
    }

    return files;
  }

  /**
   * Main execution
   */
  async run() {
    console.log('🧹 Console.log Removal Tool');
    console.log('================================');

    if (this.options.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified');
    }

    if (this.options.backup && !this.options.dryRun) {
      console.log('💾 BACKUP MODE - Original files will be backed up');
    }

    console.log(`🎯 Target: console.${this.options.includeOtherMethods ? '* methods' : 'log only'}`);
    console.log(`📂 Directories: ${this.options.directories.join(', ')}`);
    console.log('');

    const files = await this.findFiles();

    if (files.length === 0) {
      console.log('❌ No JavaScript files found');
      return;
    }

    console.log(`📊 Found ${files.length} JavaScript files to process`);

    for (const file of files) {
      await this.processFile(file);
    }

    console.log('\n📋 Summary');
    console.log('===========');
    console.log(`📁 Files processed: ${this.processedFiles}`);
    console.log(`🧹 Total console statements removed: ${this.removedCount}`);

    if (this.options.dryRun) {
      console.log('\n💡 Run without --dry-run to actually remove console statements');
    }
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    backup: args.includes('--backup') || args.includes('-b'),
    includeOtherMethods: args.includes('--all-methods') || args.includes('-a'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
  };

  // Custom directories
  const dirIndex = args.findIndex(arg => arg === '--dirs');
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    options.directories = args[dirIndex + 1].split(',');
  }

  return options;
}

function showHelp() {
  console.log(`
🧹 Console.log Removal Tool

Usage: node remove-console-logs.js [options]

Options:
  -d, --dry-run           Preview changes without modifying files
  -b, --backup            Create backup files before modification
  -a, --all-methods       Remove all console methods (log, warn, error, etc.)
  -v, --verbose           Show detailed output
  --dirs <patterns>       Comma-separated glob patterns (default: src/**/*.js)
  -h, --help              Show this help

Examples:
  node remove-console-logs.js --dry-run          # Preview mode
  node remove-console-logs.js --backup           # Safe mode with backups
  node remove-console-logs.js --all-methods      # Remove all console methods
  node remove-console-logs.js --dirs "src/**/*.js,lib/**/*.js"  # Custom paths

The tool handles:
  ✅ Single line console.log('hello')
  ✅ Multi-line console.log(
       'multi line',
       object
     )
  ✅ Nested objects console.log({ a: { b: c } })
  ✅ Complex expressions console.log(func(a, b), obj.prop)
`);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  const remover = new ConsoleLogRemover(options);
  await remover.run();
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ConsoleLogRemover;