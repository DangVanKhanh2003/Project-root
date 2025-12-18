# 🚀 START HERE - AI Conversion Guide

## What You Need to Do

Convert **8 converter pages** from HTML to Eleventy templates.

## Quick Reference

📖 **Main Guide:** `AI-SIMPLE-GUIDE.md` (read this first!)

📊 **Progress Tracking:** `CONVERSION-PROGRESS.md`

📁 **Files:**
- Backups: `backup-html-originals/*.html`
- Templates: `_templates/pages/*.njk`
- i18n: `_templates/_data/i18n/en.json`

## Files to Convert (8 pages)

```
⏳ youtube-to-mp4.html
⏳ youtube-to-mp3.html  
⏳ youtube-music-downloader.html
⏳ youtube-short-downloader.html
⏳ youtube-to-mp3-320kbps-converter.html
⏳ youtube-to-wav-converter.html
⏳ youtube-to-ogg-converter.html
⏳ youtube-to-opus-converter.html
```

## Simple Workflow

For each file:

1. **Read** `backup-html-originals/{filename}.html`
2. **Extract** content → add to `_templates/_data/i18n/en.json`
3. **Create** `_templates/pages/{filename}.njk`
4. **Build** `npm run 11ty:build`
5. **Copy** `cp _11ty-output/{filename}.html .`

## Key Points

✅ Use `index.njk` as reference (already done)
✅ Keep form structure EXACTLY the same
✅ Use loops for features & FAQs
✅ Copy SVG icons from original HTML
❌ NO JSON-LD scripts (already in original files)
❌ DON'T change CSS classes or IDs

## Time: 4-6 hours total

**Start with `youtube-to-mp4.html` first!**

Read `AI-SIMPLE-GUIDE.md` for complete step-by-step instructions.
