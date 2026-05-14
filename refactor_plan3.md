# Phase 3 Refactoring: Next.js Best Practices & Frontend Modernization

## 1. Architectural Issues Identified
Currently, `c:\dev\siapgrek\frontend` violates core Next.js App Router principles:
- **SPA Anti-Pattern:** The entire application is built as a Single Page Application (SPA) inside `app/page.tsx`. It uses a massive conditional switch statement (`renderContent`) and React state (`activeMenu`) to navigate between components like Dashboard, Penyakit, and Chat. 
- **Overuse of `'use client'`:** The root `page.tsx` is marked with `'use client'`, forcing the entire application tree (including Navbar and Sidebar) to be rendered on the client, eliminating the performance benefits of React Server Components (RSCs).
- **Poor Layout Structure:** Shared UI elements like Navbar and Sidebar are manually included in the page rather than utilizing the native `app/layout.tsx` nested routing functionality.

## 2. Refactoring Plan

### Step 2.1: Implement Native File-System Routing
Migrate the `activeMenu` switch statement into proper Next.js route segments:
- `app/(dashboard)/page.tsx` -> Dashboard Home
- `app/(dashboard)/penyakit/page.tsx` -> Penyakit Screen
- `app/(dashboard)/log/page.tsx` -> Log Aktivitas
- `app/(dashboard)/grafik/page.tsx` -> Grafik Tanaman
- `app/(dashboard)/chat/page.tsx` -> Chat
- `app/(dashboard)/profile/page.tsx` -> Profile & Settings

### Step 2.2: Nested Layouts & Server Components
- Move `Navbar` and `Sidebar` into an `app/(dashboard)/layout.tsx` Server Component.
- This ensures the navigation shell is server-rendered, non-blocking, and persists state correctly across page navigations without re-mounting.
- Convert navigation links to use Next.js `<Link href="...">` instead of `setActiveMenu(...)`.

### Step 2.3: Upgrade Dependencies
- Upgrade `next`, `react`, `react-dom` to the latest stable minor/patch versions.
- Upgrade UI component libraries (Tailwind, Radix UI, Shadcn, Recharts, Lucide).
- Execute `bun update` across the frontend workspace.

### Step 2.4: RSC Boundaries & Data Fetching
- Identify components that do not need browser APIs and strip `'use client'` from them.
- Keep `'use client'` only on interactive leaf nodes (like charts or forms).
- Refactor the current `useSearchParams` hook usage which forces client-side bailouts, migrating towards server-side search params or localized client components where necessary.

## 3. Execution
After this plan is approved, I will begin dismantling the SPA structure in `page.tsx` and migrating the `app/Menu/*` files into dedicated route segments.
