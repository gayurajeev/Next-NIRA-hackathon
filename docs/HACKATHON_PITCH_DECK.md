# NIRA (നിറ) — Hackathon Presentation Pitch Deck
### Autonomous Civic Drainage Intelligence & Flood Prevention Ecosystem
**Target Audience:** Hackathon Judges, Municipal Authorities (KMC), Civic Tech Evaluators  
**Recommended Pitch Duration:** 3–5 Minutes | **Deck Length:** 10 Slides

---

## 📌 Slide Overview

| Slide # | Slide Title | Key Objective | Timing |
|---|---|---|---|
| **01** | **Title & Vision** | Introduce NIRA & the Core Value Proposition | 0:00 - 0:25 |
| **02** | **The Crisis: Urban Flooding** | The Kerala Monsoon Challenge & The Broken Feedback Loop | 0:25 - 0:55 |
| **03** | **The Solution: NIRA** | End-to-End AI Civic Drainage Platform | 0:55 - 1:25 |
| **04** | **How It Works (System Pipeline)** | 4-Step Journey from Photo to Resolution | 1:25 - 1:55 |
| **05** | **AI Diagnosis & Priority Engine** | Computer Vision + Deterministic 0–100 Priority Scoring | 1:55 - 2:25 |
| **06** | **Point-in-Polygon Ward GIS** | Zero-Friction Geospatial Matching to Municipal Officers | 2:25 - 2:55 |
| **07** | **Municipal Command Center** | Operational Dashboard, Hotspot Detection & SLA Tracking | 2:55 - 3:25 |
| **08** | **Closed-Loop Verification & Escalation**| Photographic Evidence Proof & Supervisory SLA Escalations | 3:25 - 3:55 |
| **09** | **Tech Stack & Architecture** | Next.js 15, React 19, TypeScript, Leaflet, Supabase | 3:55 - 4:20 |
| **10** | **Impact, Roadmap & Vision** | Scalability, Disaster Mitigation & The Future of Kerala Cities | 4:20 - 4:45 |

---

## Slide 1: Title & Hook

### **NIRA (നിറ) — Autonomous Drainage Intelligence**
*Transforming Kerala's Monsoon Flood Resilience Through AI, Computer Vision & Civic Accountability*

#### **Key Content Points:**
* **What is NIRA?** An end-to-end civic drainage intelligence platform connecting citizens directly with municipal response squads.
* **The Mission:** Prevent urban flash flooding before the downpour turns blocked gutters into paralyzed city corridors.
* **Tagline:** *"From Citizen Snapshot to Municipal Squad Resolution — In Hours, Not Months."*

#### **Visual Recommendation:**
* NIRA elephant logo + side-by-side mockups showing the Citizen Mobile Camera Viewfinder and the Municipal Authority Command Center.

#### **Speaker Script (25s):**
> *"Every monsoon, Kerala's premier cities grind to a halt. Roads turn into canals, traffic stalls, and businesses suffer crores in damages — not because we lack drainage systems, but because clogged storm drains go unnoticed until it's too late. Today, we present NIRA: an AI-driven civic platform that empowers any citizen to snap a drain, auto-routes it to the responsible ward engineer within seconds, and holds authorities accountable through closed-loop photo verification."*

---

## Slide 2: The Crisis

### **Why Do Our Cities Flood Every Monsoon?**

#### **Key Problem Dimensions:**
1. **The Visibility Gap:** Clogged culverts, silt buildup, and plastic chokes are invisible until torrential rains trigger localized overflow.
2. **The "Jurisdiction Maze":** Citizens do not know which ward, junior engineer, or division oversees their specific street drain.
3. **Black Hole Civic Portals:** Traditional municipal hotlines lack tracking, SLA timeframes, or evidence of actual resolution.
4. **Reactive Instead of Predictive:** Crews are dispatched blindly after distress calls, rather than preemptively clearing high-risk arterial clusters.

#### **Visual Recommendation:**
* High-impact infographic: Clogged canal vs. flooded street grid + 3 stat callouts (e.g., 70% of urban flash floods caused by preventable drain choking).

#### **Speaker Script (30s):**
> *"The problem isn't the rain — it's the disconnect. Right now, when a culvert chokes with plastic or silt, a citizen has no easy way to report it without navigating bureaucratic red tape. Even if they call a helpline, that report disappears into an administrative black hole with zero accountability. By the time anyone shows up, the road is already submerged."*

---

## Slide 3: The Solution

### **Introducing NIRA: Closed-Loop Civic Infrastructure**

#### **The 3 Pillars of NIRA:**
* **📸 Frictionless Citizen Reporting:** Instant camera snapshot, zero technical jargon, no signup hurdle.
* **🧠 Autonomous AI Triage:** Computer vision identifies the blockage type and evaluates standing water pooling in real-time.
* **🎯 Deterministic Ward Dispatch:** Point-in-Polygon GIS maps exact coordinates to the responsible local ward squad with strict SLA countdowns.

#### **Core Metric Targets:**
* **< 30 Seconds** to file an end-to-end verified civic report.
* **100% Traceability** with public tracking codes (e.g., `#NIRA-40-7821`).
* **Zero Blind Spots** via real-time spatial hotspot detection.

#### **Visual Recommendation:**
* 3 interconnected pillars diagram: Citizen Smartphone ➔ AI Analysis & GIS ➔ Municipal Rapid Action Crew.

---

## Slide 4: How It Works

### **The 4-Step Incident Lifecycle**

```
 [ 1. Capture Photo ] ──▶ [ 2. Pinpoint GIS ] ──▶ [ 3. AI Triage ] ──▶ [ 4. Verified Fix ]
  Live device camera       Point-in-Polygon        NIRA Score (0-100)     Field squad clears &
  converts to Base64       auto-detects ward       sets 4h-24h SLA        uploads proof photo
```

1. **Step 1: Snap & Load:** Citizen captures a live photo via the in-browser camera or selects a photo.
2. **Step 2: Auto-Ward Boundary:** GPS auto-detects latitude/longitude and maps it to the exact KMC Ward (#24 Vyttila, #35 Kadavanthra, etc.).
3. **Step 3: AI Diagnosis & Priority:** Deep learning classifier detects blockage category, computes 0–100 priority score, and establishes municipal SLA.
4. **Step 4: Dispatch & Closed-Loop Resolution:** Ward squad deploys jetting machines, uploads before/after photo proof, and closes the ticket.

---

## Slide 5: The AI Core

### **Computer Vision & Deterministic Prioritization**

#### **1. Visual Classification Pipeline:**
* Detects issue types: `BLOCKED_STORM_DRAIN`, `SILT_ACCUMULATION`, `BROKEN_CULVERT`, `GARBAGE_DUMPING`, `SEWAGE_OVERFLOW`.
* Gauges surface water pooling risk: `Dry/Low`, `Detected`, `Severe Pooling`, `Submerged Channel`.

#### **2. Transparent NIRA Priority Score (0 to 100):**
* **Base Hazard Weight:** Structural culvert breaks (90+) vs routine trash (45).
* **Corridor Criticality Bonus:** Major arterial routes (SA Road, MG Road) automatically get high priority.
* **Vulnerable Zone Multiplier:** Proximity to schools, hospitals, metro stations, and low-lying coastal feeder lines.
* **No Black Box:** The system outputs an explainable audit trail for municipal engineers.

#### **Visual Recommendation:**
* Visual breakdown badge card: `NIRA Score: 92 (Critical)` with factor breakdown bars (+40 Base, +25 Silt, +15 Arterial Corridor, +12 Flood Risk).

---

## Slide 6: Geospatial Intelligence

### **Point-in-Polygon (PIP) Ward Boundary Engine**

#### **Solving the Jurisdiction Problem:**
* Citizens don't know ward boundaries, but NIRA does.
* Uses **Ray-Casting Point-in-Polygon (PIP)** geometric mathematics in real-time.
* Matches coordinates against official municipal ward boundary polygons.

#### **Instant Operational Output:**
* **Ward Name & Number:** e.g., *Ward #24 — Vyttila Mobility Hub Junction*
* **Responsible Officer:** *K. S. Rajesh (Assistant Engineer Drainage)*
* **Direct Operations Line:** Direct routing to the designated ward squad.
* **Out-of-Bounds Fallback:** Nearest centroid proximity detection with landmark suggestions.

---

## Slide 7: Municipal Command Center

### **Clean, High-Impact Operations Dashboard**

#### **Designed for Fast Municipal Decisions:**
* **4 High-Priority KPI Cards:**
  * `Total Reports` | `Needs Action` | `In Progress` | `Resolved`
* **Real-Time Hotspot Clustering:** Automatically groups ≥3 reports within 200m to signal chronic infrastructure failures.
* **Queue Filter Controls:** 1-click filtering by Ward, Priority Score, or Urgent SLA danger zones.
* **Interactive Diagnostic Side Panel:** Inspect citizen photos, location coordinates, crew dispatch dropdown, and resolution logs.

#### **Visual Recommendation:**
* Clean UI screenshot of the simplified `AuthorityCommandCenter.tsx` showing the 4 stat cards and the Incident Queue.

---

## Slide 8: Accountability & SLA Engine

### **Closing the Loop: Automated Escalation & Photo Proof**

#### **1. Enforceable SLA Windows:**
* Critical/High Hazard: **3–4 Hours**
* Moderate Blockage: **6–8 Hours**
* Routine Maintenance: **24 Hours**

#### **2. Automated Supervisory Escalation:**
* If a ticket exceeds allowable response time without verified crew activity, NIRA triggers a **Level 2 Administrative Intercept**.
* Notifies the **Assistant Executive Engineer (AEE)** directly for intervention.

#### **3. Closed-Loop Photo Proof:**
* Tickets CANNOT be marked resolved with just a checkbox.
* The field squad must upload a **verified clearing photo** showing restored water flow, ensuring genuine civic accountability.

---

## Slide 9: Architecture & Tech Stack

### **Modern, High-Performance, Zero-Downtime Architecture**

* **Frontend & SSR:** Next.js 15 (App Router, Turbopack) + React 19 + TypeScript (Strict Mode).
* **Styling:** Tailwind CSS (Custom "Fund My Crazy" Light Design System — vibrant solid colors, high contrast, clean graphing grid).
* **Mapping & GIS:** Leaflet 1.9 & React-Leaflet with OpenStreetMap layers & custom SVG markers.
* **Camera Pipeline:** HTML5 MediaDevices / WebRTC Canvas streaming with permanent Base64 Data URL encoding (zero broken links).
* **Persistence & Real-Time Sync:** Supabase PostgreSQL with automated browser `localStorage` fallback and cross-tab broadcast events (`storage` + `nira_reports_updated`).

---

## Slide 10: The Road Ahead

### **Impact, Scalability & Vision**

#### **Measurable Civic Impact:**
* **80% Reduction** in drain-to-dispatch response times.
* **Preemptive Desilting:** Identifying chronic hotspots before the monsoon hits peak intensity.
* **Civic Trust Restored:** Citizens see their actual photos, live progress, and verified clearance receipts.

#### **Next Horizons:**
1. **IoT Sensor Integration:** Real-time ultrasound water level probes embedded in major culverts.
2. **WhatsApp Bot Reporting:** Direct photo submissions via WhatsApp webhook for maximum accessibility.
3. **Statewide Expansion:** Scaling from Kochi Corporation to Thiruvananthapuram, Kozhikode, and all 93 municipalities in Kerala.

#### **Closing Punchline:**
> **"NIRA turns every citizen into a municipal sentinel and every drainage squad into a rapid-response unit. Let's make Kerala monsoon-proof."**

---
*© 2026 NIRA Platform — Keralam Municipal Corporation Smart Transit & Civic Infrastructure Ecosystem*
