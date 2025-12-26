# HTML Backup - Converter Pages Only

**Backup Date:** 2025-12-18
**Purpose:** Preserve original converter page HTML files before Eleventy template conversion

**Note:** Static pages (404, about-us, contact, privacy-policy, terms-condition) are NOT backed up as they don't need multi-language support and will remain as-is.

## Files Backed Up (9 files)

| File | Size | Lines | Status |
|------|------|-------|--------|
| index.html | 27K | ~500 | ✅ Converted (reference) |
| youtube-to-mp4.html | 26K | ~500 | ⏳ To be converted |
| youtube-to-mp3.html | 26K | ~500 | ⏳ To be converted |
| youtube-music-downloader.html | 27K | ~500 | ⏳ To be converted |
| youtube-short-downloader.html | 24K | ~460 | ⏳ To be converted |
| youtube-to-mp3-320kbps-converter.html | 24K | ~460 | ⏳ To be converted |
| youtube-to-wav-converter.html | 21K | ~420 | ⏳ To be converted |
| youtube-to-ogg-converter.html | 23K | ~440 | ⏳ To be converted |
| youtube-to-opus-converter.html | 22K | ~430 | ⏳ To be converted |

**Total:** 9 converter pages, ~240K

## Usage

These files serve as the source for Eleventy template conversion.

**DO NOT MODIFY these files** - they are the single source of truth for content extraction.

## Conversion Process

Follow instructions in: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/AI-TEMPLATE-CONVERSION-INSTRUCTIONS.md`

## Restore Instructions

If needed to restore original HTML files:

```bash
# Restore all files
cp backup-html-originals/*.html ./

# Restore specific file
cp backup-html-originals/youtube-to-mp4.html ./youtube-to-mp4.html
```

## Notes

- Files were backed up from root directory: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/`
- Original files will be replaced with Eleventy-generated HTML after conversion
- Keep this backup folder in git for historical reference
- After successful conversion and verification, this folder can be moved to project documentation
