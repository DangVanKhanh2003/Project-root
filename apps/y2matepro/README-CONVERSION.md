# Eleventy Template Conversion - Documentation Index

## 🚀 Quick Start

**Bắt đầu từ đây:** `START-HERE.md`

## 📚 Documentation Files

### For AI Converting HTML Files

1. **START-HERE.md** - Quick overview (1 page)
   - What to do
   - File locations  
   - Simple workflow
   - ⭐ READ THIS FIRST

2. **AI-SIMPLE-GUIDE.md** - Complete guide (~300 lines)
   - Step-by-step 4-step process
   - Full template structure
   - Checklist per page
   - Examples & best practices
   - ⭐ MAIN REFERENCE

3. **PROMPT-FOR-AI.md** - Ready-to-use prompts
   - Copy-paste prompt template
   - File-by-file mapping
   - Usage instructions

4. **ai-prompts/** - Individual prompts (8 files)
   - `01-youtube-to-mp4.txt`
   - `02-youtube-to-mp3.txt`
   - `03-youtube-music-downloader.txt`
   - `04-youtube-short-downloader.txt`
   - `05-youtube-to-mp3-320kbps-converter.txt`
   - `06-youtube-to-wav-converter.txt`
   - `07-youtube-to-ogg-converter.txt`
   - `08-youtube-to-opus-converter.txt`
   - ⭐ READY TO USE - Copy & send to AI

### Background Documentation

5. **README-11TY.md** - Eleventy system documentation
   - How Eleventy works in this project
   - Data loading & i18n
   - Component structure
   - Filters & helpers

6. **ELEVENTY-SETUP-GUIDE.md** - Setup lessons learned
   - Real-world experience
   - Common pitfalls
   - Best practices
   - Troubleshooting

### Tracking

7. **CONVERSION-PROGRESS.md** - Progress tracking
   - Current status: 1/9 (11%)
   - Checklist for each page
   - Time estimates

## 📁 File Structure

```
apps/y2matepro/
├── START-HERE.md                  ⭐ Start here
├── AI-SIMPLE-GUIDE.md            ⭐ Main guide
├── PROMPT-FOR-AI.md              ⭐ Prompts template
├── ai-prompts/                    ⭐ Ready-to-use prompts
│   ├── 01-youtube-to-mp4.txt
│   ├── 02-youtube-to-mp3.txt
│   └── ... (8 files total)
├── README-11TY.md                 Background
├── ELEVENTY-SETUP-GUIDE.md        Background
├── CONVERSION-PROGRESS.md         Tracking
│
├── backup-html-originals/         Source files
│   ├── index.html                 (reference - done)
│   ├── youtube-to-mp4.html
│   └── ... (9 files total)
│
├── _templates/
│   ├── pages/
│   │   ├── index.njk             ✅ Reference template
│   │   ├── youtube-to-mp4.njk    ⏳ To create
│   │   └── ...
│   ├── _includes/
│   │   ├── base.njk              ✅ Layout
│   │   ├── header.njk            ✅ Header component
│   │   └── footer.njk            ✅ Footer component
│   └── _data/
│       └── i18n/
│           └── en.json           ⏳ Update with each page
│
└── _11ty-output/                  Build output
```

## 🎯 Conversion Workflow

### For Each HTML File:

1. **Choose prompt:**
   - Open `ai-prompts/01-youtube-to-mp4.txt`
   - Copy entire content

2. **Send to AI:**
   - Paste prompt
   - AI will:
     - Read backup HTML
     - Extract content to i18n
     - Create template
     - Build & verify

3. **Verify output:**
   - Check build success
   - Verify no empty variables
   - Test in browser

4. **Update progress:**
   - Mark completed in `CONVERSION-PROGRESS.md`
   - Move to next file

## 📊 Current Status

- **Completed:** 1/9 (index.html)
- **Remaining:** 8 converter pages
- **Excluded:** 5 static pages (no conversion needed)

Progress: [██░░░░░░░░░░░░░░░░░░] 11%

## ⏱️ Time Estimate

- Per page: 35-45 minutes
- Total remaining: 4-6 hours

## 🔑 Key Points

✅ **DO:**
- Use `index.njk` as reference
- Keep form structure EXACTLY the same
- Use loops for features & FAQs
- Copy SVG icons from backup HTML
- Follow 4-step process

❌ **DON'T:**
- Add JSON-LD scripts (already in originals)
- Change CSS classes or IDs
- Modify HTML structure
- Skip build verification

## 🆘 Need Help?

1. Read `AI-SIMPLE-GUIDE.md` for detailed steps
2. Check `index.njk` for template example
3. Check `en.json` for data structure example
4. Review `ELEVENTY-SETUP-GUIDE.md` for troubleshooting

## 📝 Notes

- Static pages (404, about-us, contact, privacy-policy, terms-condition) are NOT converted
- Templates do NOT include JSON-LD (already in original HTML)
- All converter pages share same form structure
- Only content (hero, features, FAQs) differs per page

---

**Version:** 2.0 (Simplified - No JSON-LD)  
**Last Updated:** 2025-12-18  
**Status:** Ready for conversion
