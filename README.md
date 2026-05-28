# 🤖 AI POS - Intelligent Point of Sale System

> A premium, next-generation Point of Sale system supercharged with local AI for automated bill scanning, smart inventory management, and intelligent analytics. Built for high performance, ease of use, and zero-config local operations with seamless production readiness.

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com/Jaya-Dutta/AI-POS-SYSTEM)
[![Tech Stack](https://img.shields.io/badge/Stack-React_%2B_Node.js-blue)](https://github.com/Jaya-Dutta/AI-POS-SYSTEM)
[![Database](https://img.shields.io/badge/Database-Firestore_%2F_Local_Fallback-orange)](https://github.com/Jaya-Dutta/AI-POS-SYSTEM)
[![OCR Engine](https://img.shields.io/badge/OCR-Tesseract.js_%2B_Jimp-purple)](https://github.com/Jaya-Dutta/AI-POS-SYSTEM)

---

## ✨ Features

### 🧠 Intelligent OCR Bill Scanning (Local & Accurate)
- **Zero-Config OCR**: Upload image bills (JPG, JPEG, PNG) to automatically extract items, quantities, and prices.
- **Pure Local Execution**: Runs entirely in the browser/node environment via `Tesseract.js` without mandatory cloud API tokens.
- **Image Preprocessing Pipeline**: Built-in `Jimp` image processing automatically resizes, converts to grayscale, adjusts contrast, and applies local luminance thresholding (binarization) to dramatically improve text recognition.
- **Smart Parsing Heuristics**: Automatically detects multiple receipt line patterns and filters out header/footer metadata (tax, total, change, phone numbers) so only purchased items enter the POS cart.

### 🏪 Core POS Capabilities
- **Fast Checkout**: Add products to the cart from the UI catalog or OCR uploads.
- **Dynamic Catalog Mapping**: Automatically matches parsed OCR item names to existing inventory products to link pricing and decrement stock. Unmatched items receive temporary unique IDs, letting you modify or delete them without cart state conflicts.
- **Inventory Management**: Real-time tracking of stock levels, costs, and retail prices.
- **Customer & Vendor CRM**: Keep track of customer profiles and wholesale vendor details.
- **Analytics & Reporting**: Sales summary reports, inventory valuations, and top-selling product insights.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Context API (Theme management)
- **Backend**: Node.js, Express, Cors, Multer (file handling)
- **OCR & Processing**: Tesseract.js, Jimp
- **Database & Auth**: Firebase Admin SDK (Production) & Local JSON Database Fallback (`db.json` / static file serving) for zero-config setups.

---

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Setup Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Jaya-Dutta/AI-POS-SYSTEM.git
   cd AI-POS-SYSTEM
   ```

2. **Install Dependencies**:
   *Frontend*:
   ```bash
   npm install
   ```
   *Backend*:
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Start the Application**:
   *Frontend (Port 3000)*:
   ```bash
   npm run dev
   ```
   *Backend (Port 4000)*:
   ```bash
   cd server
   npm run dev
   ```

4. Open **`http://localhost:3000`** in your browser, click **Get Started**, and log in with any dummy email/password (e.g. `test@example.com` / `password`) to access the dashboard!

---

## 🔧 Environment Configuration

To customize credentials, create a `.env` file in the `server` directory:

```env
PORT=4000
DISABLE_AUTH=true
USE_MOCK_DB=true
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# --- Optional Cloud Services ---
# Firebase Admin credentials (if using Cloud Firestore instead of local mock)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Hugging Face token (if preferring cloud OCR over local Tesseract)
# HF_API_TOKEN=your_huggingface_token
# USE_HF_OCR=true
```

---

## 🌍 Production Deployment Guide

### Frontend Deployment (Vercel)
The project includes a `vercel.json` file configured for SPA single-page routing:
1. Log in to [Vercel](https://vercel.com) and link your GitHub account.
2. Select **Add New Project** and import the `AI-POS-SYSTEM` repository.
3. Configure the following environment variable:
   - `VITE_API_BASE`: Set to your deployed Render backend URL (e.g., `https://ai-pos-backend.onrender.com`).
4. Click **Deploy**. Vercel will automatically build the Vite assets and serve them.

### Backend Deployment (Render)
The project includes a `render.yaml` Blueprint file for fully automated backend deployments:
1. Log in to [Render](https://render.com) and link your GitHub account.
2. Click **New** -> **Blueprint Route** and connect your `AI-POS-SYSTEM` repository.
3. Render will read the `render.yaml` specification and set up the web service using:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Set the following environment variable in the Render dashboard under **Environment**:
   - `CORS_ORIGIN`: Set to your Vercel frontend domain (e.g., `https://your-app.vercel.app`).
5. Click **Apply**. Render will deploy the backend API.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository, make your changes on a feature branch, and submit a pull request.