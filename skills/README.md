# Title Extraction Script

This utility script is designed to scan the HTML files of a specific application within the `apps/` directory and extract their `<title>` tags.

## Location

The script is located at: `skills/extract_titles.js`

## Prerequisites

- Node.js must be installed on your system.

## Usage

To run the script, execute the following command from the project root directory (`F:\downloader\Project-root`):

```bash
node skills/extract_titles.js <app-name>
```

### Arguments

-   `<app-name>`: (Required) The name of the application directory you want to scan. This directory must exist inside the `apps/` folder.

### Example

To extract titles from all HTML files in the `apps/y2matepro` directory, run:

```bash
node skills/extract_titles.js y2matepro
```

## Output

The script will generate a report file in the project root directory named `titles_report_<app-name>.txt`.

Each line in the report file will be in the following format:

```
Extracted Title : path/to/the/file.html : line-number
```

For example:

```
YouTube Downloader - Download YouTube Videos for Free : apps/y2matepro/index.html : 12
```
