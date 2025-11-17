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

interface ConsoleLogRemoverOptions {
  dryRun?: boolean;
  backup?: boolean;
  includeOtherMethods?: boolean;
  verbose?: boolean;
  directories?: string[];
  excludePatterns?: string[];
}

interface ConsoleStatement {
  match: string;
  start: number;
  end: number;
  method: string;
}

interface RemovalResult {
  content: string;
  removedCount: number;
}

class ConsoleLogRemover {
  private options: Required<ConsoleLogRemoverOptions>;
  private removedCount: number = 0;
  private processedFiles: number = 0;

  constructor(options: ConsoleLogRemoverOptions = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      backup: options.backup || false,
      includeOtherMethods: options.includeOtherMethods || false,
      verbose: options.verbose || false,
      directories: options.directories || ['src/**/*.{js,ts,tsx}'],
      excludePatterns: options.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts']
    };
  }

  /**
   * Tạo regex pattern để match console statements
   * Handles multi-line console.log với proper parentheses matching
   */
  private createConsoleRegex(): RegExp {
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
  private findConsoleStatements(content: string): ConsoleStatement[] {
    const consoleMethods = this.options.includeOtherMethods
      ? 'log|warn|error|info|debug|trace|table|group|groupEnd|time|timeEnd'
      : 'log';

    const matches: ConsoleStatement[] = [];
    const regex = new RegExp(`console\\.(${consoleMethods})\\s*\\(`, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const startPos = match.index;
      const openParenPos = content.indexOf('(', startPos + match[0].length - 1);

      // Tìm matching closing parenthesis
      let parenCount = 1;
      let pos = openParenPos + 1;
      let inString = false;
      let stringChar: string | null = null;
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
  private removeConsoleStatements(content: string): RemovalResult {
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
      const beforeTrimmed = before.split('\n').pop()?.trim() || '';
      const afterTrimmed = after.split('\n')[0]?.trim() || '';

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
      }
    }

    return { content: modifiedContent, removedCount };
  }

  /**
   * Backup file trước khi modify
   */
  private createBackup(filePath: string): void {
    if (!this.options.backup) return;

    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
  }

  /**
   * Process một file
   */
  private async processFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = this.removeConsoleStatements(content);

      if (result.removedCount > 0) {

        if (this.options.dryRun) {
        } else {
          this.createBackup(filePath);
          fs.writeFileSync(filePath, result.content, 'utf8');
        }

        this.removedCount += result.removedCount;
      }

      this.processedFiles++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Tìm tất cả JavaScript/TypeScript files
   */
  private async findFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.options.directories) {
      // Simple pattern matching - nếu pattern có 'src/' thì tìm trong src directory
      let baseDir = pattern.includes('src/') ? 'src' : '.';

      const files = this.walkDirectory(baseDir);
      allFiles.push(...files);
    }

    // Remove duplicates và filter .js/.ts/.tsx files (exclude .d.ts)
    return [...new Set(allFiles)].filter(file =>
      (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx'))
      && !file.endsWith('.d.ts')
    );
  }

  /**
   * Recursively walk directory để tìm JS/TS files
   */
  private walkDirectory(dir: string): string[] {
    const files: string[] = [];

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
        } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.tsx'))) {
          // Exclude .d.ts files
          if (!item.endsWith('.d.ts')) {
            files.push(path.resolve(fullPath));
          }
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
  public async run(): Promise<void> {

    if (this.options.dryRun) {
    }

    if (this.options.backup && !this.options.dryRun) {
    }


    const files = await this.findFiles();

    if (files.length === 0) {
      return;
    }


    for (const file of files) {
      await this.processFile(file);
    }


    if (this.options.dryRun) {
    }
  }
}

// CLI interface
function parseArgs(): ConsoleLogRemoverOptions & { help?: boolean } {
  const args = process.argv.slice(2);
  const options: ConsoleLogRemoverOptions & { help?: boolean } = {
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

function showHelp(): void {
  const remover = new ConsoleLogRemover(options);
  await remover.run();
}

// Error handling
process.on('unhandledRejection', (error) => {
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ConsoleLogRemover;
