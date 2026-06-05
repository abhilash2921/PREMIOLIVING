# Premio Living OS — Deployment & Setup Guide

This guide explains how to run, deploy, and configure the Premio Living OS on local and cloud servers.

## 🚀 Running Locally

The application runs as a serverless static web application. If you have Python or Node.js in your system PATH:
1. Double-click the **`run.bat`** launcher file in this directory.
2. It will detect your runtime environment, start a lightweight web server on `http://localhost:8000` (Python) or `http://localhost:3000` (Node.js), and automatically open your web browser.
3. If neither Python nor Node.js is found, it will safely open `index.html` directly in your default browser.

---

## ☁️ Online Cloud Deployment

Since the application requires no build steps, compiling, or server-side keys, it can be hosted directly on any static web hosting provider.

### Option A: Netlify (Drag & Drop)
1. Log in to [Netlify](https://www.netlify.com/).
2. Go to **Sites** and scroll to the bottom.
3. Drag and drop this folder (or the generated project ZIP file) directly into the upload area.
4. Your site will build instantly and be online in under 15 seconds.
5. *Note: `netlify.toml` is included to handle clean URL rewrites.*

### Option B: Vercel (GitHub Integration)
1. Upload this project to a GitHub repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select your repository and click **Deploy**. Vercel will automatically detect the static project structure and put it online.
4. *Note: `vercel.json` is included to handle clean URL rewrites.*

---

## 🗄️ Supabase Cloud Database Integration

By default, the application runs in a self-contained offline **Demo Mode** using the browser's local memory, making it immediately usable out-of-the-box. To connect a shared cloud database:

### 1. Database Setup
1. Create a free account at [Supabase](https://supabase.com/).
2. Create a new project.
3. Go to the **SQL Editor** tab in the Supabase Sidebar.
4. Click **New Query**, open the `schema.sql` file from this project folder, paste its contents, and click **Run**.
5. This script creates the tables (`profiles`, `projects`, `vendors`, `rfqs`, `purchase_orders`, `payouts`, `project_members`, `document_files`), configures Row-Level Security (RLS) policies, and creates auto-profile triggers.

### 2. Connect Your App
1. Inside your Supabase project dashboard, navigate to **Project Settings** > **API**.
2. Copy the **Project URL** and **Anon API Key** (anon public).
3. Open your deployed Premio Living OS app.
4. Click the gear icon (**System Settings & DB**) at the bottom left of the sidebar.
5. Paste the URL and API key into their respective fields.
6. Click **Save Settings**. The page will reload and prompt you to create an account or sign in.
7. Any data created in your workspace will now automatically sync to Supabase in the background.

---

## 🔒 Security Restrictions
- Only the email `abhilash@premioliving.in` is authorized to register as an **Admin** user with full write access.
- Non-admin signup attempts will automatically downgrade the user's role to a standard **Site Engineer** access level to secure operational safety.
