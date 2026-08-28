# FitSnap Architecture & Technical Foundation

## Roles & Philosophy
- **Coach**: The primary paying customer. Uses a dense, data-rich desktop-optimized interface to manage clients, templates, and analytics.
- **Client**: The end-user. Uses a mobile-first, simplified interface focused on logging, viewing plans, and communicating.

## Foundation Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database ORM**: Prisma (v5.22.0 due to stack compatibility)
- **Database**: PostgreSQL

## Client Data Isolation
All client data is strictly scoped. Coaches can only access data for clients actively assigned to them. Clients can only access their own data.

**The `CoachClientConnection` Entity**
This is the foundational gatekeeper for all coach-client data access. It maps a Coach User to a Client User (or a pending invited email). A client may only have at most ONE active connection at a time. All subsequent client-owned resources will check this connection to determine a coach's read/write access.

**Open Product Decision: Historical Data Access on Reconnection**
When a client connects to a *new* coach after a prior connection ends, they currently grant the new coach access to their **full historical data** (past check-ins, macros, photos). For this phase, we proceed with the "full history" default, but this should be revisited with product/legal input before Block 10 (when real client data comes into play).

**Open Product Decision: Nutrition Targets Out of Scope for Client Onboarding**
Nutrition targets (calories, macros, water) are intentionally omitted from client self-onboarding. The product spec designates this as a coach responsibility. This creates a known dependency: the future Client Dashboard (Block 8) and Nutrition Dashboard (Block 13) will need coach-configured targets. This gap must be resolved when building Block 9 (Coach Dashboard) or Block 13.

**Open Product Decision: Baseline Starting Weight vs Tracking**
The `currentWeight` captured during onboarding is a baseline starting weight. It serves as the seed value for the future Weight Tracking system (Block 18). Block 18 must treat this as the first historical data point, not ignore it.

**Design Decision: Preferred Weight Unit**
The `preferredWeightUnit` (kg/lb) captured on the client profile acts as the global standing convention for all future weight-based features.

## Definition of Done (DoD)
- Code compiles without TypeScript errors.
- ESLint passes.
- Responsive design works on mobile (375px) and desktop (1024px+).
- Components use design tokens (no hardcoded colors/spacing).
- Database changes include necessary Prisma migrations.

## Block 2: Visual Design System & UI Components

### Design Tokens
We use Tailwind v4 CSS variables (`@theme` in `globals.css`) for the single source of truth.
- **Colors**: Primary (Teal), Secondary (Slate), semantic states (Success, Warning, Error, Info), specific Macro colors (Calories, Protein, Carbs, Fat, Water), and Neutral scale.
- **Typography**: Inter (or system sans-serif), with a defined scale from Display down to Caption.
- **Spacing/Radius**: 4px baseline grid, defined radius variables.

### Component Inventory (`src/components/ui/`)
Built with React, Tailwind CSS, `clsx`, `tailwind-merge`, and `lucide-react`.
- **Atoms**: `Button`, `Badge`, `Avatar`, `Label`, `Spinner`, `Skeleton`.
- **Inputs**: `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`.
- **Molecules**: `Card` (Header, Title, Description, Content, Footer), `Alert`, `Toast`, `Progress` (Bar, Ring), `Tooltip`, `EmptyState`.
- **Organisms**: `Tabs` (List, Trigger, Content), `DataTable` (responsive: desktop table, mobile stacked cards), `Modal`.
- **Layouts (`src/components/layout/`)**: 
  - `CoachLayout`: Desktop-optimized sidebar navigation.
  - `ClientLayout`: Mobile-first sticky top and bottom navigation.
