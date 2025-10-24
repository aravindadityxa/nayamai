import os
import google.generativeai as genai
from langdetect import detect, LangDetectException
from dotenv import load_dotenv
import time

load_dotenv()

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        print(f"DEBUG: API Key loaded - {'Yes' if self.api_key else 'No'}")
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        try:
            genai.configure(api_key=self.api_key)
            
            # Use Gemini 2.0 Flash (from your available models)
            self.model = genai.GenerativeModel('models/gemini-2.0-flash')
            print("DEBUG: Gemini configured successfully with gemini-2.0-flash")
            
        except Exception as e:
            print(f"DEBUG: Primary model failed, trying fallback...")
            try:
                # Fallback to latest available model
                self.model = genai.GenerativeModel('models/gemini-flash-latest')
                print("DEBUG: Gemini configured successfully with gemini-flash-latest")
            except Exception as e2:
                print(f"DEBUG: All model attempts failed: {e2}")
                raise
    
    def get_language_prompt(self, language_code: str) -> str:
        prompts = {
            'ta': """You are NAYAM AI, a medical assistant for Tamil speakers. 
                    Respond in Tamil with warm, respectful tone. Use native Tamil medical terms.
                    Be polite and caring. Keep responses under 100 words.""",
            
            'en': """You are NAYAM AI, a professional medical assistant.
                    Respond in English with calm, professional tone. 
                    Be clear and concise while maintaining empathy. Keep responses under 100 words.""",
            
            'hi': """You are NAYAM AI, a medical assistant for Hindi speakers.
                    Respond in Hindi with friendly, empathetic tone. Use common Hindi medical terms.
                    Be supportive and understanding. Keep responses under 100 words.""",
            
            'te': """You are NAYAM AI, a medical assistant for Telugu speakers.
                    Respond in Telugu with supportive, simple language. Use natural Telugu expressions.
                    Be caring and clear. Keep responses under 100 words.""",
            
            'ml': """You are NAYAM AI, a medical assistant for Malayalam speakers.
                    Respond in Malayalam with caring tone. Use common Malayalam medical terms.
                    Be warm and professional. Keep responses under 100 words.""",
            
            'kn': """You are NAYAM AI, a medical assistant for Kannada speakers.
                    Respond in Kannada with professional, clear tone. Use standard Kannada medical terms.
                    Be precise and caring. Keep responses under 100 words."""
        }
        return prompts.get(language_code, prompts['en'])
    
    def detect_language(self, text: str) -> str:
        try:
            lang = detect(text)
            supported_langs = ['ta', 'en', 'hi', 'te', 'ml', 'kn']
            return lang if lang in supported_langs else 'en'
        except LangDetectException:
            return 'en'
    
    def generate_response(self, message: str, preferred_lang: str = None) -> str:
        try:
            print(f"DEBUG: Generating response for: '{message}'")
            
            if not preferred_lang or preferred_lang == 'auto':
                preferred_lang = self.detect_language(message)
                print(f"DEBUG: Detected language: {preferred_lang}")
            
            system_prompt = self.get_language_prompt(preferred_lang)
            
            # Simple combined prompt
            full_prompt = f"{system_prompt}\n\nUser question: {message}"
            
            print("DEBUG: Sending to Gemini...")
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=500,
                    temperature=0.7
                )
            )
            
            if response.text:
                print(f"DEBUG: ✅ Response successful: {response.text[:100]}...")
                return response.text
            else:
                raise Exception("Empty response from Gemini")
        
        except Exception as e:
            print(f"DEBUG: ❌ Error: {e}")
            # Fallback responses
            fallback_responses = {
                'ta': 'வணக்கம்! நான் நயம் AI. உங்கள் உடல்நலத்திற்கு எவ்வாறு உதவ முடியும்?',
                'hi': 'नमस्ते! मैं NAYAM AI हूं। मैं आपके स्वास्थ्य के लिए कैसे मदद कर सकता हूं?',
                'te': 'నమస్కారం! నేను నయం AI. మీ ఆరోగ్యం కోసం నేను ఎలా సహాయం చేయగలను?',
                'ml': 'നമസ്കാരം! ഞാൻ നയം AI ആണ്. നിങ്ങളുടെ ആരോഗ്യത്തിനായി എനിക്ക് എങ്ങനെ സഹായിക്കാനാകും?',
                'kn': 'ನಮಸ್ಕಾರ! ನಾನು ನಯಂ AI. ನಿಮ್ಮ ಆರೋಗ್ಯಕ್ಕಾಗಿ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
                'en': 'Hello! I am NAYAM AI. How can I assist you with your health today?'
            }
            return fallback_responses.get(preferred_lang, fallback_responses['en'])