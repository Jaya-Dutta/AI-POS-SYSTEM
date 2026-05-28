# 🤖 AI POS - Intelligent Point of Sale System

> A next-generation Point of Sale system supercharged with AI for automated bill scanning, smart inventory management, and intelligent analytics.

![Project Status](https://img.shields.io/badge/Status-Active_Development-green)
![Tech Stack](https://img.shields.io/badge/Stack-MERN_%2B_Firebase-blue)
![AI Power](https://img.shields.io/badge/AI-LangChain_%2B_HuggingFace-purple)

## ✨ Key Features

### 🧠 AI-Powered Intelligence
- **Smart Categorization**: Automatically categorizes new products using **LLMs (OpenAI/LangChain)**.
- **OCR Bill Scanning**: Upload bill images to automatically extract items and prices using **Hugging Face** models (`microsoft/trocr-base-printed`).
- **Sales Insights**: Generate AI summaries of your sales trends and performance.

### 🏪 Core POS Capabilities
- **Fast Checkout**: Efficient point-of-sale interface with product search and cart management.
- **Inventory Management**: Real-time tracking of stock levels, costs, and pricing.
- **Customer CRM**: Manage customer profiles and purchase history.
- **Dynamic Reports**: Visual analytics for revenue, top products, and inventory value.

### 🎨 Modern Experience
- **Sleek UI**: Fully responsive Dark/Light mode design using Tailwind CSS.
- **Secure**: Authentication ready (Firebase).

---

## 🚀 Quick Start (Windows)

The easiest way to run the entire system (Frontend + Backend):

```powershell
./start.ps1
```

This script will:
1. Check and install dependencies for both frontend and backend.
2. Verify environment configuration.
3. Launch both servers in a coordinated manner.

---

## 🛠️ Manual Installation & Setup

If you are on macOS/Linux or prefer manual control, follow these steps.

### 1. Prerequisites
- **Node.js** (v16+)
- **Firebase Project** (Firestore enabled)
- **Hugging Face Account** (for OCR)
- **OpenAI API Key** (optional, for Smart Categorization)

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory (`server/.env`) with the following credentials:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

# --- Firebase Admin SDK ---
# Option 1: JSON String (Recommended for local dev)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Option 2: Individual Fields
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_CLIENT_EMAIL=your-client-email
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"

# --- AI Configuration ---
# Hugging Face (Required for OCR Bill Scanning)
HF_API_TOKEN=your_huggingface_token
HUGGINGFACE_OCR_MODEL=microsoft/trocr-base-printed

# OpenAI (Required for Smart Categorization & Summaries)
OPENAI_API_KEY=your_openai_api_key
# LLM_MODEL=gpt-4o-mini (default)

# --- Dev Options ---
DISABLE_AUTH=false
```

### 4. Running the Application

**Start the Backend:**
```bash
cd server
npm run dev
```

**Start the Frontend:**
```bash
# In a new terminal
npm run dev
```

Visit `http://localhost:5173` to rely on the app.

---

## 🏗️ Technical Architecture

### Frontend (User Interface)
- **React 18** & **Vite**: Blazing fast SPA architecture.
- **Tailwind CSS**: Utility-first styling for a premium feel.
- **Lucide React**: Beautiful, consistent iconography.

### Backend (Server & Logic)
- **Node.js & Express**: Robust API layer.
- **Firebase Admin**: Secure interaction with Firestore and Storage.
- **LangChain.js**: Orchestrates LLM interactions for product intelligence.
- **Multer**: Handles file uploads for bill scanning.

---

## 📚 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List all inventory items |
| `POST` | `/api/transactions` | Process a new sale |
| `POST` | `/api/upload` | Upload bill image for OCR |
| `GET` | `/api/reports/sales` | Get sales analytics |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License.