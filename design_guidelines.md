# Design Guidelines: Mobile-First Learning Platform

## Design Approach
**Reference-Based Approach**: Drawing from Khan Academy and Coursera's clean educational interfaces with dashboard-style layouts optimized for learning content delivery.

## Core Design Elements

### Typography
**Font Families**: Inter (primary UI) and Source Sans Pro (content/body text) via Google Fonts
- **Headings**: Inter Bold (text-2xl to text-4xl for page titles, text-xl for section headers)
- **Body Text**: Source Sans Pro Regular (text-base for content, text-sm for metadata)
- **UI Elements**: Inter Medium (text-sm for buttons, labels, navigation)
- **Hierarchy**: Clear distinction between content headings, UI labels, and body text

### Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (e.g., p-4, gap-6, mb-8)
- **Container**: max-w-7xl with px-4 (mobile) to px-8 (desktop)
- **Card Spacing**: p-4 to p-6 internal padding
- **Section Gaps**: space-y-6 to space-y-8 for vertical rhythm
- **Grid System**: grid-cols-1 (mobile) → grid-cols-2 (tablet) → grid-cols-3 (desktop)

### Component Library

**Navigation**
- Top navigation bar with logo, search, user menu (sticky on scroll)
- Horizontal tab navigation for learning modes (Skill/School/Task)
- Mobile: Hamburger menu with slide-out drawer
- Breadcrumb navigation for topic hierarchy

**Cards (Primary Pattern)**
- Topic cards with image thumbnail, title, description, progress indicator
- Rounded corners (rounded-lg), subtle shadow (shadow-md)
- Hover state: slight elevation increase (shadow-lg), smooth transition
- Touch-friendly: minimum 44px tap targets

**Forms & Inputs**
- Full-width inputs on mobile, constrained max-width on desktop
- Clear labels above fields, validation messages below
- Primary button style: solid background with medium font weight
- Secondary button: outlined style with transparent background

**Dashboard Elements**
- Stats cards showing progress metrics (completion rate, streak count)
- Topic grid with filter sidebar (collapsible on mobile)
- Admin table view with inline editing and action buttons

**Search & Filtering**
- Prominent search bar with instant results
- Filter chips for mode selection (pill-shaped, toggleable)
- Sort dropdown (mobile-friendly bottom sheet on small screens)

### Responsive Patterns
- **Mobile (< 768px)**: Single column, bottom navigation for key actions, collapsible filters
- **Tablet (768px - 1024px)**: Two-column grid, side navigation visible
- **Desktop (> 1024px)**: Three-column grid, persistent sidebar, expanded dashboard

### Interactions
**Minimal Animations**: 
- Smooth transitions for navigation (200-300ms)
- Card hover effects (transform and shadow)
- Loading states: subtle skeleton screens for content
- NO elaborate scroll animations or page transitions

### Images
**Topic Thumbnails**: 
- Aspect ratio 16:9 for topic cards
- Placeholder illustrations for topics without custom images
- Category-based default imagery (math, science, language)

**No Hero Section**: This is a functional learning platform, not a marketing site. Lead with user dashboard or topic discovery interface immediately.

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support throughout
- Focus indicators on all focusable elements
- Sufficient color contrast (WCAG AA minimum)
- Form validation with clear error messaging