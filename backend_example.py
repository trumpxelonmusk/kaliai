from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json
from datetime import datetime

app = FastAPI(title="AI Chatbot Backend", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class FileInfo(BaseModel):
    name: str
    type: str
    size: int

class ChatRequest(BaseModel):
    message: str
    files: Optional[List[FileInfo]] = []

class ChatResponse(BaseModel):
    response: str
    status: str = "success"
    timestamp: Optional[str] = None

# Simple chat history storage (in production, use a database)
chat_history = []

@app.get("/")
async def root():
    """Root endpoint - returns API info"""
    return {
        "message": "AI Chatbot Backend API",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/chat",
            "health": "/health",
            "history": "/history"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint that processes user messages and returns AI responses
    """
    try:
        # Add to chat history
        chat_history.append({
            "message": request.message,
            "files": [file.dict() for file in request.files] if request.files else [],
            "timestamp": datetime.now().isoformat(),
            "type": "user"
        })
        
        # Process the message and files
        user_message = request.message
        files = request.files or []
        
        # Simple AI response logic (replace with your actual AI model)
        response_text = generate_ai_response(user_message, files)
        
        # Add AI response to history
        chat_history.append({
            "message": response_text,
            "timestamp": datetime.now().isoformat(),
            "type": "ai"
        })
        
        return ChatResponse(
            response=response_text,
            status="success",
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_chat_history():
    """Get chat history"""
    return {"history": chat_history}

@app.delete("/history")
async def clear_chat_history():
    """Clear chat history"""
    global chat_history
    chat_history = []
    return {"message": "Chat history cleared"}

def generate_ai_response(user_message: str, files: List[FileInfo]) -> str:
    """
    Generate AI response based on user message and files
    Replace this with your actual AI model integration
    """
    message_lower = user_message.lower()
    
    # Simple response logic (replace with your AI model)
    if "hello" in message_lower or "hi" in message_lower:
        response = "Hello! How can I help you today?"
    elif "how are you" in message_lower:
        response = "I'm doing well, thank you for asking! How can I assist you?"
    elif "help" in message_lower:
        response = "I'm here to help! You can ask me questions, and I can also process files you upload. What would you like to know?"
    elif "file" in message_lower or "upload" in message_lower:
        if files:
            file_names = [f.name for f in files]
            response = f"I see you've uploaded {len(files)} file(s): {', '.join(file_names)}. I can help you analyze these files!"
        else:
            response = "You can upload files using the paperclip icon. I support TXT, PDF, DOC, DOCX, JPG, and PNG files."
    elif "weather" in message_lower:
        response = "I don't have access to real-time weather data, but I can help you with other questions!"
    elif "time" in message_lower:
        current_time = datetime.now().strftime("%H:%M:%S")
        response = f"The current time is {current_time}."
    elif "name" in message_lower:
        response = "I'm an AI assistant created to help you with various tasks and questions."
    elif "bye" in message_lower or "goodbye" in message_lower:
        response = "Goodbye! Feel free to come back if you have more questions."
    else:
        # Default response
        response = f"I received your message: '{user_message}'. This is a simple demo response. In a real implementation, you would integrate with an AI model like GPT, Claude, or your custom model here."
    
    # Add file processing info if files are present
    if files:
        file_info = f"\n\n📁 File Analysis:\n"
        for file in files:
            file_info += f"• {file.name} ({file.type}, {format_file_size(file.size)})\n"
        response += file_info
    
    return response

def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 Bytes"
    
    size_names = ["Bytes", "KB", "MB", "GB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"

# Example of how to integrate with external AI services
def integrate_with_openai(message: str) -> str:
    """
    Example integration with OpenAI (requires openai package)
    Uncomment and configure if you want to use OpenAI
    """
    # try:
    #     import openai
    #     openai.api_key = "your-api-key-here"
    #     
    #     response = openai.ChatCompletion.create(
    #         model="gpt-3.5-turbo",
    #         messages=[
    #             {"role": "system", "content": "You are a helpful AI assistant."},
    #             {"role": "user", "content": message}
    #         ]
    #     )
    #     return response.choices[0].message.content
    # except ImportError:
    #     return "OpenAI integration not available. Install with: pip install openai"
    # except Exception as e:
    #     return f"Error with OpenAI: {str(e)}"
    pass

if __name__ == "__main__":
    print("🚀 Starting AI Chatbot Backend...")
    print("📝 API Documentation: http://localhost:8000/docs")
    print("🔗 Frontend URL: Open index.html in your browser")
    print("⚙️  Configure frontend API endpoint to: http://localhost:8000/chat")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True  # Enable auto-reload for development
    ) 