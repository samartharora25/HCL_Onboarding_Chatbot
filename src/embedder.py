import os
import json
import shutil
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

def get_embeddings_model():
    """
    Initializes a local HuggingFace embeddings model.
    By default, BAAI/bge-large-en-v1.5 is used, falling back to a lighter model if necessary.
    """
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    encode_kwargs = {'normalize_embeddings': True}
    print(f"Loading local HuggingFace embeddings: {model_name} (CPU/GPU auto-detect)...")
    
    # We set cache folder in local directory to avoid global directory permission issues
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cache_folder = os.path.join(base_dir, ".model_cache")
    
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cpu'}, # Use GPU if PyTorch CUDA is set up, CPU is safe and fast for small documents
            encode_kwargs=encode_kwargs,
            cache_folder=cache_folder
        )
        return embeddings
    except Exception as e:
        print(f"Failed to load {model_name}: {e}")
        raise e

def build_vector_store():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chunks_path = os.path.join(base_dir, "chunks.json")
    db_path = os.path.join(base_dir, "hcl_chroma_db")

    if not os.path.exists(chunks_path):
        raise FileNotFoundError(f"Chunks file not found at: {chunks_path}. Please run chunker.py first.")

    with open(chunks_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    # Recreate db directory to clear any stale records
    if os.path.exists(db_path):
        print(f"Cleaning existing vector store at {db_path}...")
        try:
            shutil.rmtree(db_path)
        except Exception as e:
            print(f"Warning: Could not clean folder {db_path}: {e}")

    embeddings = get_embeddings_model()

    texts = []
    metadatas = []
    
    for chunk in chunks:
        # Build text string that represents the content, prepending the title for context
        texts.append(f"Title: {chunk['title']}\nContent: {chunk['content']}")
        metadatas.append({
            "id": chunk["id"],
            "title": chunk["title"],
            "category": chunk["category"],
            "urls": ",".join(chunk["urls"])
        })

    print(f"Indexing {len(texts)} chunks in ChromaDB at {db_path}...")
    vector_store = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
        persist_directory=db_path
    )
    print("Vector database built and saved successfully.")
    return vector_store

if __name__ == '__main__':
    build_vector_store()
