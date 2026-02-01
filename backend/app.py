from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from .stt import transcribe_audio
import shutil
import os
import asyncio
from playwright.sync_api import sync_playwright

app = FastAPI()

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "message": "Conversion Protocol Backend Active"}

from pydantic import BaseModel

class ConversionRequest(BaseModel):
    url: str

import requests
from bs4 import BeautifulSoup
import json

# ... (keep existing imports)

def _scrape_sync(url: str) -> tuple[str, str]:
    print(f"Scraping {url} with Playwright (Sync)...")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            )
            page = context.new_page()
            try:
                page.goto(url, timeout=60000, wait_until="domcontentloaded")
                page.wait_for_timeout(2000) 
            except Exception as nav_err:
                 print(f"Navigation warning: {nav_err}")
            
            page.evaluate("""() => {
                const elements = document.querySelectorAll('script, style, noscript, svg, img, video, iframe');
                elements.forEach(el => el.remove());
            }""")
            
            content = page.locator("body").inner_text()
            browser.close()
            return content[:15000], ""
    except Exception as e:
        print(f"Playwright scraping error: {e}")
        return "", str(e)

async def scrape_website(url: str) -> tuple[str, str]:
    return await asyncio.to_thread(_scrape_sync, url)

from .rag import analyze_with_rag

def analyze_with_ollama(url: str, content: str) -> dict:
    if not content:
        return None
    
    # Perform RAG Analysis
    print("Performing RAG analysis...")
    rag_contexts = analyze_with_rag(content, url)
    
    # Construct a RAG-enriched prompt
    prompt = f"""
    You are a Conversion Rate Optimization (CRO) Expert. analyze the website "{url}" based on the provided EVIDENCE.
    
    Context from Website Analysis:
    
    === USABILITY EVIDENCE ===
    {rag_contexts.get('usability_weaknesses', 'No specific evidence found.')}
    
    === TRUST & CREDIBILITY EVIDENCE ===
    {rag_contexts.get('trust_weaknesses', 'No specific evidence found.')}
    
    === CONVERSION EVIDENCE ===
    {rag_contexts.get('conversion_weaknesses', 'No specific evidence found.')}
    
    Based ONLY on the evidence above and the general context, identify specific WEAK POINTS.
    
    Provide a JSON response with the following structure (raw JSON only):
    {{
        "status": "success",
        "message": "RAG-Enhanced Analysis Complete",
        "url": "{url}",
        "score": <overall_score_0_100>,
        "metrics": {{
            "usability": <score_0_100>,
            "trust_score": <score_0_100>,
            "clarity": <score_0_100>,
            "conversion_potential": <score_0_100>
        }},
        "issues": [
            {{"severity": "high"|"medium"|"low", "title": "<short_issue_title>", "description": "<detailed_explanation_citing_evidence>"}},
            ... (provide 3-5 critical weak points)
        ]
    }}
    """
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2:3b",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=180 
        )
        
        if response.status_code == 200:
            return response.json().get('response')
        else:
            print(f"Ollama error: {response.text}")
            return None
    except Exception as e:
        print(f"Ollama connection error: {e}")
        return None

@app.post("/convert")
async def convert_action(req: ConversionRequest):
    print(f"Analyzing URL: {req.url}")
    
    # 1. Scrape URL with Playwright
    content, error = await scrape_website(req.url)
    
    if not content:
        return {
            "status": "error", 
            "message": f"Failed to scrape content. Error: {error}",
            "url": req.url
        }
    
    # 2. Analyze with Ollama
    print(f"Content scraped ({len(content)} chars), sending to Ollama...")
    llm_response_str = analyze_with_ollama(req.url, content)
    
    if llm_response_str:
        try:
            # Parse JSON from LLM string
            data = json.loads(llm_response_str)
            return data
        except json.JSONDecodeError:
            print("Failed to parse LLM JSON")
            return {
                "status": "error",
                "message": "Model returned invalid JSON.",
                "raw": llm_response_str
            }
    
    return {
        "status": "error", 
        "message": "Analysis failed.",
        "url": req.url
    }

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_file = f"temp_{file.filename}"
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process STT
        text = transcribe_audio(temp_file)
        
        # Cleanup
        os.remove(temp_file)
        
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
