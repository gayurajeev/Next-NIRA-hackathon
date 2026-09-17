# NIRA Deployment & Environment Setup Guide

## 🌐 Production Deployment (Vercel)

1. **Import Repository**: Link `https://github.com/gayurajeev/Next-NIRA-hackathon` on Vercel.
2. **Environment Variables**:
   Add the following in project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://qjbcbmogmsqrewmntjwc.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_hc-78fG4xCYMaGZmCLXfUw_TebnXGqu`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

## 🗄️ Supabase Backend Provisioning

1. Go to your Supabase Project Dashboard.
2. Open **SQL Editor** and execute `supabase/nira_schema.sql`.
3. Open **Storage** -> Ensure a public bucket named `storage` exists with Public Read enabled.
4. (Optional) Open **Authentication** -> **Providers** -> Enable Google OAuth with your Google Cloud Client ID and Client Secret.
