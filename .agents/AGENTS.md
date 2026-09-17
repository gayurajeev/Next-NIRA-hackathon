# Anavandi Smart Transit Project Guidelines

Welcome to the **Anavandi** project repository — a state-of-the-art public transit reporting, tracking, booking, and civic management ecosystem for Kerala State Road Transport Corporation (KSRTC).

## 🚀 Architectural Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS, Glassmorphism, Custom Theme Tokens (`ksrtc-yellow`, `ksrtc-red`, `ksrtc-swift`, `ksrtc-navy`)
- **Icons & Motion**: Lucide-React, Framer Motion
- **Database & Auth**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`) with fallback mock telemetry for zero-config local demo.

## 📁 Repository Structure
```
/
├── .agents/                      # Workspace Agent Customization Root
│   ├── AGENTS.md                 # Project Rules & Style Guidelines
│   ├── memory/                   # Domain & Architecture Context
│   │   └── context.md
│   └── skills/                   # Transit & Domain Skills
│       └── anavandi-transit/
│           └── SKILL.md
├── src/
│   ├── app/                      # App Router Pages & Layouts
│   ├── components/               # UI Components (Tracker, SeatPicker, IncidentModal, DepotDashboard)
│   ├── lib/                      # Supabase Client & Mock Telemetry Engine
│   └── types/                    # Core TypeScript Interfaces
└── supabase/                     # SQL Schemas and DB Migrations
    └── schema.sql
```

## 🎨 Design Rules & UX Principles
1. **Kerala Transit Brand Identity**: Incorporate iconic KSRTC heritage elements (Elephant badge inspiration, Yellow & Red Express themes, Swift Green Electric/Modern themes).
2. **Fund My Crazy Light Theme**: The UI is strictly Light Mode, heavily inspired by "Fund My Crazy". Use solid colors (Yellow, Google Blue), NO gradients, and a light blue graphing grid background with a white arched separator section. NO glassmorphism or dark mode allowed.
3. **Simulated Live Telemetry**: All transit components must support live location polling and simulated bus movement for real-time map feel.
4. **Commuter Safety First**: SOS Emergency action button accessible within 1 click on both mobile and desktop screens.
5. **Localhost & Browser Verification**: Do NOT automatically launch browser subagents or open `localhost` URLs. The user will inspect and test the running application locally themselves.
