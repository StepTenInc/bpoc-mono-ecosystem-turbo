# BPOC.IO Style Guide & Modernization Proposal

This document outlines the styling system for BPOC.IO, based on the current homepage design. It preserves the existing color identity while proposing modern UI/UX enhancements to elevate the "Cyber/Tech" aesthetic.

## 1. Core Color Palette

We retain the vibrant "Neon/Cyber" color scheme against a deep dark background.

### Primary Colors
| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| **Cyber Blue** | `#0EA5E9` | `text-cyber-blue` / `bg-sky-500` | Primary actions, links, tech highlights |
| **Electric Purple** | `#A855F7` | `text-electric-purple` / `bg-purple-500` | Creative accents, AI features, secondary actions |
| **Neon Green** | `#10B981` | `text-neon-green` / `bg-emerald-500` | Success states, "Growth" or "Money" related metrics |
| **BPOC Red** | `#EF4444` | `text-bpoc-red` / `bg-red-500` | Alerts, "Traditional Job Sites" (negative comparison), high urgency |

### Backgrounds & Surfaces
*   **Base Background**: `#0B0B0D` (Darker than slate-950, almost black).
*   **Surface (Card)**: `rgba(255, 255, 255, 0.03)` to `rgba(255, 255, 255, 0.05)`.
*   **Border**: `rgba(255, 255, 255, 0.1)`.

### Gradients
Modern usage involves mixing these colors for text and borders.
*   **Main Gradient**: `bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400`
*   **Dark Mesh**: `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`

## 2. Typography

**Font Family**: `Geist Sans` (or system-ui fallback).

### Hierarchy
*   **Hero Heading**: `text-5xl` to `text-7xl`, Font Weight: `800`, Tracking: `-0.02em`.
*   **Section Heading**: `text-3xl` to `text-4xl`, Font Weight: `700`.
*   **Body Text**: `text-gray-300` or `text-gray-400`. Avoid pure white for long text to reduce eye strain.
*   **Labels/Data**: *Recommendation:* Use a Monospace font (e.g., `Geist Mono` or `JetBrains Mono`) for stats, numbers, or "code-like" elements to enhance the cyber feel.

## 3. UI Components (Modernized)

### Glass Cards ("The Glassmorphism 2.0")
Instead of simple transparency, use a layered approach for depth.

```tsx
// Recommended Component Structure
<div className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:shadow-cyan-500/20">
  {/* Inner Glow Gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  
  {/* Content */}
  <div className="relative z-10 p-6">
    {children}
  </div>
</div>
```

### Buttons

**Primary (Gradient Glow)**
```tsx
<Button className="relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/40">
  <span className="relative z-10">Get Started</span>
  {/* Shimmer Effect Overlay */}
  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
</Button>
```

**Secondary (Glass)**
```tsx
<Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-md">
  Learn More
</Button>
```

## 4. Effects & Animations

### "Breathing" Glows
Use subtle pulsing shadows rather than rapid flashes.
*   **Class**: `animate-pulse-slow` (Custom animation: 3s duration).

### Hover Micro-interactions
*   **Lift**: `hover:-translate-y-1`
*   **Scale**: `hover:scale-[1.02]` (Keep it subtle, 1.05 can be too jumpy for large cards).
*   **Border Shine**: animate the border color on hover from `border-white/10` to `border-cyan-400/50`.

### Background Ambience
Use **Orbs** instead of flat colors.
*   Place large, blurred divs (`w-96 h-96 blur-[120px]`) with low opacity (`opacity-20`) behind sections to create "pools" of color (Cyan, Purple, Green) that blend together.

## 5. Layout & Structure

### Bento Grids
For feature lists or dashboards, use a "Bento Box" grid layout. This is very modern and fits the tech aesthetic.

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="md:col-span-2 bg-card ...">Main Feature</div>
  <div className="bg-card ...">Stat 1</div>
  <div className="bg-card ...">Stat 2</div>
  <div className="md:col-span-3 bg-card ...">Wide Banner</div>
</div>
```

### Section Spacing
*   **Standard Padding**: `py-20` or `py-24` for major sections.
*   **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

## 6. Code Implementation Guide (Copy-Paste Ready)

### Tailwind Config Additions
Ensure these exist in your `tailwind.config.ts`:

```typescript
extend: {
  colors: {
    'cyber-blue': '#0ea5e9',
    'electric-purple': '#a855f7',
    'neon-green': '#10b981',
  },
  backgroundImage: {
    'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
    'cyber-grid': "url('/images/grid-pattern.svg')", // Optional
  },
  boxShadow: {
    'neon-blue': '0 0 20px -5px rgba(14, 165, 233, 0.5)',
    'neon-purple': '0 0 20px -5px rgba(168, 85, 247, 0.5)',
  }
}
```

### Global CSS Utility
Add to `globals.css` for cleaner HTML:

```css
@layer components {
  .modern-glass {
    @apply bg-white/5 backdrop-blur-md border border-white/10 shadow-xl;
  }
  
  .text-glow {
    text-shadow: 0 0 20px rgba(14, 165, 233, 0.5);
  }
}
```

