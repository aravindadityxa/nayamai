import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

print("=== GEMINI API DEBUG ===")

# Check if API key is loaded
api_key = os.getenv("GEMINI_API_KEY")
print(f"1. API Key loaded: {'Yes' if api_key else 'No'}")
if api_key:
    print(f"   Key starts with: {api_key[:10]}...")
    print(f"   Key length: {len(api_key)}")

# Test Gemini configuration
try:
    genai.configure(api_key=api_key)
    print("2. Gemini configured: ✅ Success")
    
    # List available models first
    print("3. Checking available models...")
    models = genai.list_models()
    available_models = []
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            available_models.append(model.name)
            print(f"   - {model.name}")
    
    # Try different model names
    model_names_to_try = [
        'models/gemini-1.5-pro',
        'models/gemini-1.0-pro',
        'models/gemini-pro',
        'models/gemini-1.5-flash'
    ]
    
    successful_model = None
    for model_name in model_names_to_try:
        try:
            print(f"4. Trying model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'Hello' in one word.")
            print(f"5. ✅ Success with model: {model_name}")
            print(f"6. Response: {response.text}")
            successful_model = model_name
            break
        except Exception as e:
            print(f"   ❌ Failed with {model_name}: {e}")
            continue
    
    if successful_model:
        print(f"\n🎉 Use this model in your code: {successful_model}")
    else:
        print("\n❌ No working models found")
    
except Exception as e:
    print(f"❌ ERROR: {e}")