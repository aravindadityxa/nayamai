import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

print("=== TESTING GEMINI 2.0 MODELS ===")

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Test the models that appeared in your available list
models_to_test = [
    'models/gemini-2.0-flash',
    'models/gemini-flash-latest', 
    'models/gemini-pro-latest',
    'models/gemini-2.0-flash-001'
]

for model_name in models_to_test:
    try:
        print(f"\n🔹 Testing: {model_name}")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say 'Hello NAYAM AI' in one sentence.")
        print(f"✅ SUCCESS: {response.text}")
        print(f"🎯 Use this model: {model_name}")
        break
    except Exception as e:
        print(f"❌ Failed: {e}")