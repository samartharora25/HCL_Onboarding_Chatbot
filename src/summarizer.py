import os
import json

def generate_summary():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chunks_path = os.path.join(base_dir, "chunks.json")
    summary_path = os.path.join(base_dir, "summaries.json")

    if not os.path.exists(chunks_path):
        print("Chunks not found. Run chunker.py first to create chunks.json.")
        return

    with open(chunks_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    summary = {
        "portal": {
            "name": "OneConnect Portal",
            "url": "https://oneconnect.hcltech.com/",
            "purpose": "Raising IT requests, software installs, reporting access issues, and incident tickets."
        },
        "workflow": {
            "standard_software": [
                "1. Search for 'Software request' on OneConnect.",
                "2. Raise a request for the desired software and note the RITM ticket number.",
                "3. Search for 'Software install request' on OneConnect.",
                "4. Raise the install request referencing the previous ticket number.",
                "5. Justification for all requests: 'Need for project'.",
                "6. IT support team will reach out and install the tool."
            ],
            "ticket_prefixes": {
                "RITM": "Request, Install, and Access tickets (e.g. software setups)",
                "INC": "Incident and issue resolution tickets (e.g. extension fixes)"
            }
        },
        "tools": [],
        "common_issues": [],
        "contacts": {
            "aws_github_access": "Project Reporting Manager / Ganesh",
            "github_offering": {
                "product_name": "Microsoft GitHub Copilot Pay Per User Without GitHub Enterprise or MSDN Enterprise",
                "org_name": "E250086-ProjectPulse-1008912AB0"
            }
        }
    }

    for chunk in chunks:
        cat = chunk["category"]
        if cat == "tool":
            summary["tools"].append({
                "id": chunk["id"],
                "title": chunk["title"].replace("Tool: ", ""),
                "brief": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"]
            })
        elif cat == "issue":
            summary["common_issues"].append({
                "id": chunk["id"],
                "title": chunk["title"].replace("Issue: ", ""),
                "solution_summary": "Check chatbot for full commands or proxy configs."
            })

    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"Saved onboarding guide summary to {summary_path}")

if __name__ == '__main__':
    generate_summary()
