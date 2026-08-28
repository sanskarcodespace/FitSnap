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
