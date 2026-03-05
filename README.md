<div align="center">

# 📰 News Website Analyzer

### Instantly analyze any website with real-time AI streaming and verdicts

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.13-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)

---

## 🌟 Overview

A full-stack AI-powered application that provides intelligent website analysis using **OpenRouter AI** with **real-time SSE streaming**. Enter any URL and watch as the AI generates a comprehensive markdown analysis with clear verdicts in real-time.

```
┌──────────────┐     POST /api      ┌──────────────┐     Fetch      ┌──────────────┐
│   React UI   │ ───────────────▶   │   Express    │ ────────────▶  │   Website    │
│   (Vite)     │                    │   Server     │                │   Content    │
└──────────────┘                    └──────────────┘                └──────────────┘
       ▲                                   │
       │                                   │ Parse HTML (JSDOM)
       │                                   ▼
       │                            ┌──────────────┐
       │◀─── SSE Stream ────────────│  OpenRouter  │
       │     (Real-time chunks)     │     AI       │
       │                            └──────────────┘
```

---

## 🏗️ Architecture

```
AI-Analyzer/
│

├── 📁 analyzer-frontend/          # React Client (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── AnalyzerDisplay.jsx   # Markdown renderer
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page
│   │   │   └── WebsiteAnalyzer.jsx  # URL input & streaming
│   │   ├── App.jsx                  # Main router
│   │   └── main.jsx                 # Entry point
│   └── package.json
│
├── 📁 analyzer-backend/           # Express API Server
│   ├── controllers/
│   │   └── openRouterController.js  # Website analysis logic
│   ├── routes/
│   │   ├── index.js                 # Route aggregator
│   │   └── openRouterSumm.js        # OpenRouter routes
│   ├── server.js                    # Express app entry
│   └── package.json
│
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend

| Technology           | Version | Purpose                 |
| :------------------- | :-----: | :---------------------- |
| **React**            | 19.1.1  | UI Library              |
| **Vite**             |  7.1.7  | Build Tool & Dev Server |
| **Tailwind CSS**     | 4.1.13  | Utility-first Styling   |
| **React Router DOM** |  7.9.3  | Client-side Routing     |
| **Axios**            | 1.12.2  | HTTP Client             |
| **React Markdown**   | 10.1.0  | Markdown Rendering      |

### Backend

| Technology         | Version | Purpose               |
| :----------------- | :-----: | :-------------------- |
| **Node.js**        | ≥18.0.0 | Runtime Environment   |
| **Express**        |  5.1.0  | Web Framework         |
| **OpenRouter SDK** | 0.3.16  | AI API Gateway        |
| **JSDOM**          | 27.0.0  | HTML Parsing          |
| **node-fetch**     |  3.3.2  | HTTP Fetching         |
| **CORS**           |  2.8.5  | Cross-Origin Support  |
| **Morgan**         | 1.10.1  | HTTP Logger           |
| **dotenv**         | 17.2.3  | Environment Variables |

### AI Provider

| Model                               | Provider   |
| :---------------------------------- | :--------- |
| `liquid/lfm-2.5-1.2b-instruct:free` | OpenRouter |

---

## ✨ Features

| Feature                         | Description                                                        |
| :------------------------------ | :----------------------------------------------------------------- |
| 🌊 **Real-time Streaming**      | SSE (Server-Sent Events) for live analysis updates as AI generates |
| 🧹 **Smart Content Extraction** | JSDOM removes unnecessary elements (nav, footer, scripts)          |
| 📝 **Markdown Formatting**      | AI returns structured markdown with emojis & sections              |
| ✅ **URL Validation**           | Validates HTTP/HTTPS protocols before processing                   |
| ⏱️ **Timeout Handling**         | 30-second abort controller for slow websites                       |

---

## 🔄 How It Works

### Frontend Workflow

```
1️⃣  USER INPUT
    └─▶ User enters a website URL in the input form
    └─▶ Form validation ensures URL is provided

2️⃣  HTTP REQUEST
    └─▶ POST request to /api/analyze/website
    └─▶ Body: { url: "https://example.com" }

3️⃣  SSE STREAM HANDLING
    └─▶ ReadableStream API reads response chunks
    └─▶ TextDecoder converts binary to text
    └─▶ Parses "data: {chunk}" from SSE format

4️⃣  REAL-TIME RENDERING
    └─▶ React state updates with each chunk
    └─▶ AnalyzerDisplay renders markdown live
    └─▶ User sees analysis and verdicts "typed" in real-time
```

### Backend Workflow

```
1️⃣  REQUEST HANDLING
    └─▶ Express receives POST at /api/analyze/website
    └─▶ Validates URL format (http:// or https://)

2️⃣  WEBSITE FETCHING
    └─▶ node-fetch GETs the target website
    └─▶ User-Agent header mimics browser
    └─▶ 30-second timeout via AbortController

3️⃣  HTML PARSING (JSDOM)
    └─▶ REMOVES: <script>, <style>, <nav>, <header>, <footer>
    └─▶ EXTRACTS: <main>, <article>, .content, or <body>
    └─▶ Returns clean plain text

4️⃣  CONTENT PREPARATION
    └─▶ Validates text (minimum 50 characters)
    └─▶ Truncates to 50,000 characters max

5️⃣  AI ANALYSIS
    └─▶ Sends to OpenRouter API
    └─▶ Model: liquid/lfm-2.5-1.2b-instruct:free
    └─▶ Requests streaming response

6️⃣  SSE STREAMING RESPONSE
    └─▶ Headers: Content-Type: text/event-stream
    └─▶ Streams: data: {"chunk": "..."}\n\n
    └─▶ Sends done signal when complete
```

### End-to-End Data Flow

```
┌─────────┐
│  User   │
└────┬────┘
    │ 1. Enter URL
    ▼
┌────────────────────┐    POST /api/analyze/website    ┌────────────────────┐
│  React Frontend    │ ─────────────────────────────────▶│  Express Server    │
│ (analyzer-frontend)│                                   │ (analyzer-backend) │
└────────────────────┘                                   └────────┬───────────┘
    ▲                                                          │
    │                                                2. Fetch  │
    │                                                          ▼
    │                                                ┌────────────────────┐
    │                                                │  Target Website    │
    │                                                └────────┬──────────┘
    │                                                          │
    │                                            3. HTML      │
    │                                                          ▼
    │                                                ┌──���─────────────────┐
    │                                                │   JSDOM Parser     │
    │                                                └────────┬──────────┘
    │                                                          │
    │                                            4. Text      │
    │                                                          ▼
    │                                                ┌────────────────────┐
    │◀──────────── 5. SSE Stream ────────────────────│  OpenRouter AI     │
    │                                                └────────────────────┘
    │
    ▼ 6. Render
┌────────────────────┐
│ AnalyzerDisplay    │
└────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 8.0.0
- **OpenRouter API Key** ([Get one here](https://openrouter.ai/))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AI-Analyzer
```

#### Backend Setup

```bash
cd analyzer-backend
npm install

# Create .env file
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

npm run dev
```

#### Frontend Setup

```bash
cd analyzer-frontend
npm install
npm run dev
```

### Access

| Service  | URL                   |
| :------- | :-------------------- |
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:5000 |

---

## 📚 API Reference

### Base URL

```
http://localhost:5000/api
```

### Endpoints

#### 🌐 Website Analysis

```http
POST /api/analyze/website
Content-Type: application/json

{
  "url": "https://example.com"
}
```

**Response**: Server-Sent Events stream

```
data: {"chunk": "## Analysis\n"}
data: {"chunk": "This website..."}
data: [DONE]
```

#### ❤️ Health Check

```http
GET /api/health
```

---

## ⚙️ Configuration

### Backend `.env`

```env
NODE_ENV=development
PORT=5000
OPENROUTER_API_KEY=your_openrouter_api_key_here
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=AI Content Analyzer
```

---

## 📊 Performance

| Operation        | Expected Time |
| :--------------- | :------------ |
| Website Analysis | 10-45 seconds |
| PDF Processing   | 5-30 seconds  |
| Image Analysis   | 2-10 seconds  |
| UI Response      | < 100ms       |

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with ❤️ using React, Express, and OpenRouter AI**

⭐ Star this repo if you found it helpful!

</div>