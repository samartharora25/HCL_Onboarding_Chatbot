import os
import json
import shutil
import requests
from langchain_community.vectorstores import Chroma
from langchain_core.embeddings import Embeddings

class HFAPIEmbeddings(Embeddings):
    def __init__(self, model_name="sentence-transformers/all-MiniLM-L6-v2", api_key=None):
        self.model_name = model_name
        self.api_key = api_key or os.getenv("HF_ACCESS_KEY") or os.getenv("HF_TOKEN")
        self.api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model_name}"
        self.headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}

    def embed_documents(self, texts):
        response = requests.post(
            self.api_url,
            headers=self.headers,
            json={"inputs": texts, "options": {"wait_for_model": True}}
        )
        if response.status_code != 200:
            raise Exception(f"HF API Error: {response.status_code} - {response.text}")
        return response.json()

    def embed_query(self, text):
        response = requests.post(
            self.api_url,
            headers=self.headers,
            json={"inputs": text, "options": {"wait_for_model": True}}
        )
        if response.status_code != 200:
            raise Exception(f"HF API Error: {response.status_code} - {response.text}")
        return response.json()

def get_embeddings_model():
    """
    Initializes embeddings model.
    In Render (production), we use Hugging Face API to avoid loading PyTorch locally (saves memory, fits in 512MB RAM).
    Locally, we use Hugging Face local embeddings to avoid proxy/network issues.
    """
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Check if we are running on Render
    if os.getenv("RENDER") == "true":
        print(f"Loading Hugging Face API embeddings for {model_name} (production mode)...")
        return HFAPIEmbeddings(model_name=model_name)

    # Local development fallback (loads local PyTorch)
    print(f"Loading local HuggingFace embeddings: {model_name}...")
    from langchain_community.embeddings import HuggingFaceEmbeddings
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cache_folder = os.path.join(base_dir, ".model_cache")
    encode_kwargs = {'normalize_embeddings': True}
    
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cpu'},
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
