# Email Management Application - Design Guidelines

## Design Approach

**Selected Approach:** Design System with Productivity Focus

**Reference Inspiration:** Linear's clean minimalism + Gmail's familiar email patterns + Notion's data organization

**Core Principles:**
- Clarity over decoration - every element serves a purpose
- Information density balanced with breathing room
- Consistent, predictable interactions
- Professional appearance suitable for daily productivity use

---

## Color Palette

### Light Mode
- **Primary Brand:** 239 84% 67% (vibrant blue for CTAs, active states)
- **Primary Muted:** 239 60% 92% (backgrounds, hover states)
- **Neutral Background:** 0 0% 100% (main background)
- **Neutral Surface:** 0 0% 98% (card backgrounds, panels)
- **Neutral Border:** 0 0% 90% (dividers, input borders)
- **Text Primary:** 0 0% 9% (headings, body text)
- **Text Secondary:** 0 0% 45% (metadata, timestamps)

### Dark Mode
- **Primary Brand:** 239 84% 67% (same vibrant blue)
- **Primary Muted:** 239 50% 20% (dark backgrounds with blue tint)
- **Neutral Background:** 0 0% 7% (main background)
- **Neutral Surface:** 0 0% 10% (card backgrounds, panels)
- **Neutral Border:** 0 0% 20% (dividers, input borders)
- **Text Primary:** 0 0% 95% (headings, body text)
- **Text Secondary:** 0 0% 60% (metadata, timestamps)

### Semantic Colors
- **Success:** 142 71% 45% (connected accounts, sync status)
- **Warning:** 38 92% 50% (pending actions, expiring tokens)
- **Error:** 0 72% 51% (sync failures, validation errors)
- **Info:** 199 89% 48% (AI classification indicators)

### Label Colors (User-Assignable)
Provide 12 preset colors: Blue, Green, Yellow, Red, Purple, Pink, Orange, Teal, Indigo, Cyan, Lime, Rose (all in HSL with 70% saturation, 60% lightness)

---

## Typography

### Font Families
- **Primary:** Inter (Google Fonts) - for all UI text, clean and readable
- **Monospace:** 'JetBrains Mono' (Google Fonts) - for email addresses, timestamps

### Type Scale
- **Display (h1):** text-3xl (30px), font-semibold, tracking-tight
- **Heading (h2):** text-xl (20px), font-semibold
- **Subheading (h3):** text-lg (18px), font-medium
- **Body:** text-base (16px), font-normal
- **Small:** text-sm (14px), font-normal
- **Caption:** text-xs (12px), font-normal, text-secondary

---

## Layout System

### Spacing Primitives
Consistently use Tailwind units: **2, 3, 4, 6, 8, 12, 16** for all spacing
- Tight spacing: p-2, gap-2 (8px)
- Standard spacing: p-4, gap-4 (16px)
- Section spacing: p-6, gap-6 (24px)
- Large spacing: p-8, gap-8 (32px)

### Container Widths
- **Sidebar Navigation:** w-64 (256px) fixed width
- **Email List Panel:** w-96 (384px) fixed width in split view
- **Main Content Area:** flex-1 with max-w-4xl centered
- **Modals/Dialogs:** max-w-lg (512px) for forms, max-w-3xl for email detail

### Grid Patterns
- **Dashboard Stats:** grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- **Label Grid:** grid-cols-2 md:grid-cols-3 gap-3
- **Workflow Cards:** grid-cols-1 lg:grid-cols-2 gap-4

---

## Component Library

### Navigation
**Left Sidebar:** Fixed position with stacked navigation items
- Logo/App name at top (h-16 flex items-center)
- Navigation links with icons (h-10 rounded-lg hover states)
- Account switcher at bottom
- Active state: primary background with white text

**Top Bar:** Horizontal bar with search and user menu
- Height h-16, border-b, neutral surface background
- Search input with icon (w-96 max-width)
- User avatar and dropdown on right

### Email List
**List Item Structure:**
- Compact row: h-20, border-b, hover:bg-surface
- Sender name (font-medium, truncate)
- Subject line (text-sm, truncate)
- Preview text (text-xs, text-secondary, line-clamp-1)
- Timestamp (text-xs, text-secondary, absolute top-2 right-4)
- Label badges (flex gap-1, small rounded pills)
- Unread indicator: blue dot or bold text

**Multi-Select Mode:**
- Checkboxes appear on hover/selection
- Batch action bar slides in at top with count and actions

### Email Detail View
**Header Section:**
- Sender avatar (w-10 h-10 rounded-full)
- Sender name and email (stacked, text-sm)
- Subject as h2
- Timestamp and label badges below
- Action buttons: Reply, Forward, Archive, Delete (icon buttons)

**Body Section:**
- White/dark card with p-6
- Full email body with preserved formatting
- Clear typography hierarchy

### Labels
**Label Badge:** Inline pill with label color as background
- px-2 py-1, rounded-full
- text-xs, font-medium
- 30% opacity background with full opacity text

**Label Manager:**
- Grid of label cards showing name, color dot, email count
- Click to filter, right-click for edit/delete
- Create button opens modal with color picker

### Workflows
**Workflow Card:**
- Border, rounded-lg, p-4
- Workflow name (font-medium)
- Frequency badge (text-xs in neutral badge)
- Active/Inactive toggle
- Last run timestamp
- "View Summaries" link

**Workflow Form:**
- Multi-step or single form
- Label selector (checkbox group)
- Date range picker
- Custom prompt textarea (min-h-32)
- Frequency radio buttons

### Dashboard
**Stats Cards:**
- Rounded-lg, border, p-4
- Large number (text-2xl, font-bold)
- Label below (text-sm, text-secondary)
- Icon in top-right corner (text-primary)

**Account Connection Cards:**
- Email provider logo
- Connected email address
- Last sync timestamp
- Sync status badge
- "Reconnect" button if expired

### Forms & Inputs
**Text Input:**
- h-10, rounded-md, border
- px-3, focus ring with primary color
- Placeholder text-secondary

**Button Primary:**
- bg-primary, text-white, h-10, px-4, rounded-md
- hover: slightly darker, active: pressed state
- font-medium

**Button Secondary:**
- border, text-primary, h-10, px-4, rounded-md
- hover: bg-surface

**Dropdown/Select:**
- Matches input styling
- Options list with hover states

### Modals & Dialogs
- Backdrop: bg-black/50
- Modal: rounded-lg, max-w-lg, p-6
- Header with title and close button
- Content area with form or message
- Footer with action buttons (right-aligned)

### Loading States
- Skeleton loaders for email list items (animated pulse)
- Spinner icon for inline loading (AI classification)
- Progress bar for initial email sync

---

## Animations

**Minimal Motion Philosophy** - Only essential animations:
- Navigation transitions: none (instant)
- Modal entry: subtle fade-in (150ms)
- Dropdown menus: slide-down (100ms)
- Hover states: smooth color transitions (150ms)
- Loading spinners: CSS rotation
- NO scroll animations, parallax, or decorative motion

---

## Page-Specific Layouts

### Login/Auth Page
- Centered card (max-w-md)
- App logo and name
- "Connect Gmail" button (primary, with Google icon)
- "Connect Outlook" button (secondary, with Microsoft icon)
- Simple, clean, no hero imagery

### Dashboard
- Two-column layout: Stats grid on left (2/3 width), Connected accounts on right (1/3)
- Recent activity list below stats
- Quick actions: "Create Workflow", "Manage Labels"

### Inbox View
- Three-column layout: Sidebar (fixed) | Email list (w-96) | Email detail (flex-1)
- Collapsible email list on mobile (stacks vertically)
- Filters and search above email list

### Workflows Page
- Grid of workflow cards
- "Create Workflow" button prominent at top
- Each card shows execution history preview

### Labels Page
- Grid of label cards with usage stats
- Create/Edit modal for label management
- Color picker with preset palette

---

## Responsive Behavior

- **Desktop (lg+):** Full three-column layout for inbox
- **Tablet (md):** Two-column, collapsible sidebar
- **Mobile (base):** Single column, hamburger menu, stacked views

---

## Images

No hero images or decorative photography. This is a utility application focused on email productivity. Use:
- Provider logos (Gmail, Outlook) in connection cards
- User avatars in email senders
- Icons throughout for visual hierarchy (Heroicons library)