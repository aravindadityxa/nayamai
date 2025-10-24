@echo off
echo Setting up NAYAM AI Backend...

:: Check if virtual environment exists
if not exist "nayam_env" (
    echo Creating virtual environment...
    python -m venv nayam_env
)

echo Activating virtual environment...
call nayam_env\Scripts\activate

echo Installing dependencies...
pip install fastapi uvicorn google-generativeai langdetect python-dotenv sqlalchemy httpx passlib[bcrypt] python-jose[cryptography] aiofiles python-multipart

echo Setup complete!
echo Starting server...
uvicorn main:app --reload --port 8000

pause