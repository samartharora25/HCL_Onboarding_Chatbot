import os
import sys
from dotenv import load_dotenv

# Ensure the root directory is on the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from src.langchain_rag import OnboardingRAG
except ImportError as e:
    print(f"Error: Could not import RAG pipeline. Ensure dependencies are installed. Detail: {e}")
    sys.exit(1)

def main():
    load_dotenv()
    print("="*60)
    print("HCL TECH IT ONBOARDING CHATBOT - INTERACTIVE CLI TESTER")
    print("="*60)
    
    # Initialize RAG
    print("Connecting to ChromaDB and initializing LLM pipeline...")
    try:
        rag = OnboardingRAG()
    except Exception as e:
        print(f"Failed to initialize RAG pipeline: {e}")
        sys.exit(1)
        
    if not rag.vector_store:
        print("Error: ChromaDB vector store not found. Please run 'python src/embedder.py' first.")
        sys.exit(1)

    print("\nSystem ready! Type your questions about HCL IT Onboarding (or type 'exit' to quit).")
    print("-" * 60)

    chat_history = []

    while True:
        try:
            query = input("\nYou: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting CLI session. Goodbye!")
            break

        if not query:
            continue

        if query.lower() in ['exit', 'quit', 'bye']:
            print("Exiting CLI session. Goodbye!")
            break

        print("\nAssistant is searching & thinking...")
        try:
            result = rag.generate_answer(query, chat_history=chat_history)
            
            # Print response
            print("\n" + "="*40 + " ANSWER " + "="*40)
            print(result["answer"])
            print("="*88)
            
            # Print Citations
            if result.get("citations"):
                print("\nCitations:")
                for idx, cite in enumerate(result["citations"]):
                    urls_str = ", ".join(cite["urls"]) if cite["urls"] else "No direct links"
                    print(f"  [{idx+1}] Source Section: {cite['source']} ({cite['category'].capitalize()})")
                    print(f"      Links: {urls_str}")
            else:
                print("\nCitations: None found.")
            print("-" * 88)

            # Update history
            chat_history.append({"role": "user", "content": query})
            chat_history.append({"role": "assistant", "content": result["answer"]})
            
            # Limit history to last 5 exchanges
            if len(chat_history) > 10:
                chat_history = chat_history[-10:]

        except Exception as e:
            print(f"\nAn error occurred while answering query: {e}")

if __name__ == '__main__':
    main()
