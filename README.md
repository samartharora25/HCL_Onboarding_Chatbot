# HCL Tech Onboarding Assistant (RAG Chatbot)

An intelligent, secure, and responsive AI onboarding assistant designed to help new joiners at HCL Tech seamlessly set up their local work environments, configure developer tools, request software, configure proxies, and troubleshoot common onboarding issues.

The application uses a **RAG (Retrieval-Augmented Generation)** pipeline to retrieve official procedures from the *Pulse New Joiner - Requests & Setup Guide* and uses a high-performance LLM (via Groq API) to formulate precise, helpful step-by-step instructions.

---

## 🚀 Key Features

* **AI-Powered Chat Interface:** Smart, natural-sounding replies referencing the official HCL onboarding guidelines.
* **Source Citations:** Inline sources and direct reference links for verify-before-action reliability.
* **Supabase Authentication:** Secure user signup and signin capturing full name, email, and employee ID.
* **Hybrid RAG Pipeline:** Combining a local ChromaDB vector store, Hugging Face `BAAI/bge-large-en-v1.5` embeddings, and Groq's high-speed Llama-3.1 API.
* **Smart Fallback System:** Local-fallback mode that directly displays matching documentation blocks if the API goes offline or rate-limits are reached.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Vanilla CSS (harmonious dark/light theme, modern card layout, micro-animations, captcha safety).
* **Backend:** Flask, Flask-CORS, Python.
* **Database & Auth:** Supabase (User management & database triggers), ChromaDB (Vector store).
* **LLM & Embeddings:** Groq (Llama 3.1 8B), Hugging Face (`sentence-transformers`).

---

## ⚙️ How to Get Started

### Prerequisites
* Python 3.8+ installed on your system.
* Node.js (v18+) and npm installed.
* A free **Groq** account (for API key).
* A **Supabase** project (for authentication).

### 1. Repository Setup & Dependencies

Clone this repository and navigate to the project directory:
```bash
git clone https://github.com/samartharora25/HCL_Onboarding_Chatbot.git
cd HCL_Onboarding_Chatbot
```

#### Install Python Backend Requirements:
```bash
pip install -r requirements.txt
```

#### Install Frontend Packages:
```bash
cd frontend
npm install
cd ..
```

---

### 2. Configuration (`.env` Files)

Create a `.env` file in the **root** folder and a `.env` file in the **frontend** folder.

#### Root `.env` (Flask Backend):
```env
# Hugging Face Access Token
HF_ACCESS_KEY="your_hugging_face_token"

# Groq API Key
GROQ_API_KEY="your_groq_api_key"

# Supabase Auth Configuration
SUPABASE_URL="https://your-supabase-url.supabase.co"
SUPABASE_ANON_KEY="your_anon_public_key"

# Server Settings
FLASK_PORT=5000
FLASK_ENV=development
```

#### Frontend `frontend/.env` (Vite Frontend):
```env
VITE_SUPABASE_URL="https://your-supabase-url.supabase.co"
VITE_SUPABASE_ANON_KEY="your_anon_public_key"
VITE_API_BASE_URL="http://localhost:5000"
```

---

## 🏃 How to Run the Project

You need to run both the backend server and the frontend server.

### 1. Start the Flask Backend Server
From the project root directory, run:
```bash
python app.py
```
This runs the backend on `http://localhost:5000`.

### 2. Start the Vite Frontend Server
From the `frontend` directory, run:
```bash
npm run dev
```
This launches the development server on `http://localhost:5173`. Open this URL in your web browser.

---

## 🌐 Production Deployment (Render)

This project is optimized for deployment on **Render**:

1. **Backend (Web Service):**
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `gunicorn app:app`
   * Add backend `.env` variables in Render's dashboard.

2. **Frontend (Static Site):**
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Publish Directory:** `dist`
   * Add `VITE_API_BASE_URL` pointing to your deployed Render Web Service URL.

---

## 👥 Contributors

* **Samarth Arora** - Lead Developer & Creator - [@samartharora25](https://github.com/samartharora25)
* * **Pragya Chakravarty** - Lead Developer & Creator - [@pragyac09](https://github.com/pragyac09)
* **Gauravi Shyam ** - HCL Intern  - [gauravi-alt](https://github.com/gauravi-alt)
