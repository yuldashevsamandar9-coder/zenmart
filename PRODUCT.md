# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS with plain JavaScript (no framework, no build step) — the owner asked to continue the existing code. Frontend only: no backend.

## Users

- **Portfolio reviewers** (recruiters, front-end leads) who open the site to judge the author's front-end craft: layout fidelity, responsiveness, interaction quality, code organisation.
- **The demo shopper** inside the story: someone browsing an electronics store, comparing products, filling a cart and checking out.

## Product Purpose

Zenmart is a demo electronics web store built from a Figma design (`zenmart.fig`, 11 desktop frames: home, product list, product detail, cart, checkout, order received, my page, about, contact, login, register). It exists as a portfolio piece: every page of the design is built, responsive, and the core shopping flow works in the browser.

## Operating Context

- Shopping flow: browse → product list (filter/sort) → product detail → cart → checkout → order received.
- Account pages (login, register, my page) and info pages (about, contact) are front-end only.
- Cart, wishlist and "orders" live in the browser (localStorage); nothing is sent anywhere.

## Capabilities and Constraints

- No real payments, accounts or orders — forms validate and simulate success only.
- Product names, prices and reviews are sample catalogue content from the design file, not a real store.
- Must work on phones, tablets and desktop.

## Brand Commitments

- Name **Zenmart**; the design file's identity: deep purple `#443297`, yellow accent `#f5c34b`, navy text `#041e42`, Jost typeface.
- Continue the existing code and visual system rather than replacing it (owner's instruction).

## Evidence on Hand

- Design file assets: product photos and page imagery in `public/images`; extra design photos (about page, team, contact map) come from the Figma file (stock photos from Unsplash / Freepik as named in the file).
- No real customers, reviews, stores or statistics — never present the sample content as real.

## Product Principles

1. Every page in the design exists and works — no dead links or empty files.
2. Phone layouts are designed, not shrunk.
3. Interactions behave like a real store (cart totals update, forms explain errors) while staying honest that it is a demo.
