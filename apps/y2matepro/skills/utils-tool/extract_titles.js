
import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const ignoreDirs = ['node_modules', 'dist', '.git', 'backup', '.claude', '.github', 'skills', '_11ty-output'];

async function findHtmlFiles(dir) {
    let htmlFiles = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!ignoreDirs.includes(entry.name)) {
                    htmlFiles.push(...await findHtmlFiles(fullPath));
                }
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`Không thể đọc thư mục: ${dir}`, error);
    }
    return htmlFiles;
}

async function extractTitlesAndLineNumbers() {
    console.log('--- Bắt đầu quét toàn bộ dự án để trích xuất tiêu đề (sử dụng fs) ---');

    const allHtmlFiles = await findHtmlFiles(projectRoot);

    console.log(`Tìm thấy ${allHtmlFiles.length} tệp HTML.`);

    const reportLines = [];

    for (const file of allHtmlFiles) {
        const relativePath = path.relative(projectRoot, file);
        try {
            const content = await fs.readFile(file, 'utf-8');
            const lines = content.split('\n');
            let title = '';
            let lineNumber = -1;
            const titleRegex = /<title[^>]*>([^<]*)<\/title>/;

            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(titleRegex);
                if (match && match[1]) {
                    title = match[1].trim();
                    lineNumber = i + 1;
                    break;
                }
            }

            if (title) {
                reportLines.push(`${title} : ${relativePath} : ${lineNumber}`);
            } else {
                console.warn(`- Không tìm thấy tiêu đề trong: ${relativePath}`);
            }
        } catch (error) {
            console.error(`Lỗi xử lý tệp ${file}:`, error);
        }
    }

    const reportContent = reportLines.join('\n');
    const reportFileName = 'titles_report.txt';
    await fs.writeFile(reportFileName, reportContent, 'utf-8');

    console.log('\n--- Hoàn thành ---');
    console.log(`Báo cáo đã được lưu vào tệp: ${reportFileName}`);
}

extractTitlesAndLineNumbers().catch(console.error);
