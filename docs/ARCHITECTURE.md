# NIRA Technical Architecture & Data Flow

NIRA (**Neighborhood Intelligence & Response Assistant**) is designed as a resilient, high-speed civic response platform.

## 🏗️ System Components

```
[ Citizen Web UI (Mobile / Desktop) ]
                │
                ├─► 1. Camera / File Upload ──► Supabase Storage ('storage' bucket)
                │                                      │
                ├─► 2. Issue Classifier & Geolocation ◄┘
                │       (Severity, Category, Ward Mapper)
                │
                ├─► 3. AI Priority Calculation Engine
                │       Score = BaseSeverity + RoadMultiplier + RepeatClusterBonus
                │
                └─► 4. Ticket Creation ──► Supabase PostgreSQL (`drainage_reports`)
                                                  │
                                                  ▼
                                    [ Municipal Command Center ]
                                                  │
                                                  ├─► Assign Rapid Action Crew
                                                  ├─► Mark Resolved (Sync to Public Map)
                                                  └─► Escalate Stalled Reports
```

## 🧠 AI Priority Scoring Formula

The priority score ranges from `0` to `100` and is evaluated as:

$$Score = S_{base} + R_{road} + H_{cluster}$$

Where:
- **Base Severity ($S_{base}$)**:
  - Critical Blockage / Flooding: 50 pts
  - Moderate / Heavy Trash Accumulation: 35 pts
  - Mild Sediment / Stagnation: 20 pts
- **Road & Traffic Impact ($R_{road}$)**:
  - Arterial / National Highway / Metro Corridor: +30 pts
  - Commercial Market / Collector Road: +20 pts
  - Residential Lane: +10 pts
- **Cluster & Hotspot Density ($H_{cluster}$)**:
  - $\ge 3$ reports within 200m in the last 72 hours: +20 pts

## 🗄️ Database Schema
- **`drainage_reports`**: Stores all incident telemetry, image URLs, GPS coordinates, assigned wards, and lifecycle states (`submitted` -> `assigned` -> `in_progress` -> `resolved` -> `escalated`).
- **`hotspot_clusters`**: Aggregates spatial clusters identifying recurrent urban waterlogging bottlenecks in Kochi.
