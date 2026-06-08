# SplitTs ✂️

Make your project token-efficient for Claude, ChatGPT, and other LLMs.

**SplitTs** is a blazing-fast, client-side tool that takes your bloated project `.zip`, strips out all the noise (`node_modules`, `.git`, `dist`, images), and splits your raw source code into perfectly sized `.txt` chunks. 

Feed your entire codebase into Claude's context window without hitting token limits.

## ✨ Features
- **Intelligent Filtering:** Automatically removes `.git`, `node_modules`, `dist`, and large binary assets to save you millions of useless tokens.
- **Perfect Chunks:** Maintains directory structure while splitting your codebase into configurable chunk sizes (e.g., 5MB, 10MB, 30MB) so Claude never chokes.
- **Secure Local Processing:** Your code never leaves your browser. Zip extraction, filtering, and splitting happen instantly on your own machine.
- **Frictionless Pay-Per-Use:** No signups, no subscriptions. Just a one-time ₹1 Razorpay micro-transaction to unlock your freshly optimized files.

## 🚀 How It Works
1. **Upload:** Drag and drop your project `.zip`.
2. **Configure:** Use the slider to pick your target part size (e.g., 30MB for standard Claude Sonnet, smaller for others).
3. **Split:** The app instantly processes the zip in your browser and previews the resulting chunks.
4. **Unlock:** Pay ₹1 securely via Razorpay.
5. **Download:** Instantly download your token-efficient `.txt` files.

## 💻 Tech Stack
- **Frontend:** React, Next.js (App Router), JSZip
- **Backend:** Next.js API Routes (Serverless) for secure payment generation and verification.
- **Database:** Supabase (Single table for logging payment success).
- **Payments:** Razorpay.

## 🛠️ Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/priyansh0602/SplitTs.git
   cd SplitTs
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env.local`):
   ```env
   RAZORPAY_KEY_ID=your_live_key
   RAZORPAY_KEY_SECRET=your_live_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_live_key
   
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
