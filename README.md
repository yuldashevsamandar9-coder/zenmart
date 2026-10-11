# Zenmart — electronics store (front-end)

A complete, responsive front-end for an electronics web store, built from the **Zenmart** Figma design with plain HTML, CSS and JavaScript — no framework and no build step.

**Pages (all 11 frames of the design):** Home · Shop (product list) · Product detail · Cart · Checkout · Order received · My account · About · Contact · Sign in · Create account

## Features

- **Catalogue** — 44 products in `public/js/data.js`; every list, card and product page is rendered from it.
- **Shop** — filter by category, brand and price, sort (popular, rating, price, discount, newest), pagination, active-filter chips, search from the header. Filters live in the URL, so a filtered page can be shared.
- **Product page** — gallery with hover zoom, spec table, quantity, add to cart / buy now, wishlist, share links, accessible tabs (arrow keys), related products.
- **Cart** — quantities, remove, coupon codes (`ZEN10`, `WELCOME5`), free-shipping progress (over $200), taxes and totals.
- **Checkout** — validated billing/shipping form with clear error messages, payment options, places an order and shows the confirmation page.
- **Account** — sign in / create account, profile, password and notification settings, orders, invoices, saved address, wishlist.
- **Responsive** — designed layouts for phone, tablet and desktop: drawer menu, filter bottom sheet, cart rows as cards, swipeable carousels.
- **Accessible** — semantic landmarks, skip link, keyboard focus styles, labelled controls, `aria-live` status messages, reduced-motion support.

Everything a shopper does (cart, wishlist, account, orders) is stored in the browser's `localStorage`. **It is a demo: there is no backend, nothing is sent anywhere, no payment is taken.** Product prices, ratings and review counts are sample data.

## Run it

Open `index.html` in a browser, or serve the folder (recommended, so every page shares one `localStorage`):

```bash
python3 -m http.server 5500
```

then visit <http://localhost:5500>. It also works as-is on GitHub Pages.

## Structure

```
index.html                 home
product/all.html           shop (product list)
product/choseproduct.html  product detail (?id=…)
order/cart.html            cart
order/checkout.html        checkout
order/received.html        order confirmation (?order=…)
mypage/index.html          my account (#details, #orders, #address, #wishlist, #invoices)
other/about.html           about
other/contact.html         contact + FAQ
other/login.html           sign in
other/signup.html          create account
public/css/command.css     design tokens, header, footer, buttons, forms, product card, carousel
public/css/*.css           one stylesheet per page group
public/js/data.js          product catalogue
public/js/app.js           store (cart, wishlist, account, orders), header/footer, carousels, page logic
public/images/             design assets
```

## Credits

- UI design: *Zenmart* Figma file.
- Photography on the About page and team portraits come from the design file (Unsplash / Freepik stock imagery).
- Icons: [Font Awesome](https://fontawesome.com). Typeface: [Jost](https://fonts.google.com/specimen/Jost).
- Product names and brands belong to their respective owners and are used here only as sample content.
