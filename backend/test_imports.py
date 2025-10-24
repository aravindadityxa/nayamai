try:
    import google.generativeai
    print("✅ google.generativeai - OK")
except ImportError as e:
    print(f"❌ google.generativeai - FAILED: {e}")

try:
    import fastapi
    print("✅ fastapi - OK")
except ImportError as e:
    print(f"❌ fastapi - FAILED: {e}")

try:
    import langdetect
    print("✅ langdetect - OK")
except ImportError as e:
    print(f"❌ langdetect - FAILED: {e}")

try:
    import sqlalchemy
    print("✅ sqlalchemy - OK")
except ImportError as e:
    print(f"❌ sqlalchemy - FAILED: {e}")