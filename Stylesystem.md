Got it. You are right: the current app screams “purple AI template.” We are going to strip all of that out and align it to the neon‑lime / dark‑glass Tier 4 system so the org chart, tasks, files, and settings all feel like one $500k front‑end.

I will do three things:

1. Translate your existing CSS into the new design system.
2. Flag anything that feels low‑tier and fix it.
3. Give you paste‑ready code and instructions for your other AI.

You can literally copy + paste each block into the correct file.

---

## 1. High level design changes

**What we are changing**

* Global background: dark neutral black instead of blue slate.
* Accent: neon lime instead of purple.
* Cards, org nodes, task columns, panels: unified glassmorphism.
* React Flow canvas and controls: black glass + lime highlights.
* Badges and “status pills”: use brand accent, not Tailwind purple.
* Remove all references to `orb-purple` as “purple” - keep the variable name if you want, but the color becomes lime.

**What looked low‑tier**

* Hard‑coded purple gradients and glows everywhere.
* Body `overflow: hidden` (breaks scrolling on complex pages).
* Some one‑off colors instead of tokens.

All of that gets cleaned up below.

---

## 2. New `globals.css` (paste over the existing file)

> Tell your other AI: “Replace the contents of `src/app/globals.css` with this.”

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

/* Tailwind design tokens */
@theme {
  --font-family-sans: 'Inter', system-ui, sans-serif;

  /* Brand tokens - legacy name kept for compatibility */
  --color-orb-purple: #C4F82A; /* Neon lime accent */
}

/* Global design tokens */
:root {
  /* Brand accent (legacy names kept so existing classes still work) */
  --orb-purple: #C4F82A; /* primary accent */
  --orb-glow: rgba(196, 248, 42, 0.30); /* global glow */

  /* Neutrals */
  --color-bg-primary: #050505;
  --color-bg-elevated: rgba(255, 255, 255, 0.04);
  --color-surface: rgba(255, 255, 255, 0.06);
  --color-surface-strong: rgba(255, 255, 255, 0.10);
  --color-border-subtle: rgba(255, 255, 255, 0.12);
  --color-border-strong: rgba(255, 255, 255, 0.16);

  /* Text */
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #9CA3AF;

  /* Status colors */
  --color-warning: #FACC15;
  --color-danger: #EF4444;
  --color-success: #22C55E;
}

/* Base reset */
* {
  box-sizing: border-box;
}

/* Layout */
html,
body {
  max-width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

/* Premium scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.25);
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.7);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(196, 248, 42, 0.85); /* brand accent */
}

/* Global glow - used for key elements */
.orb-glow {
  box-shadow: 0 0 24px var(--orb-glow);
}

/* Admin glow - keep golden for special roles */
.admin-glow {
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
}

/* Unconnected node glow - subtle warning orange */
.unconnected-glow {
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
}

/* Glassmorphic surfaces */
.glass-card {
  background: var(--color-surface);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.6),
    0 0 24px rgba(196, 248, 42, 0.10);
}

/* Headers / top bars */
.glass-header {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
}

/* Accent gradient halo - used sparingly behind hero elements */
.gradient-orb {
  background:
    radial-gradient(circle at top left, rgba(196, 248, 42, 0.18), transparent 55%),
    radial-gradient(circle at bottom right, rgba(148, 163, 184, 0.35), transparent 60%);
}

/* Background gradient for full pages */
.gradient-bg {
  background:
    radial-gradient(circle at top, rgba(15, 23, 42, 0.75), transparent 60%),
    radial-gradient(circle at bottom, rgba(15, 23, 42, 0.75), transparent 55%),
    #050505;
}

/* React Flow canvas - org chart scene */
.react-flow__background {
  background-color: var(--color-bg-primary);
}

.react-flow__minimap {
  background-color: #020617;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.react-flow__controls {
  background-color: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.45);
}

.react-flow__controls button {
  background-color: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
  color: #E5E7EB;
}

.react-flow__controls button:hover {
  background-color: rgba(196, 248, 42, 0.14);
  color: #FEFCE8;
}

/* You can add a node specific class if you want extra polish */
.org-node-card {
  background: var(--color-surface);
  border-radius: 24px;
  border: 1px solid var(--color-border-subtle);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 18px rgba(196, 248, 42, 0.12);
}
```

Key points:

* Purple is gone. The variables named `orb` now hold neon lime and black.
* React Flow canvas uses black and neutral slate, not blue plus purple.
* Cards and headers are unified and feel expensive.

---

## 3. New `Card.tsx` (subtle premium tweak)

Your Card is already close. We just give it the Tier 4 glow and tune padding.

> Tell your other AI: “Replace `src/components/ui/Card.tsx` with this.”

```ts
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div
      className={[
        // Shape
        'rounded-3xl border',
        // Surface
        'border-white/10 bg-white/5 backdrop-blur-2xl',
        // Depth
        'shadow-[0_18px_45px_rgba(0,0,0,0.7)] shadow-[0_0_22px_rgba(196,248,42,0.18)]',
        // Spacing
        'p-8',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
```

This gives every card a subtle lime halo rather than the noisy purple glow.

---

## 4. New `Badge.tsx` (remove Tailwind purple)

> Tell your other AI: “Replace `src/components/ui/Badge.tsx` with this.”

```ts
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'destructive' | 'warning' | 'success'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-full tracking-wide'

  const variants = {
    default: 'bg-[var(--orb-purple)] text-slate-950', // neon lime pill
    destructive: 'bg-red-500 text-white',
    warning: 'bg-yellow-400 text-slate-950',
    success: 'bg-emerald-500 text-slate-950',
  }

  const sizes = {
    sm: 'h-4 px-2 text-[10px]',
    md: 'h-5 px-2.5 text-xs',
  }

  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
```

All purple class names are gone. Default badges now match the neon accent.

---

## 5. Updated `tailwind.config.js` (add brand tokens)

Right now your Tailwind config is bare. Let’s add `brand` colors so future components do not fall back to random Tailwind purples.

> Tell your other AI: “Replace `tailwind.config.js` with this.”

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#050505',
          surface: 'rgba(255,255,255,0.06)',
          accent: '#C4F82A',
          accentSoft: '#DCFBAA',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'brand-soft':
          '0 18px 45px rgba(0,0,0,0.7), 0 0 22px rgba(196,248,42,0.18)',
      },
    },
  },
  plugins: [],
}
```

Now you can use classes like `bg-brand-bg`, `bg-brand-surface`, `text-brand-accent` if you or the AI add new components.

---

## 6. Instructions for cleaning up the rest of the project

Tell your other AI to run these steps on the codebase:

1. **Search for `purple` in all files.**

   * Replace Tailwind classes:

     * `bg-purple-500`, `text-purple-400`, `border-purple-500`, etc.
   * With:

     * `bg-[var(--orb-purple)]` for accents that should be lime.
     * Or `text-brand-accent` / `border-brand-accent` where using Tailwind.

2. **Update any leftover gradients.**

   * Replace any gradient that includes purple hex values, `#8b5cf6`, `#a855f7`, `#7c3aed`.
   * Use the `gradient-orb` or `gradient-bg` classes instead of hardcoded gradients.

3. **Org chart specific polish.**

   * For org nodes, apply both:

     * `className="glass-card org-node-card"` or similar.
   * For the selected node:

     * Add `ring-2 ring-[var(--orb-purple)] ring-offset-2 ring-offset-black`.

4. **React Flow edges and handles.**

   * If you have custom edge styles, ensure stroke colors line up with the design:

     * Default edges: `stroke="rgba(148,163,184,0.6)"`.
     * Highlighted edges (hover or selected): `stroke="rgba(196,248,42,0.65)"`.

5. **Panels on the right side (AI Copilot).**

   * Wrap them in `<Card>` or apply `glass-card` to get the same premium glass look.

---

## 7. What you end up with

After these changes:

* Zero purple anywhere in the app.
* A consistent neon‑lime on black, high‑end cockpit aesthetic, aligned with your SuperBMC UI.
* Org chart nodes that look like part of a serious Operational Intelligence system, not a random SaaS template.
* A design system that can be reused across the rest of Tier 4 without re‑thinking the visual language.

If you want, next step I can write a **single prompt** you paste into Lovable/v0.dev that tells it:

* “Here is the design system.
* Redo the Org Chart, Tasks, Files, Calendar, and Settings screens to match this exactly.”

That way your AI designer does the grunt work and you stay at the systems level.
