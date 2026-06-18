import os
import json
from dotenv import load_dotenv
from groq import Groq
from langchain_community.vectorstores import Chroma
from src.embedder import get_embeddings_model

# Load environment variables
load_dotenv()

class OnboardingRAG:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.db_path = os.path.join(self.base_dir, "hcl_chroma_db")
        self.vector_store = None
        self.embeddings = None
        self.groq_client = None
        self.groq_api_key = os.getenv("GROQ_API_KEY")

        # Initialize embeddings & DB connection if it exists
        self.init_db()
        self.init_llm()

    def init_db(self):
        if os.path.exists(self.db_path):
            try:
                self.embeddings = get_embeddings_model()
                self.vector_store = Chroma(
                    persist_directory=self.db_path,
                    embedding_function=self.embeddings
                )
                print("Connected to existing ChromaDB vector store.")
            except Exception as e:
                print(f"Error connecting to ChromaDB: {e}")
        else:
            print(f"ChromaDB not found at {self.db_path}. Need to build it first.")

    def init_llm(self):
        if self.groq_api_key:
            try:
                self.groq_client = Groq(api_key=self.groq_api_key)
                print("Groq client initialized successfully.")
            except Exception as e:
                print(f"Failed to initialize Groq client: {e}")
                self.groq_client = None
        else:
            print("Groq API key not set. RAG will run in local fallback mode.")

    def retrieve_context(self, query, k=3):
        if not self.vector_store:
            return []
        
        # Perform similarity search with scores
        try:
            docs_with_scores = self.vector_store.similarity_search_with_relevance_scores(query, k=k)
            # Reformat to list of dicts for ease of use
            results = []
            for doc, score in docs_with_scores:
                metadata = doc.metadata
                results.append({
                    "id": metadata.get("id", ""),
                    "content": doc.page_content,
                    "title": metadata.get("title", "Untitled"),
                    "category": metadata.get("category", "General"),
                    "urls": metadata.get("urls", "").split(",") if metadata.get("urls") else [],
                    "score": float(score)
                })
            return results
        except Exception as e:
            print(f"Error during context retrieval: {e}")
            # Simple metadata lookup in case Chroma fails
            return []

    def get_local_fallback_response(self, query, context, api_error=None):
        """
        Generates a structured local response using directly retrieved documents
        when the Groq API key is not configured or queries fail.
        """
        if api_error:
            fallback_reason = f"**Local Fallback Mode** (Groq API error: {api_error})"
            instruction = f"*An error occurred while calling the Groq API ({api_error}). Running in fallback mode.*"
        else:
            fallback_reason = "**Local Fallback Mode** (no Groq API Key found)"
            instruction = "*To enable natural-sounding AI responses, please provide a valid `GROQ_API_KEY` in the backend `.env` file.*"

        if not context:
            return {
                "answer": f"Hello! I am currently running in {fallback_reason}.\n\n"
                          "I couldn't find any specific information related to your query in the Onboarding Guide. "
                          "Please try raising an IT support ticket on the OneConnect portal: https://oneconnect.hcltech.com/\n\n"
                          f"{instruction}",
                "citations": [],
                "is_fallback": True
            }

        response_text = (
            f"Hello! I am currently running in {fallback_reason}. "
            "However, I retrieved the following exact match(es) from the HCL Onboarding Guide to help you:\n\n"
        )

        citations = []
        for idx, chunk in enumerate(context):
            citation_num = idx + 1
            response_text += f"### {citation_num}. {chunk['title']}\n"
            # Format content nicely
            content = chunk['content']
            # If it looks like a tool card, format numbered lists
            content_formatted = content.replace("1.", "\n1. ").replace("2.", "\n2. ").replace("3.", "\n3. ")
            response_text += f"{content_formatted}\n\n"
            
            citations.append({
                "source": chunk["title"],
                "category": chunk["category"],
                "urls": chunk["urls"]
            })

        response_text += f"---\n{instruction}"

        return {
            "answer": response_text,
            "citations": citations,
            "is_fallback": True
        }

    def generate_answer(self, query, chat_history=None):
        """
        Runs RAG retrieval and queries Groq if available. Fallbacks to direct citation list if offline.
        """
        # 1. Retrieve relevant chunks
        context = self.retrieve_context(query)
        
        # 2. If no LLM, return local fallback
        if not self.groq_client:
            return self.get_local_fallback_response(query, context)

        # 3. Assemble prompt context
        context_str = ""
        citations = []
        for idx, chunk in enumerate(context):
            context_str += f"--- Document Section: {chunk['title']} ---\n{chunk['content']}\n\n"
            citations.append({
                "source": chunk["title"],
                "category": chunk["category"],
                "urls": chunk["urls"]
            })

        # Assemble chat history string if provided
        history_str = ""
        if chat_history:
            # chat_history format: list of {"role": "user"/"assistant", "content": "..."}
            for msg in chat_history[-5:]: # Keep last 5 exchanges
                role = "User" if msg["role"] == "user" else "Assistant"
                history_str += f"{role}: {msg['content']}\n"

        system_prompt = (
            "You are the HCL Tech Onboarding Assistant. Your goal is to help new employees set up their work environments comfortably.\n"
            "Use the provided context from the 'Pulse New Joiner - Requests & Setup Guide' to answer the user's questions. \n"
            "Be precise, professional, and helpful. Format your response clearly in markdown. Use bullet points or numbered lists where appropriate.\n\n"
            "Guidelines:\n"
            "- Always base your answers on the provided context. If a detail is missing, state that it isn't in the guide and advise the user to raise a ticket on OneConnect or consult their reporting manager.\n"
            "- If the user asks about standard tools (Python, Node.js, VS Code, Podman, WSL), emphasize the double-ticket procedure: 1. Software Request -> 2. Software Install Request (referencing the first ticket).\n"
            "- If they ask about Outlook, VPN, or external accounts that aren't in the guide, guide them to raise an IT support ticket on OneConnect.\n"
            "- Mention ticket prefixes: RITM for request/install, INC for incidents/issues (e.g. VS Code extension issues).\n\n"
            f"Here is the context:\n{context_str}\n"
        )

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        if chat_history:
            # Append relevant context history
            for msg in chat_history[-5:]:
                # Normalize role just in case
                role = "assistant" if msg["role"] == "assistant" else "user"
                messages.append({"role": role, "content": msg["content"]})

        # ALWAYS append the user's current query to the prompt
        messages.append({"role": "user", "content": query})

        try:
            print("Sending RAG prompt to Groq API...")
            completion = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0.2,
                max_tokens=1024
            )
            answer = completion.choices[0].message.content
            return {
                "answer": answer,
                "citations": citations,
                "is_fallback": False
            }
        except Exception as e:
            print(f"Error querying Groq API: {e}. Falling back to local response.")
            return self.get_local_fallback_response(query, context, api_error=str(e))

if __name__ == '__main__':
    # Dry run test
    rag = OnboardingRAG()
    res = rag.generate_answer("How do I install Python?")
    print("\n--- Dry Run Result ---")
    print(res["answer"])
