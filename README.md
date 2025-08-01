# Security AI Frontend Interface

A modern, responsive chatbot interface built with HTML, CSS, and JavaScript that's fully compatible with Security AI FastAPI backends. This interface supports streaming responses, code analysis, and security-focused interactions.

## 🚀 Quick Start

### Local Development
1. Clone or download the files to your project directory
2. Open `index.html` in a web browser
3. Configure your FastAPI endpoint in Settings

### Deployment Options

#### Option 1: GitHub Pages (Free)
1. **Create a GitHub repository**
2. **Upload your files** to the repository
3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created automatically)
4. **Your site will be live at:** `https://trumpxelonmusk.github.io/kaliai/`

#### Option 2: Netlify (Free)
1. **Go to** [netlify.com](https://netlify.com)
2. **Drag and drop** your `chatbot-ui-1` folder
3. **Your site will be available at**: `https://random-name.netlify.app`

#### Option 3: Vercel (Free)
1. **Go to** [vercel.com](https://vercel.com)
2. **Import your GitHub repository**
3. **Deploy automatically**

#### Option 4: Traditional Web Hosting
1. **Upload files** to your web server
2. **Configure CORS** on your backend
3. **Update API endpoint** in settings

## 🔧 Backend Configuration

### For Production Deployment
Update your backend CORS settings:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://trumpxelonmusk.github.io",
        "https://yourdomain.com",
        "https://your-app.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Variables
Set these in your backend:
```bash
# For production
BACKEND_URL=https://your-backend-domain.com
CORS_ORIGINS=https://trumpxelonmusk.github.io
```

## 📋 Features

### 🎨 Modern UI/UX
- Clean, modern design with smooth animations
- Light and dark theme support with auto-detection
- Fully responsive design for all devices
- Custom scrollbars and smooth transitions

### 💬 Chat Functionality
- Real-time message sending and receiving
- **Streaming responses** with live typing effect
- Typing indicators
- Message timestamps
- Auto-resizing text input
- Message history management
- Clear chat functionality
- **Session management** for conversation continuity

### 📁 File Upload Support
- Drag and drop file upload
- Multiple file selection
- File type validation
- File size display
- Support for: TXT, PDF, DOC, DOCX, JPG, PNG

### ⚙️ Settings & Configuration
- Configurable API endpoint
- Theme selection (Light/Dark/Auto)
- Message history limits
- **Streaming response toggle**
- Settings persistence

### 🔧 Advanced Features
- Local storage for settings and chat history
- Export/import chat functionality
- Error handling and notifications
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- System theme detection

## 🔗 Security AI Backend Integration

This frontend is designed to work with Security AI backends that have the following endpoint structure:

```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio

app = FastAPI()

class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    stream: Optional[bool] = True

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    session_id: str
    timestamp: str

@app.post("/api/query")
async def query_security_ai(request: QueryRequest):
    """Main query endpoint for the Security AI system"""
    
    if request.stream:
        return StreamingResponse(
            generate_streaming_response(request.question),
            media_type="text/event-stream"
        )
    
    # Non-streaming response
    response = {"answer": "Your AI response here", "sources": []}
    return QueryResponse(
        answer=response["answer"],
        sources=response["sources"],
        session_id=request.session_id or "default",
        timestamp=datetime.utcnow().isoformat()
    )

async def generate_streaming_response(question: str):
    """Generate a streaming response"""
    response_text = f"Processing your security question: {question}"
    
    for chunk in chunk_text(response_text, chunk_size=20):
        yield json.dumps({
            "type": "answer",
            "content": chunk,
            "complete": False
        }) + "\n\n"
        await asyncio.sleep(0.05)
    
    yield json.dumps({
        "type": "complete",
        "sources": ["source1", "source2"],
        "complete": True
    }) + "\n\n"

```

### Backend Development
```bash
# Install dependencies
pip install -r requirements.txt

# Start backend
python backend_example.py

# Backend will run on http://localhost:8000
```

### Customization
- **Branding**: Update logos and colors in CSS
- **Features**: Extend functionality in JavaScript
- **Styling**: Modify CSS variables for themes
- **API**: Adapt backend integration

## 📱 Browser Support

- ✅ **Chrome** 90+
- ✅ **Firefox** 88+
- ✅ **Safari** 14+
- ✅ **Edge** 90+
- ✅ **Mobile browsers**

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Font Awesome** for icons
- **Google Fonts** for typography
- **FastAPI** for backend framework
- **GitHub Pages** for hosting

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/trumpxelonmusk/kaliai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/trumpxelonmusk/kaliai/discussions)
- **Email**: trumpxelonmusk@gmail.com

---

<div align="center">

**[Try KALIAI Live →](https://trumpxelonmusk.github.io/kaliai/)** | **[📖 Documentation](https://github.com/trumpxelonmusk/kaliai/wiki)** | **[🐛 Report Bug](https://github.com/trumpxelonmusk/kaliai/issues)**

*Built with ❤️ for the cybersecurity community*

</div>