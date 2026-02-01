import sys
import os

# Ensure backend imports work
sys.path.append(os.getcwd())

from backend.rag import analyze_with_rag

def test_rag():
    sample_text = """
    Welcome to BadWebsite.com. We are the best.
    Buy our stuff. It costs money.
    Contact: admin@badwebsite.com (maybe).
    There is no return policy. We don't care about privacy.
    The menu is hidden. You cannot find the login button.
    """
    
    print("Testing RAG with sample text...")
    try:
        results = analyze_with_rag(sample_text, "https://badwebsite.com")
        
        print("\n--- RAG Results ---")
        for key, val in results.items():
            print(f"\n[{key.upper()}]")
            print(val)
            
        if not results:
            print("ERROR: No results returned.")
        else:
            print("\nSUCCESS: RAG pipeline returned contexts.")
            
    except Exception as e:
        print(f"TEST FAILED: {e}")

if __name__ == "__main__":
    test_rag()
