# HCL Tech Onboarding Chatbot - Project Workflow (Eraser.io)

This document contains the project workflow architecture designed for Eraser.io. You can paste the **Diagram-as-Code** section below directly into Eraser to render the visual workflow block.

---

## Eraser Diagram-as-Code (Copy-Paste to Eraser)

```json
// Define Nodes
IT_Guide [label: "IT Onboarding Guide (.html)", icon: "file-code", color: "orange"]
Chunker [label: "src/chunker.py (BeautifulSoup Parser)", icon: "cpu", color: "yellow"]
Chunks_JSON [label: "chunks.json (Structured Blocks)", icon: "database", color: "yellow"]
Embedder [label: "src/embedder.py (BGE-large-en-v1.5)", icon: "settings", color: "blue"]
Vector_DB [label: "ChromaDB Persistent Store", icon: "database", color: "purple"]
RAG_Engine [label: "src/langchain_rag.py (LangChain)", icon: "cpu", color: "green"]
Groq_API [label: "Groq LLM Inference (Llama 3)", icon: "cloud", color: "red"]
Local_Fallback [label: "Direct Passage citations", icon: "info", color: "gray"]
Flask_Server [label: "app.py (Flask API Server)", icon: "server", color: "green"]
React_UI [label: "React Chat Interface", icon: "layout", color: "blue"]
Supabase_Auth [label: "Supabase Authentication (Mock Fallback)", icon: "lock", color: "purple"]

// Connections & Flow
IT_Guide > Chunker: "Source HTML"
Chunker > Chunks_JSON: "Generates chunks"
Chunks_JSON > Embedder: "Loads text segments"
Embedder > Vector_DB: "Stores embeddings"
React_UI > Supabase_Auth: "User Login & Captcha Verification"
React_UI > Flask_Server: "Sends user query & history"
Flask_Server > RAG_Engine: "Calls generation"
Vector_DB > RAG_Engine: "Performs similarity search (Top-K)"
RAG_Engine > Groq_API: "Augmented prompt (with API Key)"
RAG_Engine > Local_Fallback: "Direct citations (without API Key)"
Groq_API > Flask_Server: "Synthesized answers"
Local_Fallback > Flask_Server: "Raw chunks + warning"
Flask_Server > React_UI: "Returns message & references"
```

---

## Detailed Architectural Workflow

1. **Ingestion & Processing Layer (`src/chunker.py`)**:
   - The onboarding HTML guide (`New_joiner_requests_guide_1_1 1.html`) is parsed using BeautifulSoup.
   - Text elements are grouped into distinct semantic blocks based on their HTML IDs (e.g. Python installation `t1`, WSL installation `i4`, Notes section `notes`).
   - Output: `chunks.json` file.

2. **Vector Indexing (`src/embedder.py`)**:
   - Chunks are read and embedded using a local HuggingFace embedding model (`BAAI/bge-large-en-v1.5`).
   - The vectors, along with document text and metadata (URLs, titles, categories), are stored in the local persistent vector database (`hcl_chroma_db`).

3. **Backend API layer (`app.py`)**:
   - A Flask app exposing API endpoints is launched on port 5000.
   - Supports CORS requests from the Vite React frontend.
   - Serves the compiled React build (or dynamically communicates with it during development).

4. **Security & Authentication (Supabase + Captcha)**:
   - On load, the frontend validates user credentials.
   - Users are required to solve a Canvas-generated alphanumeric CAPTCHA containing noise elements and text rotations before signing up or logging in.
   - If Supabase environment variables are missing, the client automatically switches to **Simulated Mode** using LocalStorage, ensuring the app works immediately.

5. **Retrieval-Augmented Generation (RAG)**:
   - The user inputs a query (e.g. *"How do I request admin access?"*).
   - The backend runs a similarity search against ChromaDB to find the top 3 most relevant segments.
   - If a `GROQ_API_KEY` is present, it formats a prompt with system guidelines, history, and retrieved text, sending it to Groq's Llama 3 LLM.
   - If the key is missing, the backend formats the matching passages directly with citation metrics, providing a robust offline user experience.
