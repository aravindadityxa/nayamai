from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
from typing import Optional, List
import json
import os
from dotenv import load_dotenv
import hashlib
import secrets

from db import get_db, init_db
from models import User, ChatHistory
from gemini_client import GeminiClient

# Load environment variables
load_dotenv()

# Security
security = HTTPBearer()
app = FastAPI(title="NAYAM AI", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and Gemini client
init_db()
gemini_client = GeminiClient()

# Pydantic models
class UserRegister(BaseModel):
    email: str
    password: str
    preferred_language: str = "en"

class UserLogin(BaseModel):
    email: str
    password: str

class ChatMessage(BaseModel):
    message: str
    language: Optional[str] = None

class Location(BaseModel):
    latitude: float
    longitude: float

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    security_answers: dict
    new_password: str

class SecurityQuestions(BaseModel):
    pet_name: str
    birth_city: str

# In-memory storage for security questions (in production, store in database)
user_security_data = {}

# Password hashing
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Authentication
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.credentials).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@app.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        preferred_language=user_data.preferred_language
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate security questions for the user
    user_security_data[user_data.email] = {
        "pet_name": "default_pet",  # In production, ask user during registration
        "birth_city": "default_city"  # In production, ask user during registration
    }
    
    return {"message": "User registered successfully", "user_id": user.id}

@app.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or user.hashed_password != hash_password(login_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "token": user.email}

@app.post("/chat")
def chat(chat_data: ChatMessage, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        response = gemini_client.generate_response(chat_data.message, chat_data.language or user.preferred_language)
        
        # Save to chat history
        chat_history = ChatHistory(
            user_id=user.id,
            message=chat_data.message,
            response=response,
            language=chat_data.language or user.preferred_language
        )
        db.add(chat_history)
        db.commit()
        
        return {"response": response, "language": chat_data.language or user.preferred_language}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Public chat endpoint for non-registered users
@app.post("/chat/public")
def chat_public(chat_data: ChatMessage):
    try:
        response = gemini_client.generate_response(chat_data.message, chat_data.language or "en")
        return {"response": response, "language": chat_data.language or "en"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history")
def get_chat_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Get last 50 chat messages for the user
        chat_history = db.query(ChatHistory).filter(
            ChatHistory.user_id == user.id
        ).order_by(ChatHistory.created_at.desc()).limit(50).all()
        
        history_data = []
        for chat in chat_history:
            history_data.append({
                "id": chat.id,
                "message": chat.message,
                "response": chat.response,
                "language": chat.language,
                "timestamp": chat.created_at.isoformat()
            })
        
        return {"chat_history": history_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chat/history")
def clear_chat_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Delete all chat history for the user
        db.query(ChatHistory).filter(ChatHistory.user_id == user.id).delete()
        db.commit()
        
        return {"message": "Chat history cleared successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    # Check if user exists and return security questions
    if request.email not in user_security_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # In production, you would send an email with a reset link
    # For demo, we'll return the security questions directly
    return {
        "message": "Please answer your security questions",
        "security_questions": [
            "What was your first pet's name?",
            "What city were you born in?"
        ]
    }

@app.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify security answers (in production, use proper verification)
        if request.email not in user_security_data:
            raise HTTPException(status_code=400, detail="Security questions not set")
        
        security_data = user_security_data[request.email]
        if (request.security_answers.get("pet_name") != security_data["pet_name"] or
            request.security_answers.get("birth_city") != security_data["birth_city"]):
            raise HTTPException(status_code=401, detail="Incorrect security answers")
        
        # Update password
        user.hashed_password = hash_password(request.new_password)
        db.commit()
        
        return {"message": "Password reset successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/nearby")
async def get_nearby_hospitals(location: Location):
    try:
        # Overpass API query for hospitals
        overpass_url = "http://overpass-api.de/api/interpreter"
        query = f"""
        [out:json];
        (
          node["amenity"="hospital"](around:5000,{location.latitude},{location.longitude});
          node["amenity"="clinic"](around:5000,{location.latitude},{location.longitude});
          node["healthcare"="hospital"](around:5000,{location.latitude},{location.longitude});
        );
        out body;
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(overpass_url, data=query)
            data = response.json()
            
        hospitals = []
        for element in data.get('elements', []):
            hospitals.append({
                'name': element.get('tags', {}).get('name', 'Unknown Hospital'),
                'lat': element.get('lat'),
                'lon': element.get('lon'),
                'address': element.get('tags', {}).get('addr:full', ''),
                'phone': element.get('tags', {}).get('phone', '')
            })
        
        return {"hospitals": hospitals[:10]}  # Limit to 10 results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "NAYAM AI Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "NAYAM AI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)