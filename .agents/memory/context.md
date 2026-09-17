# Anavandi Project Domain & Memory Context

## Background & Etymology
"Anavandi" (അാനവണ്ടി - Elephant Vehicle) is the affectionate Malayalam name for KSRTC buses, named after the iconic two-elephant emblem of Kerala State Road Transport Corporation established in 1937.

## Key Transit Hubs & Corridors
- **Vyttila Mobility Hub (Kochi)**: South India's largest integrated transit hub connecting KSRTC buses, Kochi Metro, and Water Metro.
- **Thampanoor KSRTC Central (Trivandrum)**: Primary capital city depot opposite Railway Station.
- **Mavoor Road KSRTC Bus Stand (Kozhikode)**: Malabar hub connecting Wayanad, Kannur, and Bangalore interstate buses.
- **Munnar & High-Range Scenic Express**: Mountain routes requiring real-time hairpin-turn telemetry and hill speed monitoring.

## Database Tables & Relationships
- `buses` 1----N `schedules`
- `routes` 1----N `schedules`
- `schedules` 1----N `bookings`
- `buses` 1----N `incidents`

## Hackathon Pitch Highlights
1. **Commuter Empowerment**: Transparent real-time arrival estimates (ETA) reduces bus stop wait times.
2. **Civic Safety**: Instant SOS emergency button for women commuters & senior citizens.
3. **Depot Operational Efficiency**: Fleet managers can re-route empty buses during heavy rush hours.

## User Preferences & Workflow Rules
- **Browser & Localhost Testing**: Do NOT open `localhost` URLs or spawn browser subagents automatically. The user will manually test and check the UI on `http://localhost:3000`.

## UI/UX Design Requirements (Fund My Crazy UI)
- **Design Inspiration**: The project UI has been explicitly completely restyled to look exactly like the "Fund My Crazy" hackathon landing page (from a provided screenshot). 
- **Color Palette & Theme**: 
  - **Light Mode Only**: The entire UI is strictly light mode (no dark mode). 
  - **Primary Colors**: Solid Yellow (`#FFCC00`) and Solid Google Blue (`#4285F4`). 
  - **Top Navigation Bar**: Features a thin 4-color Google progress bar (`#4285F4`, `#EA4335`, `#FBBC05`, `#34A853`).
- **Styling Rules**: 
  - **Zero Gradients**: Absolutely NO gradients are permitted on buttons, backgrounds, or icons. Everything must use solid flat colors.
  - **Background**: A light blue-gray (`#E8F0FE`) with a prominent edge-to-edge graphing-paper grid `bg-[linear-gradient(rgba(66,133,244,0.15)_1px,transparent_1px)...]`.
  - **Layout Sections**: Includes side-by-side hero cards (Yellow/Blue) overlapping a white arched bottom section that separates the main hero from the lower content.
