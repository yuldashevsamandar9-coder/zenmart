/**
 * Zenmart sample catalogue (demo content — not a real store).
 * Product names come from the Figma design; prices are illustrative.
 * image paths are relative to the site root.
 */
window.ZM_CATEGORIES = [
  { id: "tv", name: "TVs & Home Theatre", image: "public/images/category/tv.png" },
  { id: "computers", name: "Computers & Tablets", image: "public/images/category/computer.png" },
  { id: "smart-home", name: "Smart Home", image: "public/images/category/smart.png" },
  { id: "audio", name: "Headphones & Speakers", image: "public/images/category/headphone.png" },
  { id: "phones", name: "Cell Phones & Wearables", image: "public/images/category/phone.png" },
  { id: "gaming", name: "Video Games & Consoles", image: "public/images/category/game.png" },
];

(function () {
  const P = "public/images/products/";
  const L = "public/images/products/laptops/";

  /** short helper so every entry reads as one line of facts */
  const item = (id, brand, name, category, price, oldPrice, image, extra = {}) => ({
    id,
    brand,
    name,
    category,
    price,
    oldPrice,
    image: (image.startsWith("public/") ? "" : P) + image,
    rating: extra.rating ?? 4.6,
    reviews: extra.reviews ?? 1240,
    color: extra.color ?? "Black",
    specs: extra.specs ?? {},
    gallery: extra.gallery,
    tags: extra.tags ?? [],
  });

  const laptop = (n, brand, name, price, oldPrice, specs, extra = {}) =>
    item(`laptop-${String(n).padStart(2, "0")}`, brand, name, "computers", price, oldPrice, `${L}laptop-${String(n).padStart(2, "0")}.jpg`, {
      color: specs.Color,
      specs,
      tags: ["laptop"],
      ...extra,
    });

  window.ZM_PRODUCTS = [
    // ---------- home: top selling ----------
    item("apple-watch-se", "Apple", "Apple Watch SE (GPS) 40mm Space Grey Aluminium Case with Midnight Sport Band", "phones", 249, 279, "watch.png", { rating: 4.8, reviews: 3014, color: "Space Grey", tags: ["top"] }),
    item("iphone-11", "Apple", "Apple iPhone 11 64GB Smartphone – Black", "phones", 499, 599, "phone.png", { rating: 4.7, reviews: 2210, tags: ["top"] }),
    item("irobot-roomba-i3", "iRobot", "iRobot Roomba i3+ EVO Wi-Fi Connected Self-Emptying Robot Vacuum", "smart-home", 399, 549, "iRobot.png", { rating: 4.5, reviews: 1876, tags: ["top"] }),
    item("dyson-v7", "Dyson", "Dyson V7 Complete Cordless Stick Vacuum – Iron / Blue", "smart-home", 329, 399, "dyson.png", { rating: 4.6, reviews: 964, color: "Iron / Blue", tags: ["top"] }),
    item("canon-t100", "Canon", "Canon EOS Rebel T100 Digital SLR Camera with 18-55mm Lens", "cameras", 449, 499, "canon_camera.png", { rating: 4.7, reviews: 1532, tags: ["top", "deal"] }),

    // ---------- home: TV & home theatre ----------
    item("samsung-tv-58", "Samsung", 'Samsung 58" 4K UHD HDR LED Tizen Smart TV', "tv", 529, 599, "samsung_tv.png", { rating: 4.6, reviews: 2087, tags: ["tv"] }),
    item("tcl-40", "TCL", 'TCL 3-Series 40" 1080p HD LED Android Smart TV', "tv", 249, 299, "tcl.png", { rating: 4.4, reviews: 1120, tags: ["tv"] }),
    item("lg-uhd-65", "LG", 'LG 65" 4K UHD HDR LED webOS Smart TV', "tv", 699, 849, "LG-UHD.png", { rating: 4.5, reviews: 860, tags: ["tv"] }),
    item("lg-oled-55", "LG", 'LG 55" 4K UHD HDR OLED webOS Evo ThinQ AI TV', "tv", 1399, 1599, "LG-OLED.png", { rating: 4.9, reviews: 742, tags: ["tv"] }),
    item("sony-x85j-65", "Sony", 'Sony X85J 65" 4K UHD HDR LED Smart Google TV', "tv", 1099, 1299, "SONY-TV.png", { rating: 4.8, reviews: 1388, tags: ["tv"] }),

    // ---------- home: deals of the day ----------
    item("samsung-chromebook-4", "Samsung", 'Samsung Chromebook 4+ 15.6" Intel Celeron N4000 / 4GB RAM / 32GB eMMC', "computers", 299, 349, "sony_notebook.png", { rating: 4.3, reviews: 688, color: "Platinum Titan", tags: ["deal"] }),
    item("ps5", "Sony", "Sony PlayStation 5 Video Game Console", "gaming", 499, 549, "sony_playstation.png", { rating: 4.9, reviews: 5120, color: "White", tags: ["deal"] }),
    item("apple-watch-3", "Apple", "Apple Watch Series 3 (GPS) 38mm Space Grey Aluminium – Black Sport Band", "phones", 199, 229, "apple_watch.png", { rating: 4.6, reviews: 2733, color: "Space Grey", tags: ["deal"] }),

    // ---------- audio ----------
    item("beats-studio-buds", "Beats", "Beats Studio Buds True Wireless Noise Cancelling Earbuds – Moon Grey", "audio", 149, 179, "headphone.png", { rating: 4.5, reviews: 1914, color: "Moon Grey", tags: ["audio", "true-wireless"] }),
    item("sony-wh1000xm4", "Sony", "Sony WH-1000XM4 Over-Ear Noise Cancelling Bluetooth Headphones – Midnight Blue", "audio", 279, 349, "sony_headphone.png", { rating: 4.8, reviews: 3311, color: "Midnight Blue", tags: ["audio", "over-ear"] }),
    item("beats-solo3", "Beats", "Beats Solo3 Wireless On-Ear Headphones – Matte Black", "audio", 129, 199, "on-ear.png", { rating: 4.5, reviews: 2602, tags: ["audio", "on-ear"] }),
    item("shokz-openrun", "Shokz", "Shokz OpenRun Bone Conduction Open-Ear Sport Headphones", "audio", 119, 129, "fitness_headphone.png", { rating: 4.6, reviews: 1045, color: "Black / Neon", tags: ["audio", "sport"] }),
    item("powerbeats-pro", "Beats", "Powerbeats Pro Totally Wireless High-Performance Earphones", "audio", 179, 249, "bluetooth_headphones.png", { rating: 4.7, reviews: 2458, tags: ["audio", "bluetooth"] }),

    // ---------- laptops (Figma "Laptops and Accessories", items 1–20) ----------
    laptop(1, "Lenovo", 'Lenovo IdeaPad 3 15.6" Laptop – Sand (Intel Core i7-1165G7 / 512GB SSD / 12GB RAM / Windows 11)', 899.99, 1049, { Brand: "Lenovo", "Model Name": "IdeaPad 3", "Screen Size": "15.6 Inches", Color: "Sand", "Hard Disk Size": "512 GB SSD", "CPU Model": "Intel Core i7-1165G7", "RAM Memory Installed": "12 GB" }, { rating: 4.5, reviews: 1290 }),
    laptop(2, "ASUS", 'ASUS TUF Dash 15 15.6" Gaming Laptop – Grey (Intel Core i7-11370H / 512GB SSD / 16GB RAM / RTX 3060)', 1099, 1299, { Brand: "ASUS", "Model Name": "TUF Dash 15", "Screen Size": "15.6 Inches", Color: "Grey", "Hard Disk Size": "512 GB SSD", "CPU Model": "Intel Core i7-11370H", "RAM Memory Installed": "16 GB" }, { rating: 4.6, reviews: 874, tags: ["laptop", "gaming"] }),
    laptop(3, "Apple", 'Apple MacBook Air 13.3" with Touch ID (Fall 2020) – Space Grey (Apple M1 Chip / 256GB SSD / 8GB RAM)', 899, 999, { Brand: "Apple", "Model Name": "MacBook Air", "Screen Size": "13.3 Inches", Color: "Space Grey", "Hard Disk Size": "256 GB SSD", "CPU Model": "Apple M1", "RAM Memory Installed": "8 GB" }, { rating: 4.9, reviews: 4120 }),
    laptop(4, "HP", 'HP 14" Laptop – Silver (Intel Core i3-1115G4 / 512GB SSD / 8GB RAM / Windows 10)', 449, 529, { Brand: "HP", "Model Name": "HP 14", "Screen Size": "14 Inches", Color: "Silver", "Hard Disk Size": "512 GB SSD", "CPU Model": "Intel Core i3-1115G4", "RAM Memory Installed": "8 GB" }, { rating: 4.3, reviews: 652 }),
    laptop(5, "ASUS", 'ASUS VivoBook 15 X515 15.6" Laptop – Slate Grey (Intel Core i3-1005G1 / 256GB SSD / 8GB RAM)', 429, 499, { Brand: "ASUS", "Model Name": "VivoBook 15 X515", "Screen Size": "15.6 Inches", Color: "Slate Grey", "Hard Disk Size": "256 GB SSD", "CPU Model": "Intel Core i3-1005G1", "RAM Memory Installed": "8 GB" }, { rating: 4.4, reviews: 1033 }),
    laptop(6, "Microsoft", 'Microsoft Surface Laptop Go 12.4" Touchscreen Intel Core i5 – Certified Refurbished', 499, 649, { Brand: "Microsoft", "Model Name": "Surface Laptop Go", "Screen Size": "12.4 Inches", Color: "Platinum", "Hard Disk Size": "128 GB SSD", "CPU Model": "Intel Core i5-1035G1", "RAM Memory Installed": "8 GB" }, { rating: 4.4, reviews: 512 }),
    laptop(7, "Dell", 'Dell XPS 13.4" Touchscreen Laptop – Silver (Intel Evo Core i7-1185G7 / 512GB SSD / 16GB RAM)', 1299, 1499, { Brand: "Dell", "Model Name": "XPS 13", "Screen Size": "13.4 Inches", Color: "Silver", "Hard Disk Size": "512 GB SSD", "CPU Model": "Intel Core i7-1185G7", "RAM Memory Installed": "16 GB" }, { rating: 4.7, reviews: 1508 }),
    laptop(8, "Apple", 'Apple MacBook Pro 16" (2021) – Space Grey (Apple M1 Pro Chip / 512GB SSD / 16GB RAM)', 2299, 2499, { Brand: "Apple", "Model Name": "MacBook Pro", "Screen Size": "16.2 Inches", Color: "Space Grey", "Hard Disk Size": "512 GB SSD", "CPU Model": "Apple M1 Pro", "RAM Memory Installed": "16 GB" }, { rating: 4.9, reviews: 2860 }),
    laptop(9, "Apple", 'Apple MacBook Pro 16" (2021) – Space Grey (Apple M1 Pro Chip / 1TB SSD / 16GB RAM)', 2499, 2699, { Brand: "Apple", "Model Name": "MacBook Pro", "Screen Size": "16.2 Inches", Color: "Space Grey", "Hard Disk Size": "1 TB SSD", "CPU Model": "Apple M1 Pro", "RAM Memory Installed": "16 GB" }, {
      rating: 4.9,
      reviews: 3014,
      gallery: ["public/images/gallery/macbook-1.jpg", "public/images/gallery/macbook-2.jpg", "public/images/gallery/macbook-3.jpg"],
      tags: ["laptop", "featured"],
    }),
    laptop(10, "Apple", 'Apple MacBook Air 13.3" with Touch ID (2020) – Space Grey (Intel Core i3 1.1GHz / 256GB SSD / 8GB RAM)', 749, 999, { Brand: "Apple", "Model Name": "MacBook Air", "Screen Size": "13.3 Inches", Color: "Space Grey", "Hard Disk Size": "256 GB SSD", "CPU Model": "Intel Core i3", "RAM Memory Installed": "8 GB" }, { rating: 4.5, reviews: 977 }),
    laptop(11, "HP", 'HP 17.3" Laptop – Natural Silver (Intel Core i5-1135G7 / 1TB HDD / 256GB SSD / 16GB RAM)', 699, 799, { Brand: "HP", "Model Name": "HP 17", "Screen Size": "17.3 Inches", Color: "Natural Silver", "Hard Disk Size": "1 TB HDD + 256 GB SSD", "CPU Model": "Intel Core i5-1135G7", "RAM Memory Installed": "16 GB" }, { rating: 4.4, reviews: 588 }),
    laptop(12, "Dell", 'Dell XPS 13 13.4" Touchscreen Laptop – Silver (Intel Evo i7-1195G7 / 512GB SSD / 16GB RAM)', 1399, 1599, { Brand: "Dell", "Model Name": "XPS 13", "Screen Size": "13.4 Inches", Color: "Silver", "Hard Disk Size": "512 GB SSD", "CPU Model": "Intel Core i7-1195G7", "RAM Memory Installed": "16 GB" }, { rating: 4.7, reviews: 690 }),
    laptop(13, "Samsung", 'Samsung Galaxy Book 15.6" Laptop – Silver (Intel Core i5-1135G7 / 256GB SSD / 8GB RAM)', 649, 749, { Brand: "Samsung", "Model Name": "Galaxy Book", "Screen Size": "15.6 Inches", Color: "Silver", "Hard Disk Size": "256 GB SSD", "CPU Model": "Intel Core i5-1135G7", "RAM Memory Installed": "8 GB" }, { rating: 4.5, reviews: 431 }),
    laptop(14, "ASUS", 'ASUS VivoBook 15 X515 15.6" Laptop – Grey (Intel Pentium Silver N5030 / 256GB SSD / 8GB RAM)', 379, 449, { Brand: "ASUS", "Model Name": "VivoBook 15 X515", "Screen Size": "15.6 Inches", Color: "Grey", "Hard Disk Size": "256 GB SSD", "CPU Model": "Intel Pentium Silver N5030", "RAM Memory Installed": "8 GB" }, { rating: 4.2, reviews: 352 }),
    laptop(15, "HP", 'HP ENVY 13.3" Laptop – Natural Silver (Intel Evo i5-1135G7 / 512GB SSD / 8GB RAM)', 849, 999, { Brand: "HP", "Model Name": "ENVY 13", "Screen Size": "13.3 Inches", Color: "Natural Silver", "Hard Disk Size": "512 GB SSD", "CPU Model": "Intel Core i5-1135G7", "RAM Memory Installed": "8 GB" }, { rating: 4.6, reviews: 744 }),
    laptop(16, "Apple", 'Apple MacBook Pro 13.3" Retina (Intel Core i5 2.7GHz / 8GB RAM / 128GB SSD) 2015 – Refurbished', 399, 549, { Brand: "Apple", "Model Name": "MacBook Pro", "Screen Size": "13.3 Inches", Color: "Silver", "Hard Disk Size": "128 GB SSD", "CPU Model": "Intel Core i5", "RAM Memory Installed": "8 GB" }, { rating: 4.1, reviews: 219 }),
    laptop(17, "Apple", 'Apple MacBook Air 13.3" with Touch ID (2020) – Gold (Intel Core i3 1.1GHz / 256GB SSD / 8GB RAM)', 749, 999, { Brand: "Apple", "Model Name": "MacBook Air", "Screen Size": "13.3 Inches", Color: "Gold", "Hard Disk Size": "256 GB SSD", "CPU Model": "Intel Core i3", "RAM Memory Installed": "8 GB" }, { rating: 4.5, reviews: 301 }),
    laptop(18, "Dell", 'Dell Inspiron 3000 15.6" Touchscreen Laptop – Black (Intel Core i5-1035G1 / 256GB SSD / 8GB RAM)', 549, 649, { Brand: "Dell", "Model Name": "Inspiron 3000", "Screen Size": "15.6 Inches", Color: "Black", "Hard Disk Size": "256 GB SSD", "CPU Model": "Intel Core i5-1035G1", "RAM Memory Installed": "8 GB" }, { rating: 4.3, reviews: 506 }),
    laptop(19, "LG", 'LG Gram 17" Laptop – Obsidian Black (Intel Evo Core i7-1165G7 / 1TB SSD / 16GB RAM)', 1499, 1699, { Brand: "LG", "Model Name": "Gram 17", "Screen Size": "17 Inches", Color: "Obsidian Black", "Hard Disk Size": "1 TB SSD", "CPU Model": "Intel Core i7-1165G7", "RAM Memory Installed": "16 GB" }, { rating: 4.7, reviews: 618 }),
    laptop(20, "HP", 'HP 15.6" Touchscreen Laptop – Natural Silver (AMD Ryzen 5 5625U / 1TB SSD / 12GB RAM)', 629, 729, { Brand: "HP", "Model Name": "HP 15", "Screen Size": "15.6 Inches", Color: "Natural Silver", "Hard Disk Size": "1 TB SSD", "CPU Model": "AMD Ryzen 5 5625U", "RAM Memory Installed": "12 GB" }, { rating: 4.4, reviews: 467 }),

    // ---------- product list: top selling laptops (existing artwork) ----------
    item("acer-aspire-5", "Acer", 'Acer Aspire 5 15.6" Laptop – Silver (Intel Core i5-1135G7 / 512GB SSD / 8GB RAM)', "computers", 549, 649, "acer_silver.png", { rating: 4.5, reviews: 2190, color: "Silver", tags: ["laptop", "top-laptop"] }),
    item("acer-nitro-5", "Acer", 'Acer Nitro 5 15.6" Gaming Laptop – Black (Intel Core i5-11400H / 512GB SSD / 16GB RAM / RTX 3050)', "computers", 849, 999, "nitro_laptop.png", { rating: 4.6, reviews: 1788, tags: ["laptop", "gaming", "top-laptop"] }),
    item("surface-laptop-go", "Microsoft", 'Microsoft Surface Laptop Go 12.4" Touchscreen – Platinum (Intel Core i5 / 128GB SSD / 8GB RAM)', "computers", 599, 699, "sony_laptop.png", { rating: 4.5, reviews: 920, color: "Platinum", tags: ["laptop", "top-laptop"] }),
    item("acer-aspire-5-blue", "Acer", 'Acer Aspire 5 15.6" Laptop – Pure Silver (Intel Core i7-1165G7 / 512GB SSD / 16GB RAM)', "computers", 699, 799, "acer_laptop.png", { rating: 4.5, reviews: 840, color: "Pure Silver", tags: ["laptop", "top-laptop"] }),
    item("asus-vivobook-15-slate", "ASUS", 'ASUS VivoBook 15 X515 15.6" Laptop – Slate Grey (Intel Core i5-1135G7 / 512GB SSD / 8GB RAM)', "computers", 529, 599, "asus_laptop.png", { rating: 4.4, reviews: 1130, color: "Slate Grey", tags: ["laptop", "top-laptop"] }),
    item("asus-rog-strix-g15", "ASUS", 'ASUS ROG Strix G15 15.6" Gaming Laptop (AMD Ryzen 7 4800H / 512GB SSD / 16GB RAM / RTX 3060)', "computers", 1199, 1399, "rolex_laptop.png", { rating: 4.8, reviews: 1462, color: "Eclipse Grey", tags: ["laptop", "gaming", "top-laptop"] }),
  ];

  window.ZM_findProduct = (id) => window.ZM_PRODUCTS.find((p) => p.id === id);
})();
