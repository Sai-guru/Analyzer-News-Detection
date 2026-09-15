# 🚀 Analyzer Backend API

A backend API that combines Tavily live search with OpenRouter AI for evidence-based website analysis and streaming verdicts.

## ✨ Features

- **📄 PDF Summarization**: Extract and summarize content from PDF documents
- **🖼️ Image Analysis**: Detailed analysis and description of uploaded images
- **🌐 Website Analysis**: Scrape, search, and analyze content from any website
- **🔒 Security First**: Built with helmet, rate limiting, and proper error handling
- **📊 Professional Logging**: Comprehensive logging with Morgan
- **⚡ High Performance**: Optimized for speed and efficiency
- **🛡️ Error Resilience**: Graceful error handling and recovery

## 🏗️ Architecture

### Project Structure

```
├── src/
│   ├── controllers/        # Business logic controllers
│   │   └── mainController.js
│   ├── services/            # External service integrations
│   │   ├── openRouterService.js
│   │   └── tavilyService.js
│   ├── prompts/             # AI system prompts
│   │   └── systemPrompt.js
│   ├── routes/              # API route definitions
│   │   ├── index.js
│   │   └── openRouterSumm.js
│   └── server.js             # Main application entry point
├── uploads/              # Temporary file storage
├── package.json          # Project dependencies
└── .env.example          # Environment variables template
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- OpenRouter API key
- Tavily API key

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd summarizer-backend-gemini
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Configure your API keys**

- OpenRouter: https://openrouter.ai/
- Tavily: https://tavily.com/

5. **Start the server**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Endpoints

#### 📄 PDF Summarization

```http
POST /api/summarize/pdf
Content-Type: multipart/form-data

Form Data:
- file: PDF file (max 10MB)
```

**Response:**

```json
{
  "success": true,
  "summary": "Detailed summary of the PDF content...",
  "wordCount": 1250,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 🖼️ Image Analysis

```http
POST /api/summarize/image
Content-Type: multipart/form-data

Form Data:
- file: Image file (JPEG, PNG, GIF, WebP - max 5MB)
```

**Response:**

```json
{
  "success": true,
  "analysis": "Detailed description of the image content...",
  "metadata": {
    "filename": "example.jpg",
    "mimeType": "image/jpeg",
    "sizeKB": 245,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 🌐 Website Analysis

```http
POST /api/summarize/website
Content-Type: application/json

{
  "url": "https://example.com"
}
```

**Response:**

```json
{
  "success": true,
  "url": "https://example.com",
  "summary": "Structured analysis with verdicts...",
  "metadata": {
    "wordCount": 890,
    "contentLength": 5432,
    "truncated": false,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### ❤️ Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "status": "OK",
  "message": "Summarizer API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## ⚙️ Configuration

### Environment Variables

| Variable             | Description                       | Default       | Required |
| -------------------- | --------------------------------- | ------------- | -------- |
| `NODE_ENV`           | Environment mode                  | `development` | No       |
| `PORT`               | Server port                       | `5000`        | No       |
| `OPENROUTER_API_KEY` | OpenRouter API key                | -             | **Yes**  |
| `TAVILY_API_KEY`     | Tavily API key                    | -             | **Yes**  |
| `ALLOWED_ORIGINS`    | CORS allowed origins (production) | -             | No       |

### Security Features

- **Helmet.js**: Security headers protection
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **File Size Limits**: PDF (10MB), Images (5MB)
- **File Type Validation**: Strict MIME type checking
- **CORS Protection**: Configurable cross-origin policies
- **Error Sanitization**: No sensitive data leaks

## 🧪 Testing

Test the API endpoints using curl or Postman:

```bash
# Health check
curl http://localhost:5000/api/health

# PDF upload
curl -X POST -F "file=@document.pdf" http://localhost:5000/api/summarize/pdf

# Image upload
curl -X POST -F "file=@image.jpg" http://localhost:5000/api/summarize/image

# Website analysis
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  http://localhost:5000/api/summarize/website
```

## 📦 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Set up proper SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up monitoring and logging
- [ ] Configure file cleanup cron jobs

### Docker Support

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting guide](#troubleshooting)
2. Search existing [GitHub issues](link-to-issues)
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- OpenRouter AI for model access
- Tavily for live search evidence
- Express.js community for robust web framework
- All contributors who help improve this project

---

Made with ❤️ by [Your Name]
