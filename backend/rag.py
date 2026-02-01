import os
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
import shutil
import uuid

# Global embedding model (lazy loaded)
_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        print("Loading embedding model (all-MiniLM-L6-v2)...")
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings

def analyze_with_rag(content: str, url: str) -> dict:
    """
    Performs RAG-based analysis to find weak points in the website content.
    Returns the context strings for different categories.
    """
    print(f"Starting RAG processing for {len(content)} chars...")
    
    # 1. Split Content
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
    )
    texts = text_splitter.split_text(content)
    
    # Create documents
    docs = [Document(page_content=t, metadata={"source": url}) for t in texts]
    
    if not docs:
        return {"error": "No content to analyze"}

    # 2. Initialize Vector Store (Ephemeral)
    # We use a unique collection name to avoid conflicts and verify it's fresh
    collection_name = f"analysis_{uuid.uuid4().hex}"
    
    try:
        embeddings = get_embeddings()
        print("Creating vector store...")
        
        # Create ephemeral ChromaDB
        db = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            collection_name=collection_name
        )
        
        # 3. Targeted Retrieval for "Weak Points"
        queries = {
            "usability_weaknesses": "hard to navigate, confusing layout, mobile issues, broken links, slow, user friction, bad ux",
            "trust_weaknesses": "scam, no contact info, missing address, fake reviews, privacy concerns, insecure, sketchy",
            "conversion_weaknesses": "no call to action, confusing pricing, hidden costs, hard to buy, unsure what to do next, vague value proposition"
        }
        
        results = {}
        for key, query in queries.items():
            print(f"Retrieving for: {key}...")
            # Fetch top 5 relevant chunks
            retrieved_docs = db.similarity_search(query, k=5)
            # Combine content
            context = "\n---\n".join([d.page_content for d in retrieved_docs])
            results[key] = context
            
        return results

    except Exception as e:
        print(f"RAG Error: {e}")
        return {}
    finally:
        # Cleanup if needed (Chroma in-memory doesn't strictly need explicit close, but good practice if persisted)
        pass
