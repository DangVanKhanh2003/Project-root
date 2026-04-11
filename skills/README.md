# Title Extraction Script

This utility script is designed to scan the HTML files of a specific application within the `apps/` directory and extract their `<title>` tags.

## Location

The script is located at: `skills/extract_titles.js`

## Prerequisites

- Node.js must be installed on your system.

## How to Use (Step-by-Step)

To use the script for any project, follow these steps.

### Step 1: Identify the Project's Folder Name

Find the name of the project's folder that you want to scan. This folder **must** be located inside the `apps/` directory.

*Example project folder names: `y2matepro`, `4k-downloader`, `clone-7`*

### Step 2: Run the Command

Open a terminal at the project root directory (`F:\downloader\Project-root`) and run the command below. Replace `<project-folder-name>` with the name you identified in Step 1.

```bash
node skills/extract_titles.js <project-folder-name>
```

### Step 3: Check the Output

The script will generate a report file in the project root directory named `titles_report_<project-folder-name>.txt`.

---

### Full Example: Scanning the `4k-downloader` project

1.  The project's folder name is `4k-downloader`.
2.  Run the following command:
    ```bash
    node skills/extract_titles.js 4k-downloader
    ```
3.  A new file named `titles_report_4k-downloader.txt` will be created with the results.

Each line in the report file will be in the following format:
```
Extracted Title : path/to/the/file.html : line-number
```
