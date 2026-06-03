import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Import our RAG system
try:
    from src.langchain_rag import OnboardingRAG
except ImportError as e:
    print(f"Warning: RAG module import error: {e}. Make sure requirements are installed.")
    OnboardingRAG = None

load_dotenv()

app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
# Enable CORS for all routes (allows Vite frontend at port 5173 to access the API)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global RAG Instance
rag_instance = None

def get_rag():
    global rag_instance
    if rag_instance is None and OnboardingRAG is not None:
        try:
            print("Initializing RAG Instance on Flask startup...")
            rag_instance = OnboardingRAG()
        except Exception as e:
            print(f"Error initializing RAG system: {e}")
    return rag_instance

@app.route('/api/status', methods=['GET'])
def status():
    """
    Returns the system status, including vector DB availability and API key check.
    """
    rag = get_rag()
    db_initialized = False
    groq_active = False
    model_name = "BAAI/bge-large-en-v1.5"

    if rag:
        db_initialized = rag.vector_store is not None
        groq_active = rag.groq_client is not None

    return jsonify({
        "status": "online" if db_initialized else "initializing",
        "database_loaded": db_initialized,
        "groq_api_active": groq_active,
        "embedding_model": model_name,
        "supabase_configured": bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY"))
    })

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """
    Returns the processed onboarding guide summary.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    summary_path = os.path.join(base_dir, "summaries.json")
    
    if os.path.exists(summary_path):
        with open(summary_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    else:
        # Mini fallback in case summarizer wasn't run
        return jsonify({
            "portal": {"url": "https://oneconnect.hcltech.com/"},
            "workflow": {
                "standard_software": ["Search for 'Software request'", "Search for 'Software install request'"],
                "ticket_prefixes": {"RITM": "Requests", "INC": "Incidents"}
            },
            "contacts": {"aws_github_access": "Project Reporting Manager / Ganesh"}
        })

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Handles user chat query. Returns assistant's response, references, and citations.
    """
    rag = get_rag()
    if not rag:
        return jsonify({
            "answer": "⚠️ RAG system backend error. Check server console logs.",
            "citations": [],
            "is_error": True
        }), 500

    data = request.get_json() or {}
    query = data.get("query", "").strip()
    history = data.get("history", [])

    if not query:
        return jsonify({"answer": "Query cannot be empty."}), 400

    try:
        response = rag.generate_answer(query, chat_history=history)
        return jsonify(response)
    except Exception as e:
        print(f"Error during generate_answer: {e}")
        return jsonify({
            "answer": f"⚠️ An error occurred during response generation: {str(e)}",
            "citations": [],
            "is_error": True
        }), 500

@app.route('/api/test', methods=['GET'])
def test_retrieval():
    """
    Diagnostic endpoint to verify document search works.
    """
    rag = get_rag()
    if not rag or not rag.vector_store:
        return jsonify({"error": "Vector database not initialized."}), 500

    test_query = "install Python"
    results = rag.retrieve_context(test_query, k=1)
    
    return jsonify({
        "test_query": test_query,
        "results_found": len(results),
        "top_match": results[0] if results else None
    })

@app.route('/')
def serve_index():
    """
    Serves the React frontend index page.
    """
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    """
    Redirects non-API routes to index.html for SPA router support,
    and returns a standard JSON error for API routes.
    """
    if request.path.startswith('/api/'):
        return jsonify({"error": "Not Found"}), 404
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.getenv("FLASK_PORT", 5000))
    debug_mode = os.getenv("FLASK_ENV", "development") == "development"
    print(f"Starting Flask backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
