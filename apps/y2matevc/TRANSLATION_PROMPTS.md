# Translation Prompts for AI CLI

## Prompt 1: Translate Index Page (Homepage)

```
Please read and translate the JSON file at this location:
F:\downloader\Project-root\apps\y2matevc\_templates\_data\pages\index\en.json

Create separate translated JSON files for each of these language codes: vi.json (Vietnamese), ar.json (Arabic), es.json (Spanish), fr.json (French), de.json (German), it.json (Italian), pt.json (Portuguese), ja.json (Japanese), ko.json (Korean), , ru.json (Russian), hi.json (Hindi), id.json (Indonesian), th.json (Thai), tr.json (Turkish).

IMPORTANT TRANSLATION RULES:
1. Keep ALL JSON structure, keys, and formatting exactly the same
2. Translate ONLY the text values, NOT the keys
3. Keep ALL HTML tags (<a>, <strong>, <em>) unchanged
4. Keep ALL href links (/youtube-to-mp4, /youtube-to-mp3, etc.) unchanged
5. Brand name "Y2Mate" should remain unchanged
6. Technical terms: Keep "MP3", "MP4", "YouTube", "YouTube Shorts" unchanged
7. Maintain professional, clear, and natural tone in the target language
8. For SEO fields: Make translations optimized for search engines in that language
9. Keep line breaks and paragraph structure

Save each translated file in the same directory with the corresponding language code (e.g., vi.json, ar.json, etc.)
```

---

## Prompt 2: Translate YouTube to MP3 Page

```
Please read and translate the JSON file at this location:
F:\downloader\Project-root\apps\y2matevc\_templates\_data\pages\youtube-to-mp3\en.json

Create separate translated JSON files for each of these language codes: vi.json (Vietnamese), ar.json (Arabic), es.json (Spanish), fr.json (French), de.json (German), it.json (Italian), pt.json (Portuguese), ja.json (Japanese), ko.json (Korean), , ru.json (Russian), hi.json (Hindi), id.json (Indonesian), th.json (Thai), tr.json (Turkish).

IMPORTANT TRANSLATION RULES:
1. Keep ALL JSON structure, keys, and formatting exactly the same
2. Translate ONLY the text values, NOT the keys
3. Keep ALL HTML tags (<strong>, <a>, <em>) unchanged
4. Keep ALL href links (/, /youtube-to-mp4) unchanged
5. Brand name "Y2Mate" should remain unchanged
6. Technical terms: Keep "MP3", "MP4", "YouTube", "bitrate", "kbps" unchanged
7. Maintain professional, clear, and natural tone in the target language
8. For SEO fields: Make translations optimized for search engines in that language
9. Keep line breaks and paragraph structure
10. For FAQ section: Ensure questions and answers are natural in the target language

Save each translated file in the same directory with the corresponding language code (e.g., vi.json, ar.json, etc.)
```

---

## Prompt 3: Translate YouTube to MP4 Page

```
Please read and translate the JSON file at this location:
F:\downloader\Project-root\apps\y2matevc\_templates\_data\pages\youtube-to-mp4\en.json

Create separate translated JSON files for each of these language codes: vi.json (Vietnamese), ar.json (Arabic), es.json (Spanish), fr.json (French), de.json (German), it.json (Italian), pt.json (Portuguese), ja.json (Japanese), ko.json (Korean), , ru.json (Russian), hi.json (Hindi), id.json (Indonesian), th.json (Thai), tr.json (Turkish).

IMPORTANT TRANSLATION RULES:
1. Keep ALL JSON structure, keys, and formatting exactly the same
2. Translate ONLY the text values, NOT the keys
3. Keep ALL HTML tags (<strong>, <a>, <em>) unchanged
4. Keep ALL href links (/, /youtube-to-mp3, /youtube-short-downloader) unchanged
5. Brand name "Y2Mate" should remain unchanged
6. Technical terms: Keep "MP4", "MP3", "YouTube", "YouTube Shorts", "SD", "HD", "Full HD", "2K", "4K" unchanged
7. Resolution values: Keep "360p", "1080p", "2K", "4K" unchanged
8. Maintain professional, clear, and natural tone in the target language
9. For SEO fields: Make translations optimized for search engines in that language
10. Keep line breaks and paragraph structure
11. For FAQ section: Ensure questions and answers are natural in the target language

Save each translated file in the same directory with the corresponding language code (e.g., vi.json, ar.json, etc.)
```

---

## Prompt 4: Translate YouTube Shorts Downloader Page

```
Please read and translate the JSON file at this location:
F:\downloader\Project-root\apps\y2matevc\_templates\_data\pages\youtube-short-downloader\en.json

Create separate translated JSON files for each of these language codes: vi.json (Vietnamese), ar.json (Arabic), es.json (Spanish), fr.json (French), de.json (German), it.json (Italian), pt.json (Portuguese), ja.json (Japanese), ko.json (Korean), , ru.json (Russian), hi.json (Hindi), id.json (Indonesian), th.json (Thai), tr.json (Turkish).

IMPORTANT TRANSLATION RULES:
1. Keep ALL JSON structure, keys, and formatting exactly the same
2. Translate ONLY the text values, NOT the keys
3. Keep ALL HTML tags (<strong>, <a>, <em>) unchanged
4. Keep ALL href links (/, /youtube-to-mp3, /youtube-to-mp4) unchanged
5. Brand name "Y2Mate" should remain unchanged
6. Technical terms: Keep "MP4", "MP3", "YouTube", "YouTube Shorts", "Shorts" unchanged
7. Resolution values: Keep "360p", "720p", "1080p", "2K", "4K" unchanged
8. Maintain professional, clear, and natural tone in the target language
9. For SEO fields: Make translations optimized for search engines in that language
10. Keep line breaks and paragraph structure
11. For FAQ section: Ensure questions and answers are natural in the target language

Save each translated file in the same directory with the corresponding language code (e.g., vi.json, ar.json, etc.)
```

---

## Usage Instructions

1. **For each prompt above:**
   - Copy the entire prompt text (inside the code block)
   - Paste it into your AI CLI tool (Claude Code, Cursor, Windsurf, etc.)
   - The AI will automatically read the en.json file from the specified path
   - The AI will generate translated JSON files for all 15 languages
   - The AI will save them in the same directory with appropriate language codes

2. **Expected output locations:**
   - Prompt 1 outputs → `F:\downloader\Project-root\apps\y2matevc\_templates\_data\pages\index\[language-code].json`
   - Prompt 2 outputs → `F:\downloader\Project-root\apps\y2matevc\_templates\_data\pages\youtube-to-mp3\[language-code].json`
   - Prompt 3 outputs → `F:\downloader\Project-root\apps\y2matevc\_templates\_data\pages\youtube-to-mp4\[language-code].json`
   - Prompt 4 outputs → `F:\downloader\Project-root\apps\y2matevc\_templates\_data\pages\youtube-short-downloader\[language-code].json`

3. **Languages to generate:**
   - `vi.json` - Vietnamese (Tiếng Việt)
   - `ar.json` - Arabic (العربية)
   - `es.json` - Spanish (Español)
   - `fr.json` - French (Français)
   - `de.json` - German (Deutsch)
   - `it.json` - Italian (Italiano)
   - `pt.json` - Portuguese (Português)
   - `ja.json` - Japanese (日本語)
   - `ko.json` - Korean (한국어)
   - `ru.json` - Russian (Русский)
   - `hi.json` - Hindi (हिन्दी)
   - `id.json` - Indonesian (Bahasa Indonesia)
   - `th.json` - Thai (ไทย)
   - `tr.json` - Turkish (Türkçe)

4. **Quality check:**
   - Verify JSON structure is intact
   - Ensure all HTML tags and links are preserved
   - Check that brand names and technical terms remain unchanged
   - Review translations for natural language flow

