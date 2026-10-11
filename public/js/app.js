/**
 * Zenmart — shared front-end logic (no framework, no build step).
 *
 * Every page has <body data-page="…" data-root="./ or ../"> and placeholders
 * <div data-zm="header"></div> / <div data-zm="footer"></div>.
 * The cart, wishlist, account and orders live in localStorage — this is a demo store,
 * nothing is sent anywhere.
 */
(function () {
  "use strict";

  const ROOT = document.body.dataset.root || "./";
  const PAGE = document.body.dataset.page || "";
  const url = (path) => ROOT + path;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const fmt = (n) => money.format(n);
  const productUrl = (p) => url(`product/choseproduct.html?id=${encodeURIComponent(p.id)}`);

  /* ===================================================================== store */

  const read = (key, fallback) => {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode: the demo still works for this page view */
    }
  };

  const FREE_SHIPPING_FROM = 200;
  const SHIPPING_FEE = 15;
  const TAX_RATE = 0.08;
  const COUPONS = { ZEN10: 0.1, WELCOME5: 0.05 };

  const store = {
    cart: () => read("zm_cart", []).filter((l) => window.ZM_findProduct(l.id)),
    setCart(lines) {
      write("zm_cart", lines);
      document.dispatchEvent(new CustomEvent("zm:cart"));
    },
    add(id, qty = 1) {
      const lines = store.cart();
      const line = lines.find((l) => l.id === id);
      if (line) line.qty = Math.min(99, line.qty + qty);
      else lines.push({ id, qty });
      store.setCart(lines);
    },
    setQty(id, qty) {
      store.setCart(store.cart().map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l)));
    },
    remove(id) {
      store.setCart(store.cart().filter((l) => l.id !== id));
    },
    coupon: () => read("zm_coupon", ""),
    setCoupon: (code) => write("zm_coupon", code),
    totals() {
      const lines = store.cart().map((l) => ({ ...l, product: window.ZM_findProduct(l.id) }));
      const count = lines.reduce((s, l) => s + l.qty, 0);
      const subtotal = lines.reduce((s, l) => s + l.qty * l.product.price, 0);
      const code = store.coupon();
      const discount = COUPONS[code] ? Math.round(subtotal * COUPONS[code] * 100) / 100 : 0;
      const shipping = subtotal === 0 || subtotal - discount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
      const tax = Math.round((subtotal - discount) * TAX_RATE * 100) / 100;
      return { lines, count, subtotal, discount, code: COUPONS[code] ? code : "", shipping, tax, total: subtotal - discount + shipping + tax };
    },
    wishlist: () => read("zm_wishlist", []),
    toggleWish(id) {
      const list = store.wishlist();
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      write("zm_wishlist", next);
      document.dispatchEvent(new CustomEvent("zm:wishlist"));
      return next.includes(id);
    },
    user: () => read("zm_user", null),
    setUser: (u) => {
      write("zm_user", u);
      document.dispatchEvent(new CustomEvent("zm:user"));
    },
    orders: () => read("zm_orders", []),
    addOrder(order) {
      write("zm_orders", [order, ...store.orders()].slice(0, 20));
    },
  };

  /* ===================================================================== toast */

  let toastTimer;
  const toast = (text, kind = "ok") => {
    let el = $(".zm_toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "zm_toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.append(el);
    }
    el.dataset.kind = kind;
    el.innerHTML = `<i class="fa-solid ${kind === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}" aria-hidden="true"></i><span>${esc(text)}</span>`;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  };

  /* ===================================================================== product card */

  const stars = (rating) =>
    `<span class="stars" role="img" aria-label="Rated ${rating} out of 5"><span style="width:${(rating / 5) * 100}%"></span></span>`;

  const discountPct = (p) => (p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

  const card = (p, { compact = false } = {}) => {
    const off = discountPct(p);
    const wished = store.wishlist().includes(p.id);
    return `
      <article class="product_box${compact ? " compact" : ""}" data-id="${p.id}">
        <a class="product_img_box" href="${productUrl(p)}" tabindex="-1" aria-hidden="true">
          <img src="${url(p.image)}" alt="" loading="lazy" decoding="async" />
          ${off ? `<span class="product_badge">-${off}%</span>` : ""}
        </a>
        <button type="button" class="product_like" data-wish="${p.id}" aria-pressed="${wished}" aria-label="Save ${esc(p.brand)} item to wishlist">
          <i class="fa-${wished ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>
        </button>
        <div class="product_content_box">
          <span class="product_title">${esc(p.brand)}</span>
          <a href="${productUrl(p)}"><h3 class="product_disc">${esc(p.name)}</h3></a>
          <div class="review_box">${stars(p.rating)}<span>${p.reviews.toLocaleString("en-US")} reviews</span></div>
          <div class="price_box"><strong>${fmt(p.price)}</strong>${p.oldPrice > p.price ? `<s>${fmt(p.oldPrice)}</s>` : ""}</div>
          <button type="button" class="btn_add" data-add="${p.id}"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i><span>Add to cart</span></button>
        </div>
      </article>`;
  };

  /* buttons inside any card or page: add to cart / wishlist */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      const p = window.ZM_findProduct(add.dataset.add);
      const qty = Number(add.dataset.qty || 1);
      store.add(p.id, qty);
      toast(`${p.brand} added to your cart`);
      add.classList.add("added");
      setTimeout(() => add.classList.remove("added"), 900);
      return;
    }
    const wish = e.target.closest("[data-wish]");
    if (wish) {
      const on = store.toggleWish(wish.dataset.wish);
      $$(`[data-wish="${wish.dataset.wish}"]`).forEach((b) => {
        b.setAttribute("aria-pressed", on);
        const icon = $("i", b);
        if (icon) icon.className = `fa-${on ? "solid" : "regular"} fa-heart`;
      });
      toast(on ? "Saved to your wishlist" : "Removed from your wishlist");
    }
  });

  /* ===================================================================== header / footer */

  const NAV = [
    { href: "index.html", label: "Home", page: "home" },
    { href: "product/all.html", label: "Shop", page: "shop" },
    { href: "mypage/index.html#orders", label: "Orders", page: "mypage" },
    { href: "other/about.html", label: "About", page: "about" },
    { href: "other/contact.html", label: "Contact", page: "contact" },
  ];
  const PROMOS = [
    { label: "Deal of the Day", q: "sort=discount" },
    { label: "Hot Deals", q: "sort=price-asc" },
    { label: "Best Sellers", q: "sort=popular" },
    { label: "New Arrivals", q: "sort=newest" },
  ];

  const headerHtml = () => {
    const t = store.totals();
    const user = store.user();
    const cats = window.ZM_CATEGORIES.map((c) => `<a href="${url(`product/all.html?category=${c.id}`)}">${esc(c.name)}</a>`).join("");
    return `
      <a class="skip_link" href="#main">Skip to content</a>
      <header class="navbar_frame">
        <div class="container navbar_inner">
          <div class="navbar_top">
            <button type="button" class="nav_burger" aria-label="Open menu" aria-expanded="false" aria-controls="zm-drawer">
              <i class="fa-solid fa-bars" aria-hidden="true"></i>
            </button>
            <a class="nav_logo" href="${url("index.html")}" aria-label="Zenmart home">
              <img src="${url("public/images/logo (2).png")}" alt="Zenmart" width="117" height="36" />
            </a>
            <form class="nav_search_frame" role="search" action="${url("product/all.html")}">
              <label class="category_list">
                <span class="visually_hidden">Category</span>
                <select name="category">
                  <option value="">All Categories</option>
                  ${window.ZM_CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}
                </select>
              </label>
              <label class="search_input">
                <span class="visually_hidden">Search products</span>
                <input type="search" name="q" placeholder="Search products…" autocomplete="off" />
              </label>
              <button type="submit" class="search_icon_box" aria-label="Search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button>
            </form>
            <nav class="nav_top_menu" aria-label="Account">
              <a class="top_menu_box hide_sm" href="${url("mypage/index.html#wishlist")}">
                <span class="box_icon_box"><i class="fa-regular fa-heart" aria-hidden="true"></i></span>
                <span class="box_info_box"><span>Wishlist</span><strong>My Items</strong></span>
              </a>
              <a class="top_menu_box" href="${url(user ? "mypage/index.html" : "other/login.html")}" aria-label="${user ? "My account" : "Sign in"}">
                <span class="box_icon_box"><i class="fa-regular fa-user" aria-hidden="true"></i></span>
                <span class="box_info_box"><span>${user ? esc(user.name.split(" ")[0]) : "Sign In"}</span><strong>Account</strong></span>
              </a>
              <a class="top_menu_box" href="${url("order/cart.html")}" aria-label="Cart, ${t.count} items">
                <span class="box_icon_box">
                  <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
                  <span class="basket_count" data-cart-count ${t.count ? "" : "hidden"}>${t.count}</span>
                </span>
                <span class="box_info_box"><span data-cart-total>${fmt(t.subtotal)}</span><strong>Total</strong></span>
              </a>
            </nav>
          </div>
          <div class="navbar_bott">
            <div class="browse_box">
              <button type="button" class="browse_btn" aria-expanded="false" aria-controls="zm-browse">
                <i class="fa-solid fa-grip" aria-hidden="true"></i><span>Browse Categories</span><i class="fa-solid fa-chevron-down chev" aria-hidden="true"></i>
              </button>
              <div class="browse_menu" id="zm-browse" hidden>${cats}</div>
            </div>
            <nav class="navbar_route_menu" aria-label="Main">
              ${NAV.map((n) => `<a href="${url(n.href)}"${n.page === PAGE ? ' class="active" aria-current="page"' : ""}>${n.label}</a>`).join("")}
            </nav>
            <nav class="sorting_menu" aria-label="Deals">
              ${PROMOS.map((p) => `<a href="${url(`product/all.html?${p.q}`)}">${p.label}</a>`).join("")}
            </nav>
          </div>
        </div>
      </header>
      <div class="drawer_scrim" hidden></div>
      <aside class="nav_drawer" id="zm-drawer" aria-label="Menu" hidden>
        <div class="drawer_head">
          <img src="${url("public/images/logo (2).png")}" alt="Zenmart" width="104" height="32" />
          <button type="button" class="drawer_close" aria-label="Close menu"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </div>
        <nav class="drawer_links" aria-label="Main">
          ${NAV.map((n) => `<a href="${url(n.href)}"${n.page === PAGE ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}
          <a href="${url("mypage/index.html#wishlist")}">Wishlist</a>
        </nav>
        <p class="drawer_label">Categories</p>
        <nav class="drawer_cats" aria-label="Categories">${cats}</nav>
        <p class="drawer_label">Deals</p>
        <nav class="drawer_cats" aria-label="Deals">${PROMOS.map((p) => `<a href="${url(`product/all.html?${p.q}`)}">${p.label}</a>`).join("")}</nav>
      </aside>`;
  };

  const footerHtml = () => `
    <footer class="footer_frame">
      <div class="container">
        <div class="footer_top">
          <div class="footer_contact_box">
            <h2 class="footer_spec_title">Contact Us</h2>
            <div class="footer_contact_main">
              <i class="fa-solid fa-phone-volume" aria-hidden="true"></i>
              <div><strong>Monday–Friday: 08am–9pm</strong><span>+(1) 123 456 7890</span></div>
            </div>
            <div class="footer_contact_main">
              <i class="fa-regular fa-envelope" aria-hidden="true"></i>
              <div><strong>Need help with your order?</strong><span>support@zenmart.com</span></div>
            </div>
          </div>
          <nav class="footer_support_box" aria-label="Customer support">
            <h2 class="footer_spec_title">Customer Support</h2>
            <a href="${url("other/contact.html")}">Contact Us</a>
            <a href="${url("other/contact.html#faq")}">Help Centre</a>
            <a href="${url("other/contact.html#faq")}">Returns &amp; Exchanges</a>
            <a href="${url("order/cart.html")}">Your Cart</a>
            <a href="${url("mypage/index.html#orders")}">Order Status</a>
          </nav>
          <nav class="footer_support_box" aria-label="Shop">
            <h2 class="footer_spec_title">Shop</h2>
            ${window.ZM_CATEGORIES.slice(0, 5).map((c) => `<a href="${url(`product/all.html?category=${c.id}`)}">${esc(c.name)}</a>`).join("")}
          </nav>
          <div class="footer_media_box">
            <h2 class="footer_spec_title">Follow us</h2>
            <div class="media_app_box">
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i></a>
              <a href="https://x.com" aria-label="X (Twitter)" target="_blank" rel="noopener"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i></a>
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener"><i class="fa-brands fa-instagram" aria-hidden="true"></i></a>
              <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener"><i class="fa-brands fa-linkedin-in" aria-hidden="true"></i></a>
            </div>
            <h2 class="footer_spec_title">Mobile Apps</h2>
            <div class="mobile_app_box"><i class="fa-brands fa-apple" aria-hidden="true"></i><span>iOS App</span></div>
            <div class="mobile_app_box"><i class="fa-brands fa-android" aria-hidden="true"></i><span>Android App</span></div>
          </div>
          <div class="footer_media_box footer_pay">
            <h2 class="footer_spec_title">We accept</h2>
            <div class="card_box">
              ${["visa", "master_card", "apple_pay", "dicvover", "paypal", "amex"].map((c) => `<img src="${url(`public/images/icons/${c}.png`)}" alt="${c.replace("_", " ").replace("dicvover", "discover")}" />`).join("")}
            </div>
          </div>
        </div>
        <div class="footer_bottom">
          <p>© ${new Date().getFullYear()} Zenmart — a front-end demo store. All product names belong to their owners.</p>
          <div class="footer_bottom_right">
            <label class="footer_select_box"><span>Currency</span><select><option>USD</option></select></label>
            <label class="footer_select_box"><span>Language</span><select><option>English</option></select></label>
          </div>
        </div>
      </div>
    </footer>`;

  const mountLayout = () => {
    const h = $('[data-zm="header"]');
    const f = $('[data-zm="footer"]');
    if (h) h.outerHTML = headerHtml();
    if (f) f.outerHTML = footerHtml();

    // keep the query in the search box on the shop page
    const params = new URLSearchParams(location.search);
    const form = $(".nav_search_frame");
    if (form) {
      form.q.value = params.get("q") || "";
      form.category.value = params.get("category") || "";
    }

    // mobile drawer
    const drawer = $(".nav_drawer");
    const scrim = $(".drawer_scrim");
    const burger = $(".nav_burger");
    const openDrawer = (open) => {
      drawer.hidden = scrim.hidden = !open;
      burger.setAttribute("aria-expanded", open);
      document.documentElement.classList.toggle("no_scroll", open);
      if (open) $(".drawer_close").focus();
      else burger.focus();
    };
    burger?.addEventListener("click", () => openDrawer(true));
    $(".drawer_close")?.addEventListener("click", () => openDrawer(false));
    scrim?.addEventListener("click", () => openDrawer(false));

    // browse categories dropdown
    const browseBtn = $(".browse_btn");
    const browse = $("#zm-browse");
    browseBtn?.addEventListener("click", () => {
      const open = browse.hidden;
      browse.hidden = !open;
      browseBtn.setAttribute("aria-expanded", open);
    });
    document.addEventListener("click", (e) => {
      if (browse && !browse.hidden && !e.target.closest(".browse_box")) {
        browse.hidden = true;
        browseBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (drawer && !drawer.hidden) openDrawer(false);
      if (browse && !browse.hidden) {
        browse.hidden = true;
        browseBtn.setAttribute("aria-expanded", "false");
        browseBtn.focus();
      }
    });

    // the second header row folds away while scrolling down (desktop)
    const header = $(".navbar_frame");
    let lastY = scrollY;
    addEventListener(
      "scroll",
      () => {
        const y = scrollY;
        header?.classList.toggle("is_compact", y > 160 && y > lastY);
        header?.classList.toggle("is_scrolled", y > 8);
        lastY = y;
      },
      { passive: true },
    );
  };

  const refreshCartBadge = () => {
    const t = store.totals();
    $$("[data-cart-count]").forEach((el) => {
      el.textContent = t.count;
      el.hidden = !t.count;
    });
    $$("[data-cart-total]").forEach((el) => (el.textContent = fmt(t.subtotal)));
    const cartLink = $('.top_menu_box[href$="cart.html"]');
    cartLink?.setAttribute("aria-label", `Cart, ${t.count} items`);
  };
  document.addEventListener("zm:cart", refreshCartBadge);

  /* ===================================================================== carousels */

  /**
   * <div class="carousel" data-carousel>
   *   <button data-prev> <div class="carousel_track">…</div> <button data-next>
   *   <div class="carousel_dots" data-dots></div>   (optional)
   */
  const initCarousels = (root = document) => {
    $$("[data-carousel]", root).forEach((c) => {
      if (c.dataset.ready) return;
      c.dataset.ready = "1";
      const track = $(".carousel_track", c);
      const prev = $("[data-prev]", c);
      const next = $("[data-next]", c);
      const dots = $("[data-dots]", c);
      const step = () => {
        const item = track.firstElementChild;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const per = item ? Math.max(1, Math.floor((track.clientWidth + gap) / (item.offsetWidth + gap))) : 1;
        return per * ((item?.offsetWidth || track.clientWidth) + gap);
      };
      const pages = () => Math.max(1, Math.ceil((track.scrollWidth - 4) / track.clientWidth));
      const update = () => {
        const max = track.scrollWidth - track.clientWidth - 4;
        if (prev) prev.disabled = track.scrollLeft <= 4;
        if (next) next.disabled = track.scrollLeft >= max;
        if (dots) {
          const n = pages();
          if (dots.childElementCount !== n)
            dots.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" aria-label="Go to slide ${i + 1}"></button>`).join("");
          const current = Math.round(track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth) * (n - 1));
          [...dots.children].forEach((d, i) => d.setAttribute("aria-current", i === current ? "true" : "false"));
          dots.hidden = n < 2;
        }
      };
      prev?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
      next?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
      dots?.addEventListener("click", (e) => {
        const i = [...dots.children].indexOf(e.target.closest("button"));
        if (i >= 0) track.scrollTo({ left: (track.scrollWidth - track.clientWidth) * (i / Math.max(1, pages() - 1)), behavior: "smooth" });
      });
      track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
      addEventListener("resize", update);
      update();
    });
  };

  /* ===================================================================== countdown */

  const initCountdown = () => {
    $$("[data-countdown]").forEach((el) => {
      // the deal ends next Sunday at midnight (local time), so the timer is always live
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
      const parts = { d: $("[data-d]", el), h: $("[data-h]", el), m: $("[data-m]", el), s: $("[data-s]", el) };
      const tick = () => {
        const left = Math.max(0, end - Date.now());
        const s = Math.floor(left / 1000);
        parts.d.textContent = String(Math.floor(s / 86400)).padStart(2, "0");
        parts.h.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
        parts.m.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
        parts.s.textContent = String(s % 60).padStart(2, "0");
      };
      tick();
      setInterval(tick, 1000);
    });
  };

  /* ===================================================================== forms */

  /** Marks a field invalid with a message (or clears it). Returns validity. */
  const fieldError = (input, message) => {
    const field = input.closest(".field");
    let msg = field && $(".field_error", field);
    if (field && !msg) {
      msg = document.createElement("p");
      msg.className = "field_error";
      msg.id = `${input.id || input.name}-error`;
      field.append(msg);
    }
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (msg) {
      msg.textContent = message || "";
      msg.hidden = !message;
      if (message) input.setAttribute("aria-describedby", msg.id);
    }
    return !message;
  };

  const RULES = {
    required: (v) => (v.trim() ? "" : "This field is required."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter an email like name@example.com."),
    phone: (v) => (/^[+\d][\d\s()-]{6,}$/.test(v.trim()) ? "" : "Enter a phone number with at least 7 digits."),
    password: (v) => (v.length >= 8 ? "" : "Use at least 8 characters."),
    zip: (v) => (/^[A-Za-z0-9 -]{3,10}$/.test(v.trim()) ? "" : "Enter a valid postcode."),
  };

  /** Validates every [data-rules] input in a form; focuses the first problem. */
  const validate = (form) => {
    let first = null;
    $$("[data-rules]", form).forEach((input) => {
      if (input.closest("[hidden]") || input.disabled) return fieldError(input, "");
      const rules = input.dataset.rules.split(" ");
      let message = "";
      for (const r of rules) {
        if (r !== "required" && !input.value.trim()) continue; // optional and empty
        if (r === "match") message = input.value === form.elements[input.dataset.match].value ? "" : "Passwords do not match.";
        else if (r === "checked") message = input.checked ? "" : "Please confirm to continue.";
        else message = RULES[r]?.(input.value) || "";
        if (message) break;
      }
      if (!fieldError(input, message) && !first) first = input;
    });
    first?.focus();
    return !first;
  };

  // clear an error as soon as the user fixes the field
  document.addEventListener("input", (e) => {
    if (e.target.matches?.('[aria-invalid="true"]')) fieldError(e.target, "");
  });

  // social sign-in buttons: there is no identity provider behind a static demo
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-social]")) toast("Social sign-in isn’t available in this demo — use the form instead", "error");
  });

  // show / hide password
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle-password]");
    if (!btn) return;
    const input = btn.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-pressed", show);
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    btn.querySelector("i").className = `fa-regular ${show ? "fa-eye-slash" : "fa-eye"}`;
  });

  /* ===================================================================== pages */

  const pages = {};

  /* ---------- home ---------- */
  pages.home = () => {
    const P = window.ZM_PRODUCTS;
    const fill = (sel, list, opts) => {
      const el = $(sel);
      if (el) el.innerHTML = list.map((p) => card(p, opts)).join("");
    };
    fill("#top-selling", P.filter((p) => p.tags.includes("top")));
    fill("#tv-products", P.filter((p) => p.category === "tv"));
    fill("#deal-products", P.filter((p) => p.tags.includes("deal")).concat(P.filter((p) => p.tags.includes("featured"))), { compact: true });

    // TV tabs only re-order the row; every tab is a real sort of the same TVs
    $$("[data-tv-tab]").forEach((tab) =>
      tab.addEventListener("click", () => {
        $$("[data-tv-tab]").forEach((t) => t.setAttribute("aria-selected", t === tab));
        const tvs = P.filter((p) => p.category === "tv");
        const order = { all: tvs, premium: [...tvs].sort((a, b) => b.price - a.price), value: [...tvs].sort((a, b) => a.price - b.price), rated: [...tvs].sort((a, b) => b.rating - a.rating) };
        fill("#tv-products", order[tab.dataset.tvTab]);
        $("#tv-products").scrollTo({ left: 0 });
      }),
    );

    // hero: three offers, auto-rotating, pausable
    const hero = $("[data-hero]");
    if (hero) {
      const slides = $$(".hero_slide", hero);
      const dots = $(".hero_dots", hero);
      let i = 0;
      let timer;
      dots.innerHTML = slides.map((_, n) => `<button type="button" aria-label="Show offer ${n + 1}"></button>`).join("");
      const show = (n) => {
        i = (n + slides.length) % slides.length;
        slides.forEach((s, k) => {
          s.classList.toggle("active", k === i);
          s.setAttribute("aria-hidden", k !== i);
          $$("a, button", s).forEach((el) => (el.tabIndex = k === i ? 0 : -1));
        });
        [...dots.children].forEach((d, k) => d.setAttribute("aria-current", k === i));
      };
      const start = () => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        clearInterval(timer);
        timer = setInterval(() => show(i + 1), 6000);
      };
      dots.addEventListener("click", (e) => {
        const n = [...dots.children].indexOf(e.target.closest("button"));
        if (n >= 0) {
          show(n);
          start();
        }
      });
      $("[data-hero-prev]", hero)?.addEventListener("click", () => (show(i - 1), start()));
      $("[data-hero-next]", hero)?.addEventListener("click", () => (show(i + 1), start()));
      hero.addEventListener("mouseenter", () => clearInterval(timer));
      hero.addEventListener("mouseleave", start);
      hero.addEventListener("focusin", () => clearInterval(timer));
      show(0);
      start();
    }
  };

  /* ---------- shop (product list) ---------- */
  pages.shop = () => {
    const params = new URLSearchParams(location.search);
    const PER_PAGE = 12;
    const all = window.ZM_PRODUCTS;
    const state = {
      q: params.get("q") || "",
      category: params.get("category") || "",
      brands: new Set(params.getAll("brand")),
      min: Number(params.get("min")) || 0,
      max: Number(params.get("max")) || 0,
      sort: params.get("sort") || "popular",
      page: Number(params.get("page")) || 1,
    };

    // top selling laptops row (existing artwork) + brands
    const top = $("#top-laptops");
    if (top) top.innerHTML = all.filter((p) => p.tags.includes("top-laptop")).map((p) => card(p)).join("");

    const brands = [...new Set(all.map((p) => p.brand))].sort();
    const brandBox = $("#brand-filters");
    brandBox.innerHTML = brands
      .map((b) => `<label class="check"><input type="checkbox" name="brand" value="${esc(b)}" ${state.brands.has(b) ? "checked" : ""}/><span>${esc(b)}</span><small>${all.filter((p) => p.brand === b).length}</small></label>`)
      .join("");
    const brandChips = $("#brand-chips");
    if (brandChips)
      brandChips.innerHTML = ["Apple", "HP", "Lenovo", "Samsung", "ASUS", "Acer", "Dell", "Sony"]
        .map((b) => `<button type="button" class="brand_box" data-brand="${b}" aria-pressed="${state.brands.has(b)}">${b}</button>`)
        .join("");

    const catBox = $("#category-filters");
    const usedCats = window.ZM_CATEGORIES.filter((c) => all.some((p) => p.category === c.id));
    catBox.innerHTML =
      `<label class="check radio"><input type="radio" name="category" value="" ${state.category ? "" : "checked"}/><span>All products</span><small>${all.length}</small></label>` +
      usedCats
        .map((c) => `<label class="check radio"><input type="radio" name="category" value="${c.id}" ${state.category === c.id ? "checked" : ""}/><span>${esc(c.name)}</span><small>${all.filter((p) => p.category === c.id).length}</small></label>`)
        .join("");

    const form = $("#filters");
    form.min.value = state.min || "";
    form.max.value = state.max || "";
    $("#sort").value = state.sort;

    const grid = $("#product-grid");
    const count = $("#result-count");
    const pager = $("#pagination");
    const active = $("#active-filters");
    const heading = $("#list-title");

    const syncUrl = () => {
      const p = new URLSearchParams();
      if (state.q) p.set("q", state.q);
      if (state.category) p.set("category", state.category);
      state.brands.forEach((b) => p.append("brand", b));
      if (state.min) p.set("min", state.min);
      if (state.max) p.set("max", state.max);
      if (state.sort !== "popular") p.set("sort", state.sort);
      if (state.page > 1) p.set("page", state.page);
      history.replaceState(null, "", `${location.pathname}${p.toString() ? `?${p}` : ""}`);
    };

    const render = () => {
      const q = state.q.toLowerCase();
      let list = all.filter(
        (p) =>
          (!state.category || p.category === state.category) &&
          (!state.brands.size || state.brands.has(p.brand)) &&
          (!state.min || p.price >= state.min) &&
          (!state.max || p.price <= state.max) &&
          (!q || `${p.brand} ${p.name}`.toLowerCase().includes(q)),
      );
      const sorters = {
        popular: (a, b) => b.reviews - a.reviews,
        rating: (a, b) => b.rating - a.rating,
        "price-asc": (a, b) => a.price - b.price,
        "price-desc": (a, b) => b.price - a.price,
        discount: (a, b) => discountPct(b) - discountPct(a),
        newest: (a, b) => all.indexOf(b) - all.indexOf(a),
      };
      list = [...list].sort(sorters[state.sort] || sorters.popular);
      const pagesCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
      state.page = Math.min(state.page, pagesCount);
      const shown = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

      const cat = window.ZM_CATEGORIES.find((c) => c.id === state.category);
      heading.textContent = state.q ? `Results for “${state.q}”` : cat ? cat.name : "All Products";
      count.textContent = list.length ? `Showing ${(state.page - 1) * PER_PAGE + 1}–${(state.page - 1) * PER_PAGE + shown.length} of ${list.length} products` : "No products match these filters";

      grid.innerHTML = shown.length
        ? shown.map((p) => card(p)).join("")
        : `<div class="empty_state"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><h3>Nothing matches yet</h3><p>Try another brand, widen the price range or clear the filters.</p><button type="button" class="btn btn_outline" data-clear>Clear all filters</button></div>`;

      // active filter chips
      const chips = [];
      if (state.q) chips.push(["q", `“${state.q}”`]);
      if (cat) chips.push(["category", cat.name]);
      state.brands.forEach((b) => chips.push(["brand:" + b, b]));
      if (state.min || state.max) chips.push(["price", `${state.min ? fmt(state.min) : "$0"} – ${state.max ? fmt(state.max) : "any"}`]);
      active.innerHTML = chips.length
        ? chips.map(([k, label]) => `<button type="button" class="chip" data-remove="${esc(k)}" aria-label="Remove filter ${esc(label)}">${esc(label)} <i class="fa-solid fa-xmark" aria-hidden="true"></i></button>`).join("") +
          `<button type="button" class="chip_clear" data-clear>Clear all</button>`
        : "";

      // pagination: prev, numbers (with gaps), next
      const nums = [];
      // first, last and the neighbours of the current page; a gap of a single page shows that page instead of "…"
      for (let n = 1; n <= pagesCount; n++) if (n === 1 || n === pagesCount || Math.abs(n - state.page) <= 1 || (pagesCount <= 5)) nums.push(n);
      for (let i = nums.length - 1; i > 0; i--) if (nums[i] - nums[i - 1] === 2) nums.splice(i, 0, nums[i] - 1);
      const withGaps = nums.flatMap((n, i) => (i && n - nums[i - 1] > 1 ? ["…", n] : [n]));
      pager.hidden = pagesCount < 2;
      pager.innerHTML =
        `<button type="button" class="page_arrow" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""} aria-label="Previous page"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button>` +
        withGaps.map((n) => (n === "…" ? `<span class="page_gap">…</span>` : `<button type="button" data-page="${n}" ${n === state.page ? 'aria-current="page"' : ""}>${n}</button>`)).join("") +
        `<button type="button" class="page_arrow" data-page="${state.page + 1}" ${state.page === pagesCount ? "disabled" : ""} aria-label="Next page"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`;

      $$(".brand_box", brandChips || document).forEach((b) => b.setAttribute("aria-pressed", state.brands.has(b.dataset.brand)));
      $("#filter-count").textContent = chips.length ? `(${chips.length})` : "";
      syncUrl();
    };

    form.addEventListener("change", (e) => {
      if (e.target.name === "brand") e.target.checked ? state.brands.add(e.target.value) : state.brands.delete(e.target.value);
      if (e.target.name === "category") state.category = e.target.value;
      state.page = 1;
      render();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const min = Number(form.min.value) || 0;
      const max = Number(form.max.value) || 0;
      state.min = max && min > max ? max : min;
      state.max = max && min > max ? min : max;
      state.page = 1;
      render();
      closeFilters();
    });
    $("#sort").addEventListener("change", (e) => {
      state.sort = e.target.value;
      state.page = 1;
      render();
    });
    brandChips?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-brand]")?.dataset.brand;
      if (!b) return;
      state.brands.has(b) ? state.brands.delete(b) : state.brands.add(b);
      $$(`input[name="brand"]`, form).forEach((i) => (i.checked = state.brands.has(i.value)));
      state.page = 1;
      render();
      $("#list-title").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    pager.addEventListener("click", (e) => {
      const b = e.target.closest("[data-page]");
      if (!b || b.disabled) return;
      state.page = Number(b.dataset.page);
      render();
      $("#list-title").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const clearAll = () => {
      state.q = state.category = "";
      state.brands.clear();
      state.min = state.max = 0;
      state.page = 1;
      form.reset();
      $$(`input[name="category"]`, form)[0].checked = true;
      const s = $(".nav_search_frame");
      if (s) s.q.value = "";
      render();
    };
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-clear]")) return clearAll();
      const chip = e.target.closest("[data-remove]");
      if (!chip) return;
      const k = chip.dataset.remove;
      if (k === "q") state.q = "";
      else if (k === "category") {
        state.category = "";
        $$(`input[name="category"]`, form)[0].checked = true;
      } else if (k === "price") {
        state.min = state.max = 0;
        form.min.value = form.max.value = "";
      } else if (k.startsWith("brand:")) {
        state.brands.delete(k.slice(6));
        $$(`input[name="brand"]`, form).forEach((i) => (i.checked = state.brands.has(i.value)));
      }
      state.page = 1;
      render();
    });

    // filters panel becomes a sheet on small screens
    const panel = $(".filter_panel");
    const openBtn = $("#open-filters");
    const closeFilters = () => {
      panel.classList.remove("open");
      openBtn?.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("no_scroll");
    };
    openBtn?.addEventListener("click", () => {
      panel.classList.add("open");
      openBtn.setAttribute("aria-expanded", "true");
      document.documentElement.classList.add("no_scroll");
      $(".filter_close", panel)?.focus();
    });
    $(".filter_close", panel)?.addEventListener("click", closeFilters);
    document.addEventListener("keydown", (e) => e.key === "Escape" && panel.classList.contains("open") && closeFilters());

    render();
  };

  /* ---------- product detail ---------- */
  pages.product = () => {
    const id = new URLSearchParams(location.search).get("id") || "laptop-09";
    const p = window.ZM_findProduct(id) || window.ZM_findProduct("laptop-09");
    document.title = `${p.brand} — ${p.name.split(" (")[0]} · Zenmart`;

    $("#crumb-category").textContent = window.ZM_CATEGORIES.find((c) => c.id === p.category)?.name || "Shop";
    $("#crumb-category").href = url(`product/all.html?category=${p.category}`);
    $("#crumb-product").textContent = p.name.split(" (")[0].split(" – ")[0];

    // gallery
    const images = p.gallery?.length ? p.gallery : [p.image];
    const big = $("#gallery-image");
    big.src = url(images[0]);
    big.alt = p.name;
    const thumbs = $("#gallery-thumbs");
    thumbs.hidden = images.length < 2;
    thumbs.innerHTML = images
      .map((src, i) => `<button type="button" aria-label="Show image ${i + 1}" aria-pressed="${i === 0}"><img src="${url(src)}" alt="" /></button>`)
      .join("");
    thumbs.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const i = [...thumbs.children].indexOf(b);
      big.src = url(images[i]);
      [...thumbs.children].forEach((t, k) => t.setAttribute("aria-pressed", k === i));
    });

    // zoom follows the pointer inside the frame
    const frame = $(".gallery_big");
    frame.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = frame.getBoundingClientRect();
      big.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      frame.classList.add("zoom");
    });
    frame.addEventListener("pointerleave", () => frame.classList.remove("zoom"));
    $("#open-full")?.addEventListener("click", () => window.open(big.src, "_blank", "noopener"));

    // description and "more information" follow the kind of product
    const MORE = {
      computers: [["Performance", "A fast processor and solid-state storage open apps in seconds and keep many tabs and files running smoothly."], ["Display", "A sharp, bright screen with accurate colours for documents, photos and video."], ["Battery and portability", "Light enough to carry every day, with a battery that lasts through classes and meetings."], ["Connectivity", "Wi‑Fi, Bluetooth and the ports you use most for monitors, drives and accessories."]],
      tv: [["Picture quality", "4K resolution and HDR bring out detail in bright skies and dark scenes alike."], ["Smart platform", "Stream your favourite apps directly — no extra box needed."], ["Sound", "Clear dialogue and room-filling audio, with support for soundbars over HDMI."], ["Design", "Slim bezels and a stand or wall-mount option to fit your room."]],
      audio: [["Sound", "Balanced, detailed sound with deep bass that stays clean at higher volume."], ["Comfort", "Designed to stay comfortable and secure for hours of listening."], ["Battery", "Long battery life and quick charging for the days you forget to plug in."], ["Calls", "Built-in microphones keep your voice clear on calls and meetings."]],
      phones: [["Everyday speed", "Smooth performance for apps, photos, maps and messages."], ["Health and fitness", "Track activity, workouts and notifications at a glance."], ["Battery", "All-day battery life with fast, simple charging."], ["Ecosystem", "Works seamlessly with the devices and apps you already use."]],
      "smart-home": [["Hands-free cleaning", "Strong suction and smart navigation keep floors clean with less effort."], ["App control", "Schedule and control from your phone wherever you are."], ["Battery", "Long runtime per charge for larger homes."], ["Low maintenance", "Easy-empty bins and washable filters save time."]],
      gaming: [["Next-gen performance", "Fast loading and smooth frame rates for the latest games."], ["Immersive play", "Haptic feedback and 3D audio pull you into every game."], ["Storage", "Fast built-in storage with room for your favourite titles."], ["Entertainment hub", "Stream films and series from popular apps on the same device."]],
      cameras: [["Image quality", "A large sensor captures sharp, detailed photos even indoors."], ["Easy to learn", "Guided modes help beginners get great shots from day one."], ["Lens", "The included kit lens covers wide landscapes to portraits."], ["Share instantly", "Built-in Wi‑Fi sends photos to your phone in seconds."]],
    };
    $("#p-description").textContent = `The ${p.name.split(" (")[0]} brings ${p.brand}’s latest design to your everyday setup. ${Object.keys(p.specs).length ? `It comes with ${[p.specs["CPU Model"], p.specs["RAM Memory Installed"] && `${p.specs["RAM Memory Installed"]} of memory`, p.specs["Hard Disk Size"] && `${p.specs["Hard Disk Size"]} of storage`].filter(Boolean).join(", ")}.` : ""} Ships new and sealed from Zenmart with the manufacturer’s warranty.`;
    $("#more-grid").innerHTML = (MORE[p.category] || MORE.computers).map(([h, t]) => `<div><h3>${esc(h)}</h3><p>${esc(t)}</p></div>`).join("");

    // info
    $("#p-brand").textContent = p.brand;
    $("#p-stars").outerHTML = stars(p.rating);
    $("#p-reviews").textContent = `${p.reviews.toLocaleString("en-US")} reviews`;
    $("#p-name").textContent = p.name;
    $("#p-price").textContent = fmt(p.price);
    const off = discountPct(p);
    $("#p-old").textContent = p.oldPrice > p.price ? fmt(p.oldPrice) : "";
    $("#p-save").textContent = off ? `Save ${fmt(p.oldPrice - p.price)} (${off}%)` : "";
    $("#p-save").hidden = !off;
    const specs = Object.keys(p.specs).length ? p.specs : { Brand: p.brand, Color: p.color, Category: window.ZM_CATEGORIES.find((c) => c.id === p.category)?.name || "—" };
    $("#p-specs").innerHTML = Object.entries(specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    $("#p-sku").textContent = `ZM-${p.id.toUpperCase()}`;
    $("#p-cats").innerHTML = `<a href="${url(`product/all.html?category=${p.category}`)}">${esc($("#crumb-category").textContent)}</a>, <a href="${url(`product/all.html?brand=${encodeURIComponent(p.brand)}`)}">${esc(p.brand)}</a>`;

    // quantity + add to cart + buy now
    const qtyInput = $("#qty");
    const addBtn = $("#add-btn");
    const setQty = (n) => {
      qtyInput.value = Math.max(1, Math.min(99, n || 1));
      addBtn.dataset.qty = qtyInput.value;
    };
    $("#qty-minus").addEventListener("click", () => setQty(Number(qtyInput.value) - 1));
    $("#qty-plus").addEventListener("click", () => setQty(Number(qtyInput.value) + 1));
    qtyInput.addEventListener("change", () => setQty(Number(qtyInput.value)));
    addBtn.dataset.add = p.id;
    setQty(1);
    $("#buy-btn").addEventListener("click", () => {
      store.add(p.id, Number(qtyInput.value));
      location.href = url("order/checkout.html");
    });
    const wish = $("#wish-btn");
    wish.dataset.wish = p.id;
    const wished = store.wishlist().includes(p.id);
    wish.setAttribute("aria-pressed", wished);
    $("i", wish).className = `fa-${wished ? "solid" : "regular"} fa-heart`;

    // share
    $$("[data-share]").forEach((a) => {
      const u = encodeURIComponent(location.href);
      const t = encodeURIComponent(p.name);
      a.href = { facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`, x: `https://x.com/intent/post?url=${u}&text=${t}`, linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` }[a.dataset.share];
    });
    $("#copy-link")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        toast("Link copied");
      } catch {
        toast("Could not copy the link", "error");
      }
    });

    // tabs (roving focus with arrow keys)
    const tabs = $$('[role="tab"]');
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        $(`#${t.getAttribute("aria-controls")}`).hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
        if (n === null) return;
        const target = tabs[(n + tabs.length) % tabs.length];
        select(target);
        target.focus();
      });
    });
    $("#tab-specs-list").innerHTML = $("#p-specs").innerHTML;
    $("#review-score").textContent = p.rating.toFixed(1);
    $("#review-stars").outerHTML = stars(p.rating);
    $("#review-total").textContent = `Based on ${p.reviews.toLocaleString("en-US")} reviews`;

    // related: same category; also like: other categories with good ratings
    const others = window.ZM_PRODUCTS.filter((x) => x.id !== p.id);
    $("#related").innerHTML = others.filter((x) => x.category === p.category).slice(0, 10).map((x) => card(x)).join("");
    $("#also-like").innerHTML = others.filter((x) => x.category !== p.category).sort((a, b) => b.rating - a.rating).slice(0, 10).map((x) => card(x)).join("");

    // recently viewed (for My page)
    write("zm_viewed", [p.id, ...read("zm_viewed", []).filter((x) => x !== p.id)].slice(0, 12));
  };

  /* ---------- cart ---------- */
  pages.cart = () => {
    const body = $("#cart-body");
    const render = () => {
      const t = store.totals();
      $("#cart-layout").hidden = !t.count;
      $("#cart-empty").hidden = !!t.count;
      $("#cart-heading-count").textContent = t.count ? `(${t.count} ${t.count === 1 ? "item" : "items"})` : "";
      if (!t.count) {
        $("#empty-suggestions").innerHTML = window.ZM_PRODUCTS.filter((p) => p.tags.includes("top")).slice(0, 4).map((p) => card(p)).join("");
        return;
      }
      body.innerHTML = t.lines
        .map(
          ({ product: p, qty }) => `
          <div class="cart_row" role="row" data-id="${p.id}">
            <div class="cart_product" role="cell">
              <a class="cart_thumb" href="${productUrl(p)}"><img src="${url(p.image)}" alt="" /></a>
              <div>
                <a class="cart_name" href="${productUrl(p)}">${esc(p.name)}</a>
                <p class="cart_meta">${esc(p.brand)} · Color: ${esc(p.color)}</p>
              </div>
            </div>
            <div class="cart_price" role="cell"><span class="cell_label">Price</span>${fmt(p.price)}</div>
            <div class="cart_qty" role="cell">
              <span class="cell_label">Quantity</span>
              <div class="qty_stepper">
                <button type="button" data-step="-1" aria-label="Decrease quantity of ${esc(p.brand)} item" ${qty <= 1 ? "disabled" : ""}><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
                <input type="number" min="1" max="99" value="${qty}" inputmode="numeric" aria-label="Quantity" />
                <button type="button" data-step="1" aria-label="Increase quantity of ${esc(p.brand)} item"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
              </div>
            </div>
            <div class="cart_total" role="cell"><span class="cell_label">Total</span>${fmt(p.price * qty)}</div>
            <div class="cart_remove" role="cell"><button type="button" data-remove-line aria-label="Remove ${esc(p.brand)} item from cart"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></div>
          </div>`,
        )
        .join("");
      renderSummary(t);
    };
    const renderSummary = (t) => {
      $("#sum-subtotal").textContent = fmt(t.subtotal);
      $("#sum-discount").textContent = t.discount ? `−${fmt(t.discount)}` : fmt(0);
      $("#sum-shipping").textContent = t.shipping ? fmt(t.shipping) : "Free";
      $("#sum-tax").textContent = fmt(t.tax);
      $("#sum-total").textContent = fmt(t.total);
      const left = Math.max(0, FREE_SHIPPING_FROM - (t.subtotal - t.discount));
      $("#ship-text").innerHTML = left ? `Buy <strong>${fmt(left)}</strong> more to enjoy <strong>FREE Shipping</strong>` : `You’ve unlocked <strong>FREE Shipping</strong>`;
      $("#ship-bar").style.setProperty("--p", `${Math.min(100, ((t.subtotal - t.discount) / FREE_SHIPPING_FROM) * 100)}%`);
      $("#coupon-applied").hidden = !t.code;
      $("#coupon-applied-code").textContent = t.code;
    };
    body.addEventListener("click", (e) => {
      const row = e.target.closest(".cart_row");
      if (!row) return;
      const id = row.dataset.id;
      const step = e.target.closest("[data-step]");
      if (step) {
        const line = store.cart().find((l) => l.id === id);
        store.setQty(id, line.qty + Number(step.dataset.step));
        render();
        $(`.cart_row[data-id="${id}"] [data-step="${step.dataset.step}"]`)?.focus();
      }
      if (e.target.closest("[data-remove-line]")) {
        const p = window.ZM_findProduct(id);
        store.remove(id);
        render();
        toast(`${p.brand} item removed`);
        $("[data-remove-line]")?.focus();
      }
    });
    body.addEventListener("change", (e) => {
      if (e.target.type !== "number") return;
      store.setQty(e.target.closest(".cart_row").dataset.id, Number(e.target.value) || 1);
      render();
    });
    $("#coupon-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = e.target.code;
      const code = input.value.trim().toUpperCase();
      if (!code) return fieldError(input, "Enter a coupon code.");
      if (!COUPONS[code]) return fieldError(input, "This code is not valid. Try ZEN10.");
      fieldError(input, "");
      store.setCoupon(code);
      input.value = "";
      render();
      toast(`Coupon ${code} applied`);
    });
    $("#coupon-remove").addEventListener("click", () => {
      store.setCoupon("");
      render();
    });
    $("#clear-cart").addEventListener("click", () => {
      store.setCart([]);
      render();
      toast("Your cart is empty now");
    });
    render();
  };

  /* ---------- checkout ---------- */
  pages.checkout = () => {
    const t = store.totals();
    if (!t.count) {
      $("#checkout-layout").hidden = true;
      $("#checkout-empty").hidden = false;
      return;
    }
    $("#order-lines").innerHTML = t.lines
      .map(({ product: p, qty }) => `<li><img src="${url(p.image)}" alt="" /><span>${esc(p.name)} <b>× ${qty}</b></span><strong>${fmt(p.price * qty)}</strong></li>`)
      .join("");
    $("#co-subtotal").textContent = fmt(t.subtotal);
    $("#co-discount-row").hidden = !t.discount;
    $("#co-discount").textContent = `−${fmt(t.discount)}`;
    $("#co-shipping").textContent = t.shipping ? fmt(t.shipping) : "Free";
    $("#co-tax").textContent = fmt(t.tax);
    $("#co-total").textContent = fmt(t.total);

    const form = $("#checkout-form");
    const user = store.user();
    if (user) {
      form.first.value ||= user.name.split(" ")[0] || "";
      form.last.value ||= user.name.split(" ").slice(1).join(" ");
      form.email.value ||= user.email || "";
      form.phone.value ||= user.phone || "";
    }
    const shipToggle = form.ship_other;
    const shipFields = $("#ship-fields");
    shipToggle.addEventListener("change", () => (shipFields.hidden = !shipToggle.checked));
    form.addEventListener("change", (e) => {
      if (e.target.name === "payment") $$(".pay_option").forEach((o) => o.classList.toggle("selected", o.contains(e.target) && e.target.checked));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return toast("Please check the highlighted fields", "error");
      const btn = $("#place-order");
      btn.disabled = true;
      btn.classList.add("loading");
      btn.querySelector("span").textContent = "Placing order…";
      const totals = store.totals();
      const order = {
        number: String(Math.floor(100000 + Math.random() * 900000)),
        date: new Date().toISOString(),
        items: totals.lines.map(({ product: p, qty }) => ({ id: p.id, name: p.name, image: p.image, price: p.price, qty })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
        payment: form.payment.value,
        email: form.email.value.trim(),
        name: `${form.first.value.trim()} ${form.last.value.trim()}`,
        address: `${form.address.value.trim()}, ${form.city.value.trim()} ${form.zip.value.trim()}, ${form.country.value}`,
      };
      setTimeout(() => {
        store.addOrder(order);
        write("zm_last_order", order.number);
        store.setCart([]);
        store.setCoupon("");
        location.href = url(`order/received.html?order=${order.number}`);
      }, 700);
    });
  };

  /* ---------- order received ---------- */
  pages.received = () => {
    const number = new URLSearchParams(location.search).get("order") || read("zm_last_order", "");
    const order = store.orders().find((o) => o.number === number);
    if (!order) {
      $("#received").hidden = true;
      $("#received-empty").hidden = false;
      return;
    }
    const PAY = { bank: "Direct bank transfer", card: "Credit / debit card", cod: "Cash on delivery" };
    $("#o-number").textContent = order.number;
    $("#o-date").textContent = new Date(order.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    $("#o-total").textContent = fmt(order.total);
    $("#o-payment").textContent = PAY[order.payment] || order.payment;
    $("#o-email").textContent = order.email;
    $("#o-lines").innerHTML = order.items.map((i) => `<li><img src="${url(i.image)}" alt="" /><span>${esc(i.name)} <b>× ${i.qty}</b></span><strong>${fmt(i.price * i.qty)}</strong></li>`).join("");
    $("#o-subtotal").textContent = fmt(order.subtotal);
    $("#o-discount-row").hidden = !order.discount;
    $("#o-discount").textContent = `−${fmt(order.discount)}`;
    $("#o-shipping").textContent = order.shipping ? fmt(order.shipping) : "Free shipping";
    $("#o-tax").textContent = fmt(order.tax);
    $("#o-payment-row").textContent = PAY[order.payment] || order.payment;
    $("#o-grand").textContent = fmt(order.total);
    $("#o-address").textContent = `${order.name} — ${order.address}`;
  };

  /* ---------- login / register ---------- */
  pages.login = () => {
    const form = $("#login-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      const saved = store.user();
      const id = form.identifier.value.trim();
      const name = saved && (saved.email === id || saved.username === id) ? saved.name : id.includes("@") ? id.split("@")[0] : id;
      store.setUser({ ...(saved || {}), name: saved?.name || name.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), email: saved?.email || (id.includes("@") ? id : ""), username: saved?.username || (id.includes("@") ? "" : id) });
      toast("Signed in");
      setTimeout(() => (location.href = url(new URLSearchParams(location.search).get("next") || "mypage/index.html")), 500);
    });
  };
  pages.signup = () => {
    const form = $("#signup-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      store.setUser({ name: form.name.value.trim(), email: form.email.value.trim(), username: form.email.value.trim().split("@")[0], phone: "" });
      toast("Account created — welcome to Zenmart");
      setTimeout(() => (location.href = url("mypage/index.html")), 600);
    });
  };

  /* ---------- my page ---------- */
  pages.mypage = () => {
    const user = store.user();
    if (!user) {
      $("#account").hidden = true;
      $("#account-guest").hidden = false;
      // the wishlist works without an account: show what was saved in this browser
      const saved = store.wishlist().map(window.ZM_findProduct).filter(Boolean);
      if (saved.length) {
        $("#guest-wish").hidden = false;
        $("#guest-wish-grid").innerHTML = saved.map((p) => card(p)).join("");
      }
      return;
    }
    $("#acc-name").textContent = user.name;
    $("#acc-email").textContent = user.email || user.username;
    $("#acc-avatar").textContent = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

    const sections = $$("[data-section]");
    const links = $$("[data-section-link]");
    const show = (name) => {
      const target = sections.some((s) => s.dataset.section === name) ? name : "details";
      sections.forEach((s) => (s.hidden = s.dataset.section !== target));
      links.forEach((l) => {
        const on = l.dataset.sectionLink === target;
        l.classList.toggle("active", on);
        on ? l.setAttribute("aria-current", "page") : l.removeAttribute("aria-current");
      });
      $("#acc-title").textContent = links.find((l) => l.dataset.sectionLink === target)?.textContent.trim() || "Account Details";
    };
    const fromHash = () => show(location.hash.slice(1) || "details");
    addEventListener("hashchange", fromHash);
    fromHash();

    // details: profile / password / permissions sub-tabs
    const subTabs = $$("[data-sub]");
    subTabs.forEach((t) =>
      t.addEventListener("click", () => {
        subTabs.forEach((x) => x.setAttribute("aria-selected", x === t));
        $$("[data-sub-panel]").forEach((p) => (p.hidden = p.dataset.subPanel !== t.dataset.sub));
      }),
    );

    const profile = $("#profile-form");
    const [first, ...rest] = user.name.split(" ");
    profile.first.value = first || "";
    profile.last.value = rest.join(" ");
    profile.email.value = user.email || "";
    profile.phone.value = user.phone || "";
    profile.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(profile)) return;
      store.setUser({ ...user, name: `${profile.first.value.trim()} ${profile.last.value.trim()}`.trim(), email: profile.email.value.trim(), phone: profile.phone.value.trim() });
      $("#acc-name").textContent = store.user().name;
      $("#acc-email").textContent = store.user().email;
      toast("Profile saved");
    });
    const pw = $("#password-form");
    pw.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(pw)) return;
      pw.reset();
      toast("Password updated (demo — nothing is stored)");
    });
    const perms = $("#permissions-form");
    const saved = read("zm_permissions", { sms: true, email: true, call: false });
    Object.entries(saved).forEach(([k, v]) => perms.elements[k] && (perms.elements[k].checked = v));
    perms.addEventListener("submit", (e) => {
      e.preventDefault();
      write("zm_permissions", { sms: perms.sms.checked, email: perms.email.checked, call: perms.call.checked });
      toast("Preferences saved");
    });
    $$("[data-cancel]").forEach((b) => b.addEventListener("click", () => location.reload()));

    // orders + invoices
    const orders = store.orders();
    const PAY = { bank: "Bank transfer", card: "Card", cod: "Cash on delivery" };
    const ordersHtml = orders.length
      ? `<div class="order_list">${orders
          .map(
            (o) => `<article class="order_card">
              <header><div><span>Order</span><strong>#${o.number}</strong></div><div><span>Date</span><strong>${new Date(o.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</strong></div><div><span>Total</span><strong>${fmt(o.total)}</strong></div><span class="status">Processing</span></header>
              <ul>${o.items.map((i) => `<li><img src="${url(i.image)}" alt="" /><span>${esc(i.name)}</span><b>× ${i.qty}</b></li>`).join("")}</ul>
              <a class="btn btn_outline btn_sm" href="${url(`order/received.html?order=${o.number}`)}">View details</a>
            </article>`,
          )
          .join("")}</div>`
      : `<div class="empty_state"><i class="fa-solid fa-box-open" aria-hidden="true"></i><h3>No orders yet</h3><p>When you place an order it shows up here.</p><a class="btn btn_primary" href="${url("product/all.html")}">Start shopping</a></div>`;
    $("#orders-list").innerHTML = ordersHtml;
    $("#invoices-list").innerHTML = orders.length
      ? `<table class="data_table"><thead><tr><th scope="col">Invoice</th><th scope="col">Date</th><th scope="col">Payment</th><th scope="col" class="num">Amount</th></tr></thead><tbody>${orders
          .map((o) => `<tr><td>INV-${o.number}</td><td>${new Date(o.date).toLocaleDateString("en-GB")}</td><td>${PAY[o.payment] || o.payment}</td><td class="num">${fmt(o.total)}</td></tr>`)
          .join("")}</tbody></table>`
      : `<div class="empty_state"><i class="fa-regular fa-file-lines" aria-hidden="true"></i><h3>No invoices</h3><p>Invoices are created for every order.</p></div>`;

    // wishlist
    const renderWish = () => {
      const items = store.wishlist().map(window.ZM_findProduct).filter(Boolean);
      $("#wishlist-grid").innerHTML = items.length
        ? items.map((p) => card(p)).join("")
        : `<div class="empty_state"><i class="fa-regular fa-heart" aria-hidden="true"></i><h3>Your wishlist is empty</h3><p>Tap the heart on any product to save it for later.</p><a class="btn btn_primary" href="${url("product/all.html")}">Browse products</a></div>`;
    };
    renderWish();
    document.addEventListener("zm:wishlist", renderWish);

    // address
    const addr = $("#address-form");
    const savedAddr = read("zm_address", {});
    Object.entries(savedAddr).forEach(([k, v]) => addr.elements[k] && (addr.elements[k].value = v));
    addr.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(addr)) return;
      write("zm_address", Object.fromEntries(new FormData(addr)));
      toast("Address saved");
    });

    $("#logout").addEventListener("click", () => {
      store.setUser(null);
      location.href = url("index.html");
    });
  };

  /* ---------- about: numbers come from the catalogue itself ---------- */
  pages.about = () => {
    const P = window.ZM_PRODUCTS;
    const stat = {
      products: P.length,
      brands: new Set(P.map((p) => p.brand)).size,
      categories: new Set(P.map((p) => p.category)).size,
      rating: (P.reduce((s, p) => s + p.rating, 0) / P.length).toFixed(1) + " / 5",
    };
    $$("[data-stat]").forEach((el) => (el.textContent = stat[el.dataset.stat]));
  };

  /* ---------- contact ---------- */
  pages.contact = () => {
    const form = $("#contact-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      form.reset();
      $("#contact-sent").hidden = false;
      $("#contact-sent").focus();
    });
  };

  /* ===================================================================== boot */

  mountLayout();
  pages[PAGE]?.();
  initCarousels();
  initCountdown();
  refreshCartBadge();

  // reveal-on-scroll for sections that opt in (respects reduced motion via CSS)
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    $$("[data-reveal]").forEach((el) => io.observe(el));
  } else $$("[data-reveal]").forEach((el) => el.classList.add("in"));

  window.ZM = { store, card, fmt, url, toast };
})();
