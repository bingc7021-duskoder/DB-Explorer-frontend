# ERP Schema Explorer - Frontend Client

A production-grade, highly interactive React + TypeScript frontend application for visualizing PostgreSQL ERP database schemas with interactive **React Flow** entity-relationship node diagrams and executing AI-powered natural language database queries via Gemini 3.6 Flash.

---

## 🌟 Key Features

### 📐 1. Interactive React Flow ER Diagram Workspace
- **React Flow Engine (`@xyflow/react`)**: Node-graph engine rendering database tables as interactive nodes.
- **Custom Table Nodes**:
  - Displays Table Name & column count.
  - Highlights **Primary Keys (PK)** with gold key badges.
  - Highlights **Foreign Keys (FK)** with cyan link badges.
  - Formats **Data Types** (`VARCHAR`, `INT`, `TIMESTAMP`, etc.).
- **Live Interactive Dragging**: Drag individual table nodes around the canvas while relationship lines update live with 0ms drag latency.
- **Automatic Dagre Layout**: Auto-layout organizes complex database schemas using Dagre layout algorithms.
- **Relationship & Search Highlighting**:
  - Selecting any table node highlights its connected tables & relationship edges (`#38bdf8` / `#10b981`) while dimming unrelated tables to 25% opacity.
  - Searching for a table or column highlights matching nodes with a glowing emerald border (`border-emerald-400 ring-4`) and `MATCH` column badges.
- **Permanent Left Navigation Dock Strip**:
  - Features a prominent Database icon and real-time numerical table count badge (`Tables (14)`).
- **Collapsible Database Tables Sidebar**:
  - 300ms smooth CSS slide-in sidebar listing all tables with live search filter.
- **Table Details Inspector Drawer**:
  - Opened on-demand by clicking table names in the Tables Sidebar.
  - Slides in smoothly from the **LEFT side of the workspace** (`animate-slide-in-left`) with glassmorphic backdrop blur.
  - Displays column constraints, PK/FK relationships, and sample `SELECT` query block with 1-click copy.
- **Consolidated Diagram Controls**:
  - Clean bottom-left control bar containing Zoom In (+), Zoom Out (-), Fit View, Full Screen / Focus Mode toggle, and Reset Highlights.

### 🤖 2. ChatGPT-Style Chat Sessions & Assistant
- **Multiple Independent Conversations**: Authenticated users can maintain multiple chat sessions with individual message histories.
- **Automatic AI Title Generation**: Backend generates concise 2–5 word titles (e.g. `"Admin Users"`, `"Invoice Workflow"`) on the first user prompt.
- **Right-Side Sliding Chat History Drawer**:
  - Opens from the **RIGHT side** of the Chat Window (`animate-toast-slide-in-right`).
  - Activated by a prominent **History** button at the top-right of the chat header.
- **Single "New Chat" Button**:
  - Located exclusively at the top of the Chat History panel.
- **Individual Session Deletion**:
  - Hovering over a conversation row displays a delete icon with inline `"Delete chat? [Confirm] [Cancel]"` confirmation prompt.
- **Instant Message Rendering**: User prompts render in < 1ms while AI processing runs asynchronously in background.

### 🔐 3. Google OAuth 2.0 Authentication
- Protected routing ensuring only authenticated users can access the ERP dashboard.
- Captures Google user details (`googleId`, `name`, `email`, `picture`) and synchronizes with PostgreSQL `app_user` table.
- Top-Right profile bar with circular avatar, user details, notification toasts, and 1-click Logout button.

---

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript
- **Diagram Engine**: `@xyflow/react` (React Flow) & `dagre` graph layout
- **Styling**: Tailwind CSS, Glassmorphism design tokens
- **Icons**: Lucide React
- **Auth**: `@react-oauth/google` Google OAuth 2.0
- **HTTP Client**: Axios
- **Build Tool**: Vite

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation
```bash
cd Frontend
npm install
```

### Environment Setup
Create a `.env` file in `Frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### Running Development Server
```bash
npm run dev
```
Access application at `http://localhost:5173`.

---

## 📁 Project Architecture

```
Frontend/
├── public/
│   └── favicon.svg               # Application SVG Favicon
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   └── GoogleLogin.tsx   # Google OAuth Login Page
│   │   ├── ERDiagram/            # React Flow ER Diagram Components
│   │   │   ├── ReactFlowERDiagram.tsx # Main React Flow canvas with Controls & Grid
│   │   │   ├── TableNode.tsx      # Memoized Table Node component
│   │   │   ├── flowUtils.ts      # Schema metadata -> React Flow Dagre layout
│   │   │   ├── ERViewer.tsx       # Diagram workspace container with Left Navigation Dock
│   │   │   └── TableDetailsModal.tsx # Left-sliding Table details inspector drawer
│   │   ├── Chat/                 # AI Query Chat Assistant Components
│   │   │   ├── ChatWindow.tsx    # Chat container with Right-side History drawer
│   │   │   ├── Message.tsx       # User & Assistant message bubbles with SQL & tables
│   │   │   └── ChatInput.tsx     # Message input bar with Enter key submit
│   │   └── Layout/
│   │       ├── Header.tsx        # Top Header Bar with Profile & Logout
│   │       ├── Dashboard.tsx     # Main Split-Screen Workspace Container
│   │       └── ResizablePanel.tsx# Resizable Split Panel Handle
│   ├── hooks/
│   │   ├── useAuth.ts            # User session & OAuth authentication hook
│   │   ├── useChat.ts            # Chat Sessions & message management hook
│   │   └── useSchema.ts          # Database Schema metadata hook
│   ├── services/
│   │   ├── authService.ts        # Google login & backend user API integration
│   │   ├── chatService.ts        # Chat Sessions & message API integration
│   │   └── schemaService.ts      # Database schema API service
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces (User, Schema, ChatSession, ChatMessage)
│   ├── App.tsx                   # Auth Route Guard & Main App Component
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
└── README.md
```
