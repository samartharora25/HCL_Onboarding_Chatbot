import os
import json
import re
from bs4 import BeautifulSoup

def clean_text(text):
    # Remove excessive spaces and newlines
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_html_guide(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source file not found at: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    chunks = []

    # 1. Portal section
    portal_sec = soup.find('section', id='portal')
    if portal_sec:
        h2 = portal_sec.find('h2')
        title = clean_text(h2.text) if h2 else "Portal to raise tickets"
        links = [a['href'] for a in portal_sec.find_all('a', href=True)]
        content = clean_text(portal_sec.text)
        chunks.append({
            "id": "portal",
            "title": title,
            "category": "portal",
            "content": content,
            "urls": links
        })

    # 2. Tool cards (t1 to t7)
    # Note: t1 to t6 are inside #tools section, t7 is outside but in main layout
    for i in range(1, 8):
        tool_id = f"t{i}"
        card = soup.find(id=tool_id)
        if card:
            # Extract heading
            h3 = card.find('h3')
            title = clean_text(h3.text) if h3 else f"Tool {i}"
            
            # Remove the step number chip or links from header text for clean title
            step_chip = card.find(class_='step')
            clean_title = title
            if step_chip and title.startswith(step_chip.text):
                clean_title = title[len(step_chip.text):].strip()
            
            # Extract links
            links = [a['href'] for a in card.find_all('a', href=True)]
            
            # Text content
            content = clean_text(card.text)
            
            chunks.append({
                "id": tool_id,
                "title": f"Tool: {clean_title}",
                "category": "tool",
                "content": content,
                "urls": links
            })

    # 3. Common issues (i1 to i4)
    for i in range(1, 5):
        issue_id = f"i{i}"
        card = soup.find(id=issue_id)
        if card:
            h3 = card.find('h3')
            title = clean_text(h3.text) if h3 else f"Issue {i}"
            links = [a['href'] for a in card.find_all('a', href=True)]
            content = clean_text(card.text)
            
            chunks.append({
                "id": issue_id,
                "title": f"Issue: {title}",
                "category": "issue",
                "content": content,
                "urls": links
            })

    # 4. Notes section
    notes_sec = soup.find('section', id='notes')
    if notes_sec:
        h2 = notes_sec.find('h2')
        title = clean_text(h2.text) if h2 else "Notes & Guidelines"
        links = [a['href'] for a in notes_sec.find_all('a', href=True)]
        
        # Split notes by paragraphs to make them fine-grained, or keep as single chunk
        # Keeping as single chunk is good, but let's also support granular search
        paragraphs = notes_sec.find_all('p')
        content_parts = []
        for idx, p in enumerate(paragraphs):
            text = clean_text(p.text)
            if text:
                content_parts.append(text)
        
        chunks.append({
            "id": "notes",
            "title": "Onboarding Notes & Access Guidelines",
            "category": "notes",
            "content": f"{title}\n" + "\n".join(content_parts),
            "urls": links
        })

    return chunks

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "New_joiner_requests_guide_1_1 1.html")
    output_path = os.path.join(base_dir, "chunks.json")
    
    print(f"Reading onboarding HTML guide from: {file_path}")
    chunks = parse_html_guide(file_path)
    
    print(f"Extracted {len(chunks)} chunks.")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)
    print(f"Saved chunks to: {output_path}")

if __name__ == '__main__':
    main()
