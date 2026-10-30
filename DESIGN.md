# DESIGN.md — ACE Parent Mobile Portal

## Stitch Design Reference
> Design created via Google Stitch AI (https://stitch.withgoogle.com)
> Inherits deep-space dark aesthetic from ace-web admin panel.

## Overview
Cross-platform parent companion mobile application for the ACE School ERP system. Built with Vite + React + Tailwind CSS v4 + Framer Motion. Connects to the same Cloud Firestore database as the ace-web admin panel for real-time bidirectional data sync.

## Design System

### Color Palette — Deep Space Dark with Neon Accents

| Token | Hex | Usage |
|-------|-----|-------|
| `void` | `#050A12` | Deepest background |
| `abyss` | `#070B14` | Primary background |
| `deep` | `#0A0F1E` | Secondary background |
| `surface` | `#0F1628` | Input backgrounds |
| `card` | `#131B30` | Card backgrounds |
| `card-elevated` | `#182240` | Elevated glassmorphic cards |
| `border` | `#1E2A4A` | Standard borders |
| `neon-purple` | `#A855F7` | Primary accent, CTAs |
| `neon-cyan` | `#06D6E0` | Secondary accent, links |
| `neon-green` | `#22C55E` | Success, PASS status |
| `neon-red` | `#EF4444` | Danger, FAIL status |
| `neon-amber` | `#F59E0B` | Warnings, notices |

### Typography
- **Display/Headings**: Inter Bold 700–900
- **Body**: Inter Regular/Medium 400–500
- **Monospace** (SATS IDs, scores, receipts): JetBrains Mono

### Animation Layer
- 60 FPS fluid rendering via Framer Motion
- Hardware-accelerated transforms only (translate, scale, opacity)
- Physics-based spring transitions for tab switching
- Staggered entrance animations for lists
- Gesture-driven swipe navigation between tabs
- Shimmer loading states with gradient animation

## Page Architecture

```
/parent/login     → LoginGateway (SATS ID character slot entry)
/parent/dashboard → Dashboard (Bottom tab navigation)
  ├── 📊 Academics Tab  → AcademicsPanel
  ├── 💰 Finances Tab   → FinancesPanel
  └── 🚨 Notices Tab    → NoticesPanel
  └── 🚌 Logistics Bar  → Sticky transit widget (always visible)
```

## Data Model (synced with ace-web Firestore)

### Student Document: `/students/{satsId}`
```json
{
  "name": "JOHN DOE",
  "satsId": "ABC12345",
  "class": "10th Class",
  "section": "Section A",
  "assignedBusNumber": "Bus-101",
  "gender": "Male",
  "status": "active",
  "totalAllocated": 50000,
  "totalPaid": 25000,
  "fees": { "totalAllocated": 50000, "totalPaid": 25000 },
  "marks": {
    "midterm": {
      "subjects": {
        "math": { "initialScore": 85, "maxMarks": 100, "minPassing": 35 }
      }
    }
  }
}
```

### Receipts Sub-Collection: `/students/{satsId}/receipts/{receiptId}`
### Events Collection: `/events/{eventId}` (filtered by class + section)
### Buses Collection: `/buses/{busId}`

## Real-Time Sync & Authentication Architecture
- **Anonymous Authentication Handshake**: Leverages Firebase Anonymous Auth via `signInAnonymously(auth)` directly inside the SATS ID verification handshake (`LoginGateway.jsx`). This silently authenticates the device before Firestore reads are executed, satisfying strict `request.auth != null` security policies.
- **Real-Time Data Streams**: All secondary data panels (Academics, Finances, Notices, Logistics) listen dynamically via `onSnapshot` subscriptions.
- **Local Hydration**: Local storage hooks (`useLocalCache.js`) store credentials and profile state for instantaneous boot times.
- **Session Lifecycles**: All authenticated sessions and listeners are automatically torn down and local memory cache is purged completely upon signing out.

## Desktop Chassis & Responsive Mockup
- **Desktop Chassis Framework**: The root viewport wrapper wraps all subviews into a centered, sleek `393px` width by `852px` height iPhone-like layout canvas.
- **Premium Smartphone Styling**: Styled with a solid `sm:border-slate-800` border, `rounded-[40px]` corners, an electric purple outer neon aura shadow (`sm:shadow-[0_0_100px_rgba(168,85,247,0.35)]`), and a pill-shaped simulated Dynamic Island camera notch at the top.
- **Native Full-Screen Breakpoint**: Utilizing Tailwind CSS `sm:` media breakpoints, all surrounding desktop margins, borders, shadows, and fake notch overlays disappear completely on mobile physical smartphone screens (width < 640px) to render 100% full-screen for an immersive native feel.

## Stitch Sync Process
1. Design UI mockups in Stitch MCP.
2. Export the design JSON and commit to the repository.
3. Update this `DESIGN.md` with any structural changes.
4. The CI pipeline validates the design consistency before each deployment.

---
*Generated to satisfy the user-global rule for always using Stitch.*
