# PromptLibrary Quick Start Guide
## Get Up and Running in 10 Minutes

*Version: 1.0*  
*Last Updated: July 16, 2025*

---

## 🚀 Quick Overview

PromptLibrary is a RAG-enhanced AI prompt management platform built with React, TypeScript, and Firebase. This guide will get you running locally in under 10 minutes.

### What You'll Have After This Guide
- ✅ Local development environment running
- ✅ Firebase emulators for offline development
- ✅ Complete understanding of the project structure
- ✅ Ready to start developing or using the application

---

## 📋 Prerequisites (2 minutes)

### Required Software
```bash
# Check if you have these installed
node --version    # Should be >= 18.0.0
npm --version     # Should be >= 8.0.0
git --version     # Any recent version
```

### Install Missing Prerequisites
```bash
# Install Node.js (if needed)
# Visit: https://nodejs.org/

# Install Firebase CLI
npm install -g firebase-tools

# Verify installation
firebase --version
```

---

## ⚡ Quick Setup (5 minutes)

### 1. Clone and Install
```bash
# Clone the repository
git clone <your-repository-url>
cd React-App-000730

# Install frontend dependencies
cd frontend
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (optional for local development)
# The app will work with Firebase emulators without real Firebase config
```

### 3. Start Development Environment
```bash
# Terminal 1: Start Firebase emulators (optional but recommended)
firebase emulators:start

# Terminal 2: Start frontend development server
cd frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Firebase UI**: http://localhost:4000 (if using emulators)

---

## 🎯 First Steps (3 minutes)

### 1. Create an Account
1. Open http://localhost:5173
2. Click "Sign Up"
3. Use any email/password (emulator mode)
4. You'll be redirected to the dashboard

### 2. Upload Your First Document
1. Navigate to "Documents" in the sidebar
2. Click "Upload Documents"
3. Drag and drop a PDF, DOCX, TXT, or MD file
4. Watch the processing status update in real-time

### 3. Create Your First Prompt
1. Go to "Prompts" page
2. Click "New Prompt"
3. Fill in:
   - **Title**: "Document Summarizer"
   - **Content**: "Please summarize the following document: {{content}}"
   - **Variables**: Add "content" as a string variable
4. Save the prompt

### 4. Execute with AI
1. Click "Execute" on your prompt
2. Fill in the content variable
3. Enable "Use RAG" to include document context
4. Select your uploaded document
5. Click "Execute Prompt"
6. See AI-generated response with document context!

---

## 📁 Project Structure Overview

```
React-App-000730/
├── 📁 frontend/              # React TypeScript application
│   ├── 📁 src/
│   │   ├── 📁 components/    # UI components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── common/       # Shared components
│   │   │   ├── documents/    # Document management
│   │   │   ├── execution/    # Prompt execution
│   │   │   ├── layout/       # Layout components
│   │   │   └── prompts/      # Prompt management
│   │   ├── 📁 pages/         # Main page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── Prompts.tsx
│   │   │   ├── Executions.tsx
│   │   │   └── ExecutePrompt.tsx
│   │   ├── 📁 contexts/      # React contexts
│   │   ├── 📁 services/      # API services
│   │   ├── 📁 types/         # TypeScript definitions
│   │   └── 📁 utils/         # Utility functions
│   ├── 📄 package.json       # Dependencies and scripts
│   └── 📄 vite.config.ts     # Vite configuration
├── 📁 functions/             # Firebase Cloud Functions (Python)
├── 📁 docs/                  # Project documentation
├── 📄 firebase.json          # Firebase configuration
├── 📄 firestore.rules        # Database security rules
└── 📄 storage.rules          # Storage security rules
```

---

## 🛠️ Development Commands

### Frontend Development
```bash
cd frontend

# Start development server
npm run dev

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Firebase Commands
```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only firestore,auth

# Deploy to Firebase (requires real project)
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
```

---

## 🔧 Key Features to Explore

### 1. Document Management
- **Upload**: Drag & drop files up to 10MB
- **Processing**: Real-time status updates
- **Formats**: PDF, DOCX, TXT, MD support
- **RAG Ready**: Automatic vectorization for AI context

### 2. Prompt Management
- **Variables**: Dynamic prompts with typed variables
- **Organization**: Categories and tags
- **Templates**: Pre-built prompt library
- **Versioning**: Track prompt changes

### 3. AI Execution
- **Multiple Models**: Free Llama, Gemma, Phi-3 models
- **RAG Enhancement**: Document context integration
- **Real-time**: Live execution status
- **Analytics**: Token usage and performance metrics

### 4. User Experience
- **Real-time Updates**: No page refreshes needed
- **Toast Notifications**: Instant feedback
- **Responsive Design**: Works on mobile and desktop
- **Dark/Light Mode**: Theme support

---

## 🎨 UI Components Overview

### Layout Components
- **Layout**: Main application shell with sidebar
- **Sidebar**: Navigation menu with active states
- **Header**: User profile and actions
- **LoadingSpinner**: Consistent loading states

### Feature Components
- **DocumentUpload**: Drag & drop file upload
- **PromptEditor**: Rich text prompt editing
- **ExecutionPanel**: AI execution interface
- **ResultsDisplay**: AI response presentation

### Common Components
- **Button**: Consistent button styling
- **Modal**: Overlay dialogs
- **Toast**: Notification system
- **ErrorBoundary**: Error handling

---

## 🔍 Debugging Tips

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

**Firebase Emulator Issues**
```bash
# Clear emulator data
firebase emulators:start --import=./emulator-data --export-on-exit

# Reset emulator state
rm -rf .firebase/emulator-data
```

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Development Tools

**Browser DevTools**
- React Developer Tools extension
- Firebase DevTools
- Network tab for API debugging
- Console for error messages

**VS Code Extensions**
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense
- Firebase Explorer

---

## 🚀 Next Steps

### For Users
1. **Explore Templates**: Check out pre-built prompt templates
2. **Upload Documents**: Build your knowledge base
3. **Create Workflows**: Combine prompts for complex tasks
4. **Share Prompts**: Make prompts public for others

### For Developers
1. **Read Documentation**: Explore `/docs` folder for detailed guides
2. **Run Tests**: Understand the testing approach
3. **Explore Components**: Study the component architecture
4. **Contribute**: Add features or fix bugs

### Advanced Features
1. **API Integration**: Use the REST API for automation
2. **Custom Models**: Add support for additional AI models
3. **Workflow Builder**: Create complex prompt sequences
4. **Team Features**: Multi-user collaboration

---

## 📚 Additional Resources

### Documentation
- **USER_GUIDE.md**: Complete user manual
- **TECHNICAL_OVERVIEW.md**: Architecture details
- **docs/**: Comprehensive project documentation
- **README.md**: Project overview and setup

### Code Examples
- **src/components/**: UI component examples
- **src/services/**: API integration patterns
- **src/utils/**: Utility function examples
- **src/test/**: Testing patterns and examples

### External Resources
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Firebase Documentation**: https://firebase.google.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 🎉 You're Ready!

Congratulations! You now have a fully functional PromptLibrary development environment. The application includes:

- ✅ **Complete RAG Pipeline**: Document upload → processing → AI enhancement
- ✅ **Multiple AI Models**: Free access to Llama, Gemma, and Phi-3
- ✅ **Real-time Interface**: Live updates and notifications
- ✅ **Professional UI**: Modern, responsive design
- ✅ **Comprehensive Testing**: 80% test coverage

### Quick Verification Checklist
- [ ] Application loads at http://localhost:5173
- [ ] Can create account and sign in
- [ ] Can upload and process documents
- [ ] Can create and execute prompts
- [ ] Can see AI responses with document context
- [ ] Real-time updates work correctly

### Need Help?
- **Issues**: Check the troubleshooting section above
- **Questions**: Review the documentation in `/docs`
- **Bugs**: Create GitHub issues with detailed descriptions
- **Features**: Suggest improvements via GitHub discussions

**Happy coding! 🚀**
