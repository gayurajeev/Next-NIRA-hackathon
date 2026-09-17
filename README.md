# Next-NIRA-hackathon

# NIRA: Neighborhood Intelligence & Response Assistant

An intelligent civic drainage reporting and municipal response platform built for the **Kochi Civic Tech Hackathon**.

Inspired by **Google Gemini** and the **Fund My Crazy** aesthetic, NIRA bridges the gap between citizens experiencing localized urban waterlogging and municipal authorities responsible for storm drain maintenance.

---

## 🌟 Key Features

### 1. 📝 Citizen Report
- **AI Vision Issue Classification**: Snap or upload photos of blocked storm drains, silt accumulation, or broken culverts (96.4% confidence score).
- **Auto Ward Routing**: Automatically assigns reports to responsible Kochi wards (Ward 24 Vyttila, Ward 35 Kadavanthra, Ward 12 Fort Kochi, Ward 40 Edappally, Ward 28 Kaloor).
- **Automated Impact / Priority Score**: Real-time 0–100 impact score computed from blockage severity and transit corridor proximity.
- **Supabase Storage**: Real photos uploaded directly to the public bucket `storage/reports/*`.

### 2. 📋 My Reports
- **Personal Tracking Dashboard**: Real-time ticket tracking with status filters (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `ESCALATED`).
- **4-Step Visual Timeline**: Progress pipeline tracking (Reported ➔ Ward Officer Assigned ➔ In Progress / Escalated ➔ Cleared & Resolved).

### 3. 🛡️ Authority Command Center
- **Municipal Operations Control**: High-level KPIs (Total Tickets, High Priority Drains, Escalated Tickets, Resolution Rate).
- **Ward Officer Dispatch Queue**: Sort tickets by Priority Score and assign field crews with 1 click.
- **AI Hotspot Cluster Detection**: Identifies repeated nearby drainage failures (e.g. SA Road Arterial Drain, Edappally Toll Culvert Zone).

### 4. 🗺️ Public Map
- **Civic GIS Map**: Visual pin markers for active blockages, resolved green pins, and pulsing red hotspot zones across Kochi wards.

### 5. 🔐 Dual Authentication
- **Citizens**: Google OAuth login (`Sign in with Google`) + instant demo citizen session.
- **Government Authorities**: Email & Password login (`admin@nira.in` / `nira@123`) unlocking command center dispatch actions.

---

## 🚀 Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Fund My Crazy Light Theme, Sky-Blue Graph Paper Grid)
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
- **Storage Bucket**: `storage` (Public bucket for drainage photos)

---

## 🛠️ Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/gayurajeev/Next-NIRA-hackathon.git
cd Next-NIRA-hackathon
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migrations
Execute [`supabase/nira_schema.sql`](supabase/nira_schema.sql) in your Supabase SQL Editor.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Credentials

- **Citizen Access**: Sign in with Google or use the "Instant Citizen Demo Login" button.
- **Government Authority Access**:
  - **Email**: `admin@nira.in`
  - **Password**: `nira@123`
