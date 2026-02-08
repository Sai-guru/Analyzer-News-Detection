# 🌟 Summarizer Frontend

A modern, responsive React application that provides an intuitive interface for AI-powered content summarization. Built with React 19, Vite, and TailwindCSS.

## ✨ Features

- **🏠 Clean Home Interface**: Modern landing page with easy navigation
- **📄 PDF Summarization**: Upload and get AI-powered summaries of PDF documents
- **🌐 Website Summarization**: Analyze and summarize content from any website URL
- **📱 Responsive Design**: Fully responsive interface that works on all devices
- **⚡ Fast & Modern**: Built with Vite for lightning-fast development and builds
- **🎨 Beautiful UI**: Crafted with TailwindCSS for stunning visual design
- **🔄 Real-time Updates**: Instant feedback and loading states
- **🏠 Quick Navigation**: Home button always available for easy navigation

## 🏗️ Architecture

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── HomeButton.jsx       # Navigation component
│   └── SummaryDisplay.jsx   # Results display component
├── pages/               # Main application pages
│   ├── Home.jsx            # Landing page
│   ├── PDFSummarizer.jsx   # PDF upload and summarization
│   └── WebsiteSummarizer.jsx # Website URL summarization
├── assets/              # Static assets
├── App.jsx              # Main application component
├── main.jsx             # Application entry point
├── App.css              # Global styles
└── index.css            # TailwindCSS imports
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Summarizer Backend API running (see backend README)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd summarizer-frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your backend API URL
```

4. **Start the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to `http://localhost:5173` to see the application.

### Example .env file

```env
VITE_API_BASE_URL=http://localhost:5000
```

## 📚 Features Guide

### 🏠 Home Page

- **Welcome Interface**: Clean, modern landing page
- **Feature Cards**: Easy access to PDF and Website summarization
- **Navigation**: Intuitive routing to different features

### 📄 PDF Summarizer

- **Drag & Drop**: Easy file upload with visual feedback
- **File Validation**: Automatic PDF format and size validation
- **Progress Tracking**: Real-time upload and processing status
- **Results Display**: Clean, readable summary presentation
- **Download Options**: Copy or save summary results

### 🌐 Website Summarizer

- **URL Input**: Simple URL input with validation
- **Live Preview**: Website preview while processing
- **Smart Analysis**: AI-powered content extraction and summarization
- **Quick Actions**: Share, copy, or save summaries

## 🎨 UI Components

### HomeButton Component

- Always visible navigation
- Smooth transitions
- Consistent positioning

### SummaryDisplay Component

- Formatted text display
- Loading states
- Error handling
- Copy-to-clipboard functionality

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Code Style

This project uses:

- **ESLint** for code linting
- **React Hooks** for state management
- **Functional Components** with modern React patterns
- **TailwindCSS** for styling
- **Axios** for API communication

### Folder Conventions

```
├── components/     # Reusable UI components
├── pages/         # Route-level components
├── assets/        # Static files (images, icons)
├── styles/        # Global styles (if needed)
└── utils/         # Helper functions and utilities
```

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### TailwindCSS Classes Used

- **Layout**: `flex`, `grid`, `container`
- **Spacing**: `p-4`, `m-6`, `gap-4`
- **Typography**: `text-lg`, `font-bold`, `text-center`
- **Colors**: Custom color palette for consistent theming
- **Responsive**: `sm:`, `md:`, `lg:` prefixes

## 🔌 API Integration

### Backend Connection

The frontend communicates with the backend API through:

```javascript
// API base configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});
```

### Error Handling

- **Network Errors**: User-friendly error messages
- **Timeout Handling**: 30-second timeout with retry options
- **Validation Errors**: Real-time form validation feedback
- **Server Errors**: Graceful degradation with helpful messages

## 🧪 Testing

### Manual Testing Checklist

- [ ] Home page loads correctly
- [ ] Navigation between pages works
- [ ] PDF upload and summarization
- [ ] Website URL summarization
- [ ] Responsive design on different screen sizes
- [ ] Error handling for invalid inputs
- [ ] Loading states during API calls

### Browser Compatibility

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Deployment Options

#### Netlify

```bash
# Build command
npm run build

# Publish directory
dist
```

#### Vercel

```bash
# Automatic deployment from GitHub
# Build command: npm run build
# Output directory: dist
```

#### Traditional Web Server

```bash
npm run build
# Copy dist/ folder to your web server
```

### Performance Optimization

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Automatic image and CSS optimization
- **Caching**: Proper cache headers for static assets

## 🔧 Troubleshooting

### Common Issues

**Development server won't start:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**API connection fails:**

- Check backend server is running on correct port
- Verify VITE_API_BASE_URL in .env file
- Check for CORS issues in browser console

**Build fails:**

- Run `npm run lint` to check for code issues
- Ensure all environment variables are properly set
- Check for TypeScript errors if using TS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the code style guidelines
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Use functional components with hooks
- Follow React best practices
- Write self-documenting code
- Add comments for complex logic
- Ensure responsive design
- Test on multiple browsers

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check this README for troubleshooting tips
2. Verify backend API is running correctly
3. Check browser console for errors
4. Create an issue with detailed information

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Vite** for lightning-fast development experience
- **TailwindCSS** for beautiful, utility-first CSS
- **Axios** for reliable HTTP client
- **React Router** for seamless navigation

---

Built with ❤️ and modern web technologies

🚀 **[Live Demo](your-demo-url)** | 📖 **[Documentation](your-docs-url)** | 🐛 **[Issues](your-issues-url)**
