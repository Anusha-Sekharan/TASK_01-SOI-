import requests
import sys

def test_endpoint():
    url = "https://example.com"
    endpoint = "http://localhost:8000/convert"
    print(f"Testing backend endpoint {endpoint} for {url}...")
    
    try:
        response = requests.post(endpoint, json={"url": url})
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:")
            print(response.json())
        except:
            print("Response Text:")
            print(response.text)
            
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    test_endpoint()
