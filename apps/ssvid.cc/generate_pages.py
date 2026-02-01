
import json
import re
import os

BASE_DIR = r"f:\downloader\Project-root\apps\ssvid.cc"
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
EN_DIR = os.path.join(BASE_DIR, "en")

def load_json(filename):
    with open(os.path.join(EN_DIR, filename), 'r', encoding='utf-8') as f:
        return json.load(f)

def update_html(template, data, filename_key):
    html = template

    # 1. Title
    if 'seo' in data:
        html = re.sub(r'<title>.*?</title>', f"<title>{data['seo']['title']}</title>", html)
        # Meta Desc
        html = re.sub(r'<meta name="description"\s+content=".*?"', f'<meta name="description"\n        content="{data["seo"]["meta_description"]}"', html, flags=re.DOTALL)

    # 2. Hero
    if 'hero' in data:
        html = re.sub(r'<h1 class="title-hero">.*?</h1>', f'<h1 class="title-hero">{data["hero"]["h1"]}</h1>', html)
        html = re.sub(r'<p class="subtitle-hero">.*?</p>', f'<p class="subtitle-hero">{data["hero"]["subtitle"]}</p>', html)

    # 3. Overview Left (Section 0)
    sec0 = data['sections'][0]
    html = re.sub(r'<h2 class="overview-title">.*?</h2>', f'<h2 class="overview-title">{sec0["h2"]}</h2>', html)
    html = re.sub(r'<p class="overview-desc">[\s\S]*?</p>', f'<p class="overview-desc">\n                        {sec0["content"]}\n                    </p>', html)

    # 4. Overview Right (Steps) (Section 1)
    sec1 = data['sections'][1]
    # Update Title
    html = re.sub(r'<h2 class="steps-card-title">.*?</h2>', f'<h2 class="steps-card-title">{sec1["h2"]}</h2>', html)
    
    # Parse Steps
    steps_text = sec1['content'].split('<br>')
    clean_steps = [re.sub(r'^\d+\.\s*', '', s).strip() for s in steps_text]
    
    # Inline class for state management in regex callback
    class StepReplacer:
        def __init__(self, steps):
            self.steps = steps
            self.idx = 0
        
        def replace(self, match):
            if self.idx < len(self.steps):
                start = match.group(1)
                content = self.steps[self.idx]
                self.idx += 1
                return f'{start}<p>{content}</p>'
            return match.group(0)

    step_replacer = StepReplacer(clean_steps)
    html = re.sub(r'(<div class="step-text">\s*<h4>.*?</h4>\s*)<p>.*?</p>', step_replacer.replace, html, flags=re.DOTALL)


    # 5. What Can You Download (White Section) - Section 4
    sec4 = data['sections'][4]
    
    # Remove the description paragraph specifically in this section (before subsections)
    # We identify the section by the h2 "What Can You Download..." which we will update
    # But currently it is "What Can You Download with SSVID?".
    
    # First, update the H2 title to the new one
    # Note: Use generic match for original title
    html = re.sub(r'<h2 class="titles">What Can You Download with SSVID\?</h2>', f'<h2 class="titles">{sec4["h2"]}</h2>', html)
    
    # Now remove the <p> that follows immediately (if any)
    # This <p> is between the NEW H2 and the first <div class="subsection">
    # We must be careful not to match too much.
    # Pattern: (Specific New H2)\s*(<p>.*?</p>)\s*(<div class="subsection">)
    safe_h2 = re.escape(sec4["h2"])
    html = re.sub(f'(<h2 class="titles">{safe_h2}</h2>)\s*<p>.*?</p>\s*(<div class="subsection">)', r'\1\n                \2', html, flags=re.DOTALL)

    # Update Subsections
    items = sec4.get('items', [])
    if items:
        class SubsecReplacer:
            def __init__(self, items):
                self.items = items
                self.idx = 0
            
            def replace(self, match):
                if self.idx < len(self.items):
                    item = self.items[self.idx]
                    self.idx += 1
                    return f'<div class="subsection">\n                    <h3>{item["h3"]}</h3>\n                    <p>{item["content"]}</p>\n                </div>'
                return match.group(0)
        
        subsec_replacer = SubsecReplacer(items)
        html = re.sub(r'<div class="subsection">[\s\S]*?</div>', subsec_replacer.replace, html)


    # 6. Gray Section (Quality / Why) - Sections 2 and 3
    sec2 = data['sections'][2]
    sec3 = data['sections'][3]
    
    gray_replacement = f"""
            <div class="container">
                <h2 class="titles">{sec2["h2"]}</h2>
                <p style="text-align: center;">{sec2["content"]}</p>
                <br><br>
                <h2 class="titles">{sec3["h2"]}</h2>
                <p style="text-align: center;">{sec3["content"]}</p>
            </div>
    """
    
    html = re.sub(r'<section class="content-section content-section--gray">\s*<div class="container">[\s\S]*?</div>\s*</section>', 
                  f'<section class="content-section content-section--gray">{gray_replacement}</section>', html)


    # 7. FAQ (Section 5)
    sec5 = data['sections'][5]
    faq_items = sec5['items']
    
    faq_html = ""
    for item in faq_items:
        faq_html += f"""
                <div class="faq-item">
                    <h3>{item["h3"]}</h3>
                    <p>{item["content"]}</p>
                </div>"""
                
    html = re.sub(r'<section id="faq"(?: class=".*?")?>[\s\S]*?<h2 class="titles">.*?</h2>([\s\S]*?)</div>\s*</section>',
                  f'<section id="faq" class="content-section content-section--white faq-section">\n            <div class="container">\n                <h2 class="titles">{sec5["h2"]}</h2>{faq_html}\n            </div>\n        </section>', html)

    # 8. Special MP3 var
    if filename_key == 'youtube-to-mp3':
         html = html.replace("var f = 'mp4';", "var f = 'mp3';")

    return html

# Main Execution
if __name__ == "__main__":
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        template = f.read()

    # YouTube to MP3
    try:
        mp3_data = load_json('mp3.json')
        mp3_html = update_html(template, mp3_data, 'youtube-to-mp3')
        with open(os.path.join(BASE_DIR, 'youtube-to-mp3.html'), 'w', encoding='utf-8') as f:
            f.write(mp3_html)
        print("Created youtube-to-mp3.html")
    except Exception as e:
        print(f"Error creating mp3: {e}")

    # YouTube to MP4
    try:
        mp4_data = load_json('mp4.json')
        mp4_html = update_html(template, mp4_data, 'youtube-to-mp4')
        with open(os.path.join(BASE_DIR, 'youtube-to-mp4.html'), 'w', encoding='utf-8') as f:
            f.write(mp4_html)
        print("Created youtube-to-mp4.html")
    except Exception as e:
        print(f"Error creating mp4: {e}")
        
    # Shorts
    try:
        short_data = load_json('short.json')
        short_html = update_html(template, short_data, 'youtube-shorts-downloader')
        with open(os.path.join(BASE_DIR, 'youtube-shorts-downloader.html'), 'w', encoding='utf-8') as f:
            f.write(short_html)
        print("Created youtube-shorts-downloader.html")
    except Exception as e:
        print(f"Error creating shorts: {e}")
