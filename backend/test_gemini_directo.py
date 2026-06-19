from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents="Responde solo con la palabra: funciona"
)

print(response.text)