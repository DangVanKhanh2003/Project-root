# Translation Prompts for i18n JSON Files

Use these prompts with AI (ChatGPT, Claude, Gemini, etc.) to translate `en.json` to other languages.

**Target languages:** ar, bn, de, es, fr, hi, id, it, ja, ko, my, ms, pt, ru, th, tr, ur, vi (18 total)

---

## PROMPT 1 (9 languages: ar, bn, de, es, fr, hi, id, it, ja)

```
You are a professional translator. Translate the following JSON content from English to MULTIPLE languages.

**CRITICAL RULES:**
1. ONLY translate the STRING VALUES - DO NOT change any JSON keys
2. Keep the EXACT same JSON structure (all keys, nesting, arrays must remain identical)
3. Keep technical terms like "MP3", "YouTube", "URL", "kbps", numbers unchanged
4. The "step" field values (1, 2, 3) are numbers - DO NOT translate them
5. Output valid JSON for EACH language separately
6. Label each output clearly with the language code

**TRANSLATE TO THESE 9 LANGUAGES:**
1. ar (Arabic - العربية)
2. bn (Bengali - বাংলা)
3. de (German - Deutsch)
4. es (Spanish - Español)
5. fr (French - Français)
6. hi (Hindi - हिन्दी)
7. id (Indonesian - Bahasa Indonesia)
8. it (Italian - Italiano)
9. ja (Japanese - 日本語)

**SOURCE JSON (English):**
{
  "seo": {
    "title": "YouTube to MP3 Converter – Fast & Reliable MP3 Download",
    "description": "Convert YouTube videos to MP3 with high speed. Choose MP3 quality before converting. No video length limit, no registration required."
  },
  "h1": "YouTube to MP3 Converter",
  "intro": "This tool allows you to convert YouTube videos to MP3 quickly and reliably. Simply paste a YouTube link, select your desired MP3 quality, and download the file directly to your device. No software installation and no account required.",
  "primary_features": {
    "h2": "Key Features",
    "items": [
      "Convert YouTube videos to MP3 format",
      "Select MP3 quality before conversion",
      "Supports MP3 quality from 64kbps up to 320kbps",
      "No video length limitation",
      "Downloaded MP3 files contain no tags or watermarks"
    ]
  },
  "performance": {
    "h2": "Conversion Performance",
    "content": "The system is optimized for speed. For videos with a duration of around 10 hours, MP3 conversion typically takes only 10 to 15 seconds. Download speed depends on the user's internet connection."
  },
  "how_to": {
    "h2": "How to convert YouTube to MP3",
    "steps": [
      {"step": 1, "content": "Copy the URL of the YouTube video you want to convert."},
      {"step": 2, "content": "Paste the link into the input box above, choose the MP3 quality, and click Convert."},
      {"step": 3, "content": "Once the conversion is complete, click Download MP3 to save the file to your device."}
    ]
  },
  "limitations": {
    "h2": "Usage Notes",
    "content": "The tool supports all public YouTube videos that are accessible and allowed by YouTube. During peak hours such as evenings or weekends, processing time may be slightly slower due to high traffic."
  },
  "privacy_notice": {
    "content": "No account registration is required and no personal information is collected."
  },
  "responsibility_notice": {
    "content": "Users are solely responsible for the content they convert and download."
  }
}

**OUTPUT FORMAT:**
=== ar.json ===
{...full JSON here...}

=== bn.json ===
{...full JSON here...}

=== de.json ===
{...full JSON here...}

=== es.json ===
{...full JSON here...}

=== fr.json ===
{...full JSON here...}

=== hi.json ===
{...full JSON here...}

=== id.json ===
{...full JSON here...}

=== it.json ===
{...full JSON here...}

=== ja.json ===
{...full JSON here...}
```

---

## PROMPT 2 (9 languages: ko, my, ms, pt, ru, th, tr, ur, vi)

```
You are a professional translator. Translate the following JSON content from English to MULTIPLE languages.

**CRITICAL RULES:**
1. ONLY translate the STRING VALUES - DO NOT change any JSON keys
2. Keep the EXACT same JSON structure (all keys, nesting, arrays must remain identical)
3. Keep technical terms like "MP3", "YouTube", "URL", "kbps", numbers unchanged
4. The "step" field values (1, 2, 3) are numbers - DO NOT translate them
5. Output valid JSON for EACH language separately
6. Label each output clearly with the language code

**TRANSLATE TO THESE 9 LANGUAGES:**
1. ko (Korean - 한국어)
2. my (Burmese - မြန်မာ)
3. ms (Malay - Bahasa Melayu)
4. pt (Portuguese - Português)
5. ru (Russian - Русский)
6. th (Thai - ไทย)
7. tr (Turkish - Türkçe)
8. ur (Urdu - اردو)
9. vi (Vietnamese - Tiếng Việt)

**SOURCE JSON (English):**
{
  "seo": {
    "title": "YouTube to MP3 Converter – Fast & Reliable MP3 Download",
    "description": "Convert YouTube videos to MP3 with high speed. Choose MP3 quality before converting. No video length limit, no registration required."
  },
  "h1": "YouTube to MP3 Converter",
  "intro": "This tool allows you to convert YouTube videos to MP3 quickly and reliably. Simply paste a YouTube link, select your desired MP3 quality, and download the file directly to your device. No software installation and no account required.",
  "primary_features": {
    "h2": "Key Features",
    "items": [
      "Convert YouTube videos to MP3 format",
      "Select MP3 quality before conversion",
      "Supports MP3 quality from 64kbps up to 320kbps",
      "No video length limitation",
      "Downloaded MP3 files contain no tags or watermarks"
    ]
  },
  "performance": {
    "h2": "Conversion Performance",
    "content": "The system is optimized for speed. For videos with a duration of around 10 hours, MP3 conversion typically takes only 10 to 15 seconds. Download speed depends on the user's internet connection."
  },
  "how_to": {
    "h2": "How to convert YouTube to MP3",
    "steps": [
      {"step": 1, "content": "Copy the URL of the YouTube video you want to convert."},
      {"step": 2, "content": "Paste the link into the input box above, choose the MP3 quality, and click Convert."},
      {"step": 3, "content": "Once the conversion is complete, click Download MP3 to save the file to your device."}
    ]
  },
  "limitations": {
    "h2": "Usage Notes",
    "content": "The tool supports all public YouTube videos that are accessible and allowed by YouTube. During peak hours such as evenings or weekends, processing time may be slightly slower due to high traffic."
  },
  "privacy_notice": {
    "content": "No account registration is required and no personal information is collected."
  },
  "responsibility_notice": {
    "content": "Users are solely responsible for the content they convert and download."
  }
}

**OUTPUT FORMAT:**
=== ko.json ===
{...full JSON here...}

=== my.json ===
{...full JSON here...}

=== ms.json ===
{...full JSON here...}

=== pt.json ===
{...full JSON here...}

=== ru.json ===
{...full JSON here...}

=== th.json ===
{...full JSON here...}

=== tr.json ===
{...full JSON here...}

=== ur.json ===
{...full JSON here...}

=== vi.json ===
{...full JSON here...}
```

---

## How to Use

1. Copy **PROMPT 1** → Paste to AI #1
2. Copy **PROMPT 2** → Paste to AI #2 (run in parallel)
3. Wait for both to complete
4. Extract each `=== xx.json ===` section
5. Save to `_templates/_data/pages/index/xx.json`

## File Structure After Translation

```
_templates/_data/pages/index/
├── en.json (original)
├── ar.json
├── bn.json
├── de.json
├── es.json
├── fr.json
├── hi.json
├── id.json
├── it.json
├── ja.json
├── ko.json
├── my.json
├── ms.json
├── pt.json
├── ru.json
├── th.json
├── tr.json
├── ur.json
└── vi.json
```
