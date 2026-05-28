# Quick Start Guide

## ⚡ Get Running in 2 Minutes

### 1. Setup Firebase (Required)

You need a Firebase project for the database. Here's how:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Firestore Database** (Cloud Firestore)
4. Go to Project Settings → Service Accounts
5. Click "Generate new private key"
6. Save the JSON file

### 2. Configure Environment

Open `server/.env` and add your Firebase credentials:

**Option A: JSON String (Easiest)**
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
```

**Option B: Individual Fields**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
```

### 3. Run the Application

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

### 4. Access the App

Open your browser to: **http://localhost:5173**

Login with any credentials (auth is bypassed in demo mode).

---

## 🎯 First Steps

1. **Add Products**: Go to Products → Add Product
2. **Create a Sale**: Go to POS → Click products → Complete Sale
3. **View Reports**: Check Reports section for analytics

---

## 🔧 Optional: OCR Bill Scanning

To enable bill scanning with OCR:

1. Get a Hugging Face token: https://huggingface.co/settings/tokens
2. Add to `server/.env`:
   ```env
   HF_API_TOKEN=your_token_here
   ```
3. Restart the server
4. Use "Scan Bill" button in POS

---

## 🐛 Troubleshooting

### Server won't start
- Check Firebase credentials in `.env`
- Verify Firestore is enabled in Firebase Console
- Check port 4000 is not in use

### Frontend won't connect
- Ensure backend is running on port 4000
- Check CORS settings in server `.env`

### Database errors
- Verify Firestore rules allow read/write
- Check Firebase service account has permissions

---

## 📝 Sample Data

Create some test products to get started:

```json
{
  "name": "Coca Cola",
  "price": 50,
  "cost": 35,
  "quantity": 100,
  "category": "Beverages"
}
```

---

## 🚀 Production Deployment

When ready for production:

1. Set `DISABLE_AUTH=false` in server `.env`
2. Implement Firebase Authentication in `AuthPage.jsx`
3. Configure Firestore security rules
4. Set up proper environment variables
5. Build and deploy:
   ```bash
   npm run build
   ```

---

Need help? Check the main README.md for detailed documentation.
