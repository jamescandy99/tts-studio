---
name: testing-aether-homepage
description: Test the Aether Motors premium EV homepage end-to-end. Use when verifying static homepage UI, layout, and interactive features.
---

# Testing the Aether Motors Homepage

## Environment
- Static site at `aether-motors/index.html` — no server or build step required
- Open directly via `file:///` protocol in Chrome or serve with any static server
- No credentials or secrets needed

## Key Sections to Verify (8 total)
1. **Header/Navigation** — Sticky header with AETHER logo, nav links (Models, Why Aether, Ownership, Stories), Configure link, and "Book a Test Drive" CTA button
2. **Hero Section** — Gradient headline "Electric. Elevated.", subheadline, dual CTAs, trust indicators ($68,900 starting price, 520 km range), scroll indicator, particle animation
3. **Trust Bar** — 4 stats: 4.9/5 rating, 2025 Award, Forbes/Wired/Top Gear, 98% recommendation
4. **Models Overview** — 3 model cards (Aether One, Sport, Grand Tourer) with specs, pricing, taglines, "Most Popular" badge, Configure buttons
5. **Benefits (Why Aether?)** — 4 numbered benefit cards with glow-follow mouse effect
6. **Testimonials** — 3 owner stories with quotes, avatars, names/titles, switch-from details
7. **FAQs** — 8-item accordion
8. **Final CTA** — 3 buttons (Book, Configure, Talk to Expert), reassurance text
9. **Footer** — 5-column layout with links, copyright, legal

## Interactive Features to Test

### Sticky Header
- Scroll past ~60px → header gets dark blurred background (`header--scrolled` class)
- Scroll back to top → transparent header returns
- Verify via: `document.getElementById('header').classList.contains('header--scrolled')`

### FAQ Accordion
- Click a question → answer expands, + icon rotates to x
- Click another question → first closes, second opens (only one open at a time)
- Click the open question again → it closes (no items open)
- Verify via: `aria-expanded` attribute on buttons, `.active` class on `.faq__item`

### Smooth Scroll Navigation
- Click any nav link (e.g., "Models") → page smooth-scrolls to that section
- Section heading should be visible below the sticky header

### Scroll Reveal Animations
- Elements with `.reveal-up` class fade in and slide up as they enter viewport
- Verify count: `document.querySelectorAll('.reveal-up.visible').length` increases as you scroll
- Total elements: 29 `.reveal-up` elements

### Model Card Tilt
- Hover over a model card → 3D perspective tilt effect follows mouse position

### Benefits Glow Follow
- Hover over a benefit card → radial glow gradient follows mouse cursor

## Mobile Testing
- At viewport <= 768px: hamburger menu appears, nav links hidden
- Sticky mobile CTA ("Book Test Drive") appears after scrolling 400px
- Model cards, ownership cards, benefit cards stack to single column
- FAQ and footer remain functional

## Devin Secrets Needed
None — this is a static site with no authentication.
