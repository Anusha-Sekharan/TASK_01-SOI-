import requests
import sys

def check_ollama():
    try:
        print("Checking Ollama version...")
        resp = requests.get("http://localhost:11434/api/version", timeout=5)
        print(f"Version: {resp.text}")
        
        print("\nChecking available models...")
        resp = requests.get("http://localhost:11434/api/tags", timeout=5)
        models = resp.json().get('models', [])
        print(f"Found {len(models)} models:")
        for m in models:
            print(f"- {m['name']}")
            
        target_model = "llama3.2:3b"
        if any(m['name'].startswith(target_model) for m in models):
            print(f"\nTarget model '{target_model}' found.")
        else:
            print(f"\nWARNING: Target model '{target_model}' NOT found.")
            
    except Exception as e:
        print(f"Error connecting to Ollama: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_ollama()
