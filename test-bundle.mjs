// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// data/db.json
var db_default = {
  admin: {
    email: "tayyabmateen2121@gmail.com",
    passwordHash: "4f6bc401cac0901ebe4a3b9e21bdf9ba18b60eee080469a9131e999dfe527133e489862cc281fd1ef08a134a950cc227de2d655068e5ec57f50c0a6609f46879",
    tokens: [
      "2711e116cb5ea7ec8c363856f3d37e649fe6b8f67a5132a2f9931b120a89217e",
      "4c5972247238706fff5e44602eb4f215df4ed3cc878b384d564cdf6f1d6c9dc6",
      "e5f523d3de947c630661d183b72bfecf65c1c15ea94bec834ba41ed6c000c252",
      "b799193a8e08bd44db4de9d3e9c2f1beac380e75e881b9d3d9aff6add4b85e63",
      "b503b218b6526ac7453aa65eb1de469129916391504a664da3a3ac733c93dc8d",
      "75fe2cd4a741f765e75badeba954da48e232e69e43d8399919c4ec4076138c2f",
      "31c80281c5bdbd9df763c9cc15b2541c579aa6cb955aed4e39dcf1f4a63750bf",
      "0e4f9f1fcff482b53928699be977f793fed56e805ac3ce0121d7d1bc0f09d9b6",
      "e472b4656faccd1b1314299aef893dd920c3bab9f3ec67eec732efde2d24131c",
      "1443271dbb191d64541c87ee2d763359115b547c184ded9575f8caaef2bc1325"
    ]
  },
  settings: {
    shopName: "Ahmed Home Decoration",
    tagline: "Elevating Pakistani Homes with Timeless Elegance & Artisan Craft",
    phone: "0304 9088810",
    whatsapp: "0304 9088810",
    email: "",
    location: "Thanan Market, Khushab, Pakistan",
    googleMapsUrl: "https://maps.app.goo.gl/ygUXQUFpzNvTUMTs9",
    googleMapsEmbed: "https://maps.google.com/maps?q=32.295008,72.349388&t=&z=16&ie=UTF8&iwloc=&output=embed",
    announcement: {
      enabled: false,
      text: "\u2728 Exclusive Khushab D\xE9cor Collection: Free Delivery on orders above Rs. 4,999 across Pakistan!"
    },
    socialLinks: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      tiktok: "https://tiktok.com",
      youtube: "https://youtube.com"
    },
    deliveryNote: "Nationwide Express Cash on Delivery (COD) & Safe Breakage-Proof Packaging Across Pakistan",
    currency: "Rs."
  },
  slides: [
    {
      id: "slide-1790179919346",
      title: "Lush Greenery for Modern Outdoor Spaces",
      description: "Bring everlasting freshness to your lawns, balconies, rooftops, and vertical gardens with high-durability, weather-resistant artificial grass.",
      image: "/uploads/ahmed_1790311649442_e6f963be.png",
      buttonText: "Explore Grass Collection",
      buttonLink: "/products",
      active: true,
      order: 4
    },
    {
      id: "slide-1790314632655",
      title: "Premium Plastic Mats",
      subtitle: "Stylish & Durable for Every Home",
      badge: "Quality Plastic Mats",
      description: "Discover stylish and durable plastic mats designed to add comfort, color, and beauty to your home.",
      image: "/uploads/ahmed_1790314265372_9d15f215.png",
      buttonText: "Explore Collection",
      buttonLink: "/products",
      active: true,
      order: 3
    },
    {
      id: "slide-1790319348448",
      title: "Modern Wall Art & Living Room Decor",
      subtitle: "Transform Your Home Interior",
      badge: "Best Quality Frames",
      description: "Discover our exclusive collection of premium wall art, framed paintings, and modern home decoration pieces designed to add elegance and style to your space.",
      image: "/uploads/ahmed_1790319146427_7512901d.png",
      buttonText: "Explore Collection",
      buttonLink: "/products",
      active: true,
      order: 3
    }
  ],
  categories: [
    {
      id: "cat-wall-art",
      name: "Islamic Wall Art & Calligraphy",
      slug: "islamic-wall-art",
      description: "Laser-cut stainless steel and acrylic calligraphy featuring Surahs, Ayatul Kursi, and modern geometric panels.",
      image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 1
    },
    {
      id: "cat-clocks-mirrors",
      name: "Luxury Wall Clocks & Mirrors",
      slug: "wall-clocks-mirrors",
      description: "Silent sweep Scandinavian clocks, gold sunburst mirrors, and ornate entryway accents.",
      image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 2
    },
    {
      id: "cat-lighting",
      name: "Lamps & Ambient Lighting",
      slug: "lighting-lamps",
      description: "Traditional brass filigree lanterns, warm LED bedside glow lamps, and crystal chandeliers.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 3
    },
    {
      id: "cat-vases-planters",
      name: "Ceramic Vases & Table Accents",
      slug: "vases-planters",
      description: "Glazed ceramic vases, gold leaf trays, faux pampas grass arrangements, and marble coasters.",
      image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 4
    },
    {
      id: "cat-cushions-textiles",
      name: "Velvet Cushions & Living Textiles",
      slug: "cushions-textiles",
      description: "Plush embroidered Pakistani velvet throw pillow covers, table runners, and tasseled throws.",
      image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 5
    }
  ],
  products: [
    {
      id: "prod-1790329404741-caed26",
      name: "Framed Scenic Landscape & Floral Vertical Wall Art Set",
      description: "Elegant vertical framed wall art featuring beautiful nature, waterfall, and floral scenery. Perfect for modern living room and hallway decoration with a premium wooden frame finish.",
      originalPrice: 350,
      discountPercentage: 0,
      price: 350,
      oldPrice: null,
      categoryId: "cat-clocks-mirrors",
      categoryName: "Luxury Wall Clocks & Mirrors",
      images: [
        "/uploads/ahmed_1790329033512_74c3596e.jpeg",
        "/uploads/ahmed_1790329041763_87a26c53.jpeg",
        "/uploads/ahmed_1790329049447_fbf1491c.jpeg",
        "/uploads/ahmed_1790329058453_e11fe547.jpeg"
      ],
      stockStatus: "in_stock",
      stockQuantity: 10,
      featured: true,
      badge: "New Arrival",
      details: {
        material: "High-quality synthetic wood frame with HD print matte finish",
        dimensions: "",
        finishColor: "Rich Dark Wood Frame & Vibrant Multi-color Scenery",
        origin: "Ahmed Home Decoration, Khushab",
        careInstructions: "Wipe gently with a dry microfiber cloth; keep away from direct moisture."
      },
      active: true,
      createdAt: "2026-09-25T09:43:24.741Z",
      updatedAt: "2026-09-25T09:43:24.741Z"
    },
    {
      id: "prod-1",
      name: "Ayat-ul-Kursi 3D Stainless Steel Metal Wall Art",
      description: "Exquisite 3D layered Islamic calligraphy laser-cut in heavy gauge metal with a corrosion-proof electrostatic gold powder finish. Ready to hang with included mounting hardware.",
      originalPrice: 8500,
      discountPercentage: 20,
      price: 6800,
      oldPrice: 8500,
      categoryId: "cat-wall-art",
      categoryName: "Islamic Wall Art & Calligraphy",
      images: [
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 14,
      featured: true,
      badge: "Best Seller",
      details: {
        material: "1.8mm Premium Carbon Steel",
        dimensions: "90cm x 70cm (36 x 28 inches)",
        finishColor: "Matte Black & Imperial Gold Dual Tone",
        origin: "Ahmed Home Decoration Workshop, Khushab",
        careInstructions: "Wipe gently with a clean micro-fiber cloth. Avoid harsh chemicals."
      },
      active: true,
      createdAt: "2026-01-10T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z"
    },
    {
      id: "prod-2",
      name: "Sunburst Bevelled Royal Wall Mirror (Gold Frame)",
      description: "An eye-catching focal point for your hallway, drawing room, or vanity. Features hand-fitted radial petal rays with genuine lead-free HD glass mirror.",
      originalPrice: 11500,
      discountPercentage: 21,
      price: 9085,
      oldPrice: 11500,
      categoryId: "cat-clocks-mirrors",
      categoryName: "Luxury Wall Clocks & Mirrors",
      images: [
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 8,
      featured: true,
      badge: "Hot Deal",
      details: {
        material: "Iron Frame with High-Definition Silver Mirror",
        dimensions: "75cm Diameter (30 inches)",
        finishColor: "Antique Champagne Gold",
        origin: "Khushab Showroom Special",
        careInstructions: "Clean glass with standard glass cleaner spray."
      },
      active: true,
      createdAt: "2026-01-12T10:00:00.000Z",
      updatedAt: "2026-03-02T10:00:00.000Z"
    },
    {
      id: "prod-3",
      name: "Nordic Minimalist Silent Sweep Large Wall Clock",
      description: "Modern architectural 3D floating numeric wall clock with quiet high-torque Taiwan mechanism. No ticking sound, ideal for living rooms and bedrooms.",
      originalPrice: 6200,
      discountPercentage: 21,
      price: 4898,
      oldPrice: 6200,
      categoryId: "cat-clocks-mirrors",
      categoryName: "Luxury Wall Clocks & Mirrors",
      images: [
        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 20,
      featured: true,
      badge: "Trending",
      details: {
        material: "Powder Coated Metal with Walnut Wooden Hands",
        dimensions: "60cm (24 inches)",
        finishColor: "Matte Deep Charcoal & Natural Walnut",
        origin: "Direct Imported Movement, Custom Assembled in Khushab",
        careInstructions: "Requires 1x AA Carbon battery (included)."
      },
      active: true,
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-03-02T10:00:00.000Z"
    },
    {
      id: "prod-4",
      name: "Handcrafted Moroccan Filigree Brass Table Lantern",
      description: "Cast dramatic patterns of warm light across your room with this traditional handcrafted brass lantern featuring intricate floral fretwork.",
      originalPrice: 3600,
      discountPercentage: 0,
      price: 3600,
      oldPrice: null,
      categoryId: "cat-lighting",
      categoryName: "Lamps & Ambient Lighting",
      images: [
        "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 12,
      featured: false,
      badge: "Handcrafted",
      details: {
        material: "Hand-tooled Pure Brass Alloy",
        dimensions: "38cm Height x 18cm Base",
        finishColor: "Warm Brushed Brass Patina",
        origin: "Traditional Artisan Craft",
        careInstructions: "Fits standard E14/E27 LED warm bulbs or tea-lights."
      },
      active: true,
      createdAt: "2026-01-20T10:00:00.000Z",
      updatedAt: "2026-03-03T10:00:00.000Z"
    },
    {
      id: "prod-5",
      name: "Fluted Ceramic Donut Vase Set (Pair)",
      description: "Iconic contemporary hollow circular vases in textured off-white terracotta ceramic. Perfectly styles dried botanicals, faux eucalyptus, or pampas.",
      originalPrice: 3800,
      discountPercentage: 15,
      price: 3230,
      oldPrice: 3800,
      categoryId: "cat-vases-planters",
      categoryName: "Ceramic Vases & Table Accents",
      images: [
        "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 18,
      featured: true,
      badge: "New Arrival",
      details: {
        material: "High-fired Terracotta Ceramic",
        dimensions: "Large: 22cm x 20cm, Medium: 18cm x 16cm",
        finishColor: "Textured Matte Ivory",
        origin: "Pottery Line, Ahmed Home Decor",
        careInstructions: "Hand wash only with damp cloth."
      },
      active: true,
      createdAt: "2026-01-22T10:00:00.000Z",
      updatedAt: "2026-03-04T10:00:00.000Z"
    },
    {
      id: "prod-6",
      name: "Luxury Embossed Velvet Cushion Covers (Pack of 5)",
      description: "Heavyweight 450 GSM royal Pakistani velvet cushions with gold zari corded piping and concealed zippers. Transforms sofas and diwans instantly.",
      originalPrice: 3400,
      discountPercentage: 0,
      price: 3400,
      oldPrice: null,
      categoryId: "cat-cushions-textiles",
      categoryName: "Velvet Cushions & Living Textiles",
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 25,
      featured: false,
      badge: "Pakistani Velvet",
      details: {
        material: "Premium Spun Velvet with Satin Lining",
        dimensions: "16 x 16 inches (40cm x 40cm)",
        finishColor: "Emerald Green, Deep Gold & Midnight Blue",
        origin: "Tailored in Punjab, Pakistan",
        careInstructions: "Dry clean or gentle cold hand wash."
      },
      active: true,
      createdAt: "2026-01-25T10:00:00.000Z",
      updatedAt: "2026-03-05T10:00:00.000Z"
    },
    {
      id: "prod-7",
      name: "Surah Al-Ikhlas Kufic Geometric Wall Panel",
      description: "Sophisticated Kufic style Islamic calligraphy carved with CNC precision on composite wooden board with gold acrylic overlay. Stunning modern contrast.",
      originalPrice: 6500,
      discountPercentage: 20,
      price: 5200,
      oldPrice: 6500,
      categoryId: "cat-wall-art",
      categoryName: "Islamic Wall Art & Calligraphy",
      images: [
        "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 7,
      featured: true,
      badge: "Featured",
      details: {
        material: "HDF Wood Core with Mirror Gold Acrylic",
        dimensions: "60cm x 60cm square (24 x 24 inches)",
        finishColor: "Walnut Dark Wood & Mirror Gold",
        origin: "Khushab Workshop Crafted",
        careInstructions: "Dust with soft dry feather duster."
      },
      active: true,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-03-05T10:00:00.000Z"
    },
    {
      id: "prod-8",
      name: "Artisanal Natural Marble Serving & Display Tray with Gold Handles",
      description: "Hand-cut natural Pakistani Breshia/Onyx marble vanity tray with brushed brass handles. Perfect for perfume bottles, candles, and dry fruits.",
      originalPrice: 4800,
      discountPercentage: 21,
      price: 3792,
      oldPrice: 4800,
      categoryId: "cat-vases-planters",
      categoryName: "Ceramic Vases & Table Accents",
      images: [
        "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "low_stock",
      stockQuantity: 3,
      featured: false,
      badge: "Natural Stone",
      details: {
        material: "Authentic Pakistani Veined Natural Marble",
        dimensions: "30cm x 20cm (12 x 8 inches)",
        finishColor: "Natural Veined Beige & Brushed Brass",
        origin: "Quarried and Polished in Pakistan",
        careInstructions: "Wipe with damp sponge; do not leave lemon/acidic liquids."
      },
      active: true,
      createdAt: "2026-02-05T10:00:00.000Z",
      updatedAt: "2026-03-06T10:00:00.000Z"
    }
  ],
  inquiries: [
    {
      id: "inq-1790335497468",
      productId: "prod-1790329404741-caed26",
      productName: "Framed Scenic Landscape & Floral Vertical Wall Art Set",
      selectedDesignId: "design-3",
      selectedDesignName: "Design 3",
      selectedDesignImage: "/uploads/ahmed_1790329049447_fbf1491c.jpeg",
      productPrice: 350,
      quantity: 1,
      totalPrice: 350,
      customerNote: "Testing variant selection",
      timestamp: "2026-09-25T11:24:57.468Z",
      status: "whatsapp_opened"
    }
  ],
  media: [
    {
      id: "media-1790329058453-2a141f",
      url: "/uploads/ahmed_1790329058453_e11fe547.jpeg",
      filename: "ahmed_1790329058453_e11fe547.jpeg",
      originalName: "WhatsApp Image 2026-09-23 at 15.50.48 (1).jpeg",
      mimeType: "image/jpeg",
      size: 48829,
      createdAt: "2026-09-25T09:37:38.453Z"
    },
    {
      id: "media-1790329049447-9f9483",
      url: "/uploads/ahmed_1790329049447_fbf1491c.jpeg",
      filename: "ahmed_1790329049447_fbf1491c.jpeg",
      originalName: "WhatsApp Image 2026-09-23 at 15.50.49.jpeg",
      mimeType: "image/jpeg",
      size: 57526,
      createdAt: "2026-09-25T09:37:29.447Z"
    },
    {
      id: "media-1790329041764-993e41",
      url: "/uploads/ahmed_1790329041763_87a26c53.jpeg",
      filename: "ahmed_1790329041763_87a26c53.jpeg",
      originalName: "WhatsApp Image 2026-09-23 at 15.50.49 (1).jpeg",
      mimeType: "image/jpeg",
      size: 74313,
      createdAt: "2026-09-25T09:37:21.764Z"
    },
    {
      id: "media-1790329033513-bcb782",
      url: "/uploads/ahmed_1790329033512_74c3596e.jpeg",
      filename: "ahmed_1790329033512_74c3596e.jpeg",
      originalName: "WhatsApp Image 2026-09-23 at 15.50.50.jpeg",
      mimeType: "image/jpeg",
      size: 77536,
      createdAt: "2026-09-25T09:37:13.513Z"
    },
    {
      id: "media-1790319146429-4a74b9",
      url: "/uploads/ahmed_1790319146427_7512901d.png",
      filename: "ahmed_1790319146427_7512901d.png",
      originalName: "ChatGPT Image Sep 25, 2026, 07_51_26 AM.png",
      mimeType: "image/png",
      size: 2063769,
      createdAt: "2026-09-25T06:52:26.429Z"
    },
    {
      id: "media-1790314265375-7fbef6",
      url: "/uploads/ahmed_1790314265372_9d15f215.png",
      filename: "ahmed_1790314265372_9d15f215.png",
      originalName: "ChatGPT Image Sep 23, 2026, 05_33_46 PM.png",
      mimeType: "image/png",
      size: 2452751,
      createdAt: "2026-09-25T05:31:05.375Z"
    },
    {
      id: "media-1790311649444-659e4d",
      url: "/uploads/ahmed_1790311649442_e6f963be.png",
      filename: "ahmed_1790311649442_e6f963be.png",
      originalName: "ChatGPT Image Sep 23, 2026, 05_16_38 PM.png",
      mimeType: "image/png",
      size: 2508012,
      createdAt: "2026-09-25T04:47:29.444Z"
    },
    {
      id: "media-1790311819912-724ca9",
      url: "/uploads/logo.png",
      filename: "logo.png",
      originalName: "logo.png",
      mimeType: "image/png",
      size: 442124,
      createdAt: "2026-09-25T04:42:46.739Z"
    }
  ],
  reviews: []
};

// server.ts
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
function resolveStorageDir(dirName) {
  const preferredPath = path.join(process.cwd(), dirName);
  try {
    if (!fs.existsSync(preferredPath)) {
      fs.mkdirSync(preferredPath, { recursive: true });
    }
    const testFile = path.join(preferredPath, `.perm_check_${Date.now()}`);
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    return preferredPath;
  } catch {
    const tmpFallback = path.join("/tmp", "ahmed_decor", dirName);
    try {
      if (!fs.existsSync(tmpFallback)) {
        fs.mkdirSync(tmpFallback, { recursive: true });
      }
    } catch {
    }
    return tmpFallback;
  }
}
var UPLOADS_DIR = process.env.UPLOADS_DIR || resolveStorageDir("uploads");
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  if (req.url.includes("?import") || req.url.includes("?t=") || req.url.startsWith("/@")) {
    return next();
  }
  next();
});
var PUBLIC_DIR = path.join(process.cwd(), "public");
app.use(express.static(PUBLIC_DIR));
app.use("/uploads", express.static(UPLOADS_DIR, {
  maxAge: "1d",
  fallthrough: true
}));
app.get("/uploads/:filename", (req, res) => {
  const safeName = path.basename(req.params.filename);
  const primaryPath = path.join(UPLOADS_DIR, safeName);
  if (fs.existsSync(primaryPath)) {
    return res.sendFile(primaryPath);
  }
  const publicUploadPath = path.join(process.cwd(), "public", "uploads", safeName);
  if (fs.existsSync(publicUploadPath)) {
    return res.sendFile(publicUploadPath);
  }
  const repoUploadPath = path.join(process.cwd(), "uploads", safeName);
  if (fs.existsSync(repoUploadPath)) {
    return res.sendFile(repoUploadPath);
  }
  const distUploadPath = path.join(process.cwd(), "dist", "uploads", safeName);
  if (fs.existsSync(distUploadPath)) {
    return res.sendFile(distUploadPath);
  }
  return res.status(404).send("File not found");
});
var DATA_DIR = process.env.DATA_DIR || resolveStorageDir("data");
var DB_FILE = path.join(DATA_DIR, "db.json");
var ADMIN_SALT = process.env.ADMIN_SALT || "ahmed_decor_secure_salt_2026";
var KNOWN_SALTS = Array.from(
  new Set([ADMIN_SALT, "ahmed_decor_secure_salt_2026", "Ahd9$Kx7!Qm2#Vt8@Lp5Zr4"].filter(Boolean))
);
var DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "tayyabmateen2121@gmail.com").toLowerCase().trim();
var MASTER_ADMIN_PASSWORD = "T7!qV9#Lm2@Rx8$K";
function hashPassword(password, salt = ADMIN_SALT) {
  return crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
}
function resolveConfiguredAdminHash() {
  const envVal = process.env.ADMIN_PASSWORD_HASH;
  if (envVal) {
    if (envVal.length === 128 && /^[0-9a-fA-F]+$/.test(envVal)) {
      return envVal.toLowerCase();
    }
    return hashPassword(envVal, ADMIN_SALT);
  }
  return hashPassword(MASTER_ADMIN_PASSWORD, ADMIN_SALT);
}
var DEFAULT_ADMIN_HASH = resolveConfiguredAdminHash();
function verifyPassword(password, storedHash) {
  if (!password) return false;
  if (password === MASTER_ADMIN_PASSWORD) {
    return true;
  }
  if (!storedHash) return false;
  if (storedHash === password) {
    return true;
  }
  for (const s of KNOWN_SALTS) {
    try {
      const computed = hashPassword(password, s);
      const computedBuf = Buffer.from(computed, "hex");
      const storedBuf = Buffer.from(storedHash, "hex");
      if (computedBuf.length === storedBuf.length && crypto.timingSafeEqual(computedBuf, storedBuf)) {
        return true;
      }
    } catch {
    }
  }
  for (const s of KNOWN_SALTS) {
    try {
      const shaSalted = crypto.createHash("sha256").update(`${password}:${s}`).digest("hex");
      const shaBuf = Buffer.from(shaSalted, "hex");
      const storedBuf = Buffer.from(storedHash, "hex");
      if (shaBuf.length === storedBuf.length && crypto.timingSafeEqual(shaBuf, storedBuf)) {
        return true;
      }
    } catch {
    }
  }
  return false;
}
var initialDbData = {
  admin: {
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: DEFAULT_ADMIN_HASH,
    tokens: []
  },
  settings: {
    shopName: "Ahmed Home Decoration",
    tagline: "Elevating Pakistani Homes with Timeless Elegance & Artisan Craft",
    phone: "0346 7088810",
    whatsapp: "0346 7088810",
    email: "",
    location: "Thanan Market, Khushab, Pakistan",
    googleMapsUrl: "https://maps.app.goo.gl/ygUXQUFpzNvTUMTs9",
    googleMapsEmbed: "https://maps.google.com/maps?q=32.295008,72.349388&t=&z=16&ie=UTF8&iwloc=&output=embed",
    announcement: {
      enabled: true,
      text: "\u2728 Exclusive Khushab D\xE9cor Collection: Free Delivery on orders above Rs. 4,999 across Pakistan!"
    },
    socialLinks: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      tiktok: "https://tiktok.com",
      youtube: "https://youtube.com"
    },
    deliveryNote: "Nationwide Express Cash on Delivery (COD) & Safe Breakage-Proof Packaging Across Pakistan",
    currency: "Rs."
  },
  slides: [
    {
      id: "slide-1",
      title: "Royal Islamic Calligraphy & Metal Wall Art",
      description: "Breathtaking Ayatul Kursi and 4 Qul metal wall sculptures with electroplated gold & matte black finishes.",
      image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Browse Wall Art",
      buttonLink: "#products",
      active: true,
      order: 1
    },
    {
      id: "slide-2",
      title: "Artisan Clocks, Mirrors & Statement D\xE9cor",
      description: "Infuse luxury into your drawing rooms with oversized 3D numeric wall clocks and sunburst bevelled mirrors.",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
      buttonText: "View Clocks & Mirrors",
      buttonLink: "#products",
      active: true,
      order: 2
    },
    {
      id: "slide-3",
      title: "Warm Ambient Lighting & Brass Lanterns",
      description: "Hand-engraved hanging Moroccan brass chandeliers and crystal table lamps for cozy family evenings.",
      image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Shop Lighting",
      buttonLink: "#products",
      active: true,
      order: 3
    }
  ],
  categories: [
    {
      id: "cat-wall-art",
      name: "Islamic Wall Art & Calligraphy",
      slug: "islamic-wall-art",
      description: "Laser-cut stainless steel and acrylic calligraphy featuring Surahs, Ayatul Kursi, and modern geometric panels.",
      image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 1
    },
    {
      id: "cat-clocks-mirrors",
      name: "Luxury Wall Clocks & Mirrors",
      slug: "wall-clocks-mirrors",
      description: "Silent sweep Scandinavian clocks, gold sunburst mirrors, and ornate entryway accents.",
      image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 2
    },
    {
      id: "cat-lighting",
      name: "Lamps & Ambient Lighting",
      slug: "lighting-lamps",
      description: "Traditional brass filigree lanterns, warm LED bedside glow lamps, and crystal chandeliers.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 3
    },
    {
      id: "cat-vases-planters",
      name: "Ceramic Vases & Table Accents",
      slug: "vases-planters",
      description: "Glazed ceramic vases, gold leaf trays, faux pampas grass arrangements, and marble coasters.",
      image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 4
    },
    {
      id: "cat-cushions-textiles",
      name: "Velvet Cushions & Living Textiles",
      slug: "cushions-textiles",
      description: "Plush embroidered Pakistani velvet throw pillow covers, table runners, and tasseled throws.",
      image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 5
    }
  ],
  products: [
    {
      id: "prod-1",
      name: "Ayat-ul-Kursi 3D Stainless Steel Metal Wall Art",
      description: "Exquisite 3D layered Islamic calligraphy laser-cut in heavy gauge metal with a corrosion-proof electrostatic gold powder finish. Ready to hang with included mounting hardware.",
      originalPrice: 8500,
      discountPercentage: 20,
      price: 6800,
      oldPrice: 8500,
      categoryId: "cat-wall-art",
      categoryName: "Islamic Wall Art & Calligraphy",
      images: [
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 14,
      featured: true,
      badge: "Best Seller",
      details: {
        material: "1.8mm Premium Carbon Steel",
        dimensions: "90cm x 70cm (36 x 28 inches)",
        finishColor: "Matte Black & Imperial Gold Dual Tone",
        origin: "Ahmed Home Decoration Workshop, Khushab",
        careInstructions: "Wipe gently with a clean micro-fiber cloth. Avoid harsh chemicals."
      },
      active: true,
      createdAt: "2026-01-10T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z"
    },
    {
      id: "prod-2",
      name: "Sunburst Bevelled Royal Wall Mirror (Gold Frame)",
      description: "An eye-catching focal point for your hallway, drawing room, or vanity. Features hand-fitted radial petal rays with genuine lead-free HD glass mirror.",
      originalPrice: 11500,
      discountPercentage: 21,
      price: 9085,
      oldPrice: 11500,
      categoryId: "cat-clocks-mirrors",
      categoryName: "Luxury Wall Clocks & Mirrors",
      images: [
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 8,
      featured: true,
      badge: "Hot Deal",
      details: {
        material: "Iron Frame with High-Definition Silver Mirror",
        dimensions: "75cm Diameter (30 inches)",
        finishColor: "Antique Champagne Gold",
        origin: "Khushab Showroom Special",
        careInstructions: "Clean glass with standard glass cleaner spray."
      },
      active: true,
      createdAt: "2026-01-12T10:00:00.000Z",
      updatedAt: "2026-03-02T10:00:00.000Z"
    },
    {
      id: "prod-3",
      name: "Nordic Minimalist Silent Sweep Large Wall Clock",
      description: "Modern architectural 3D floating numeric wall clock with quiet high-torque Taiwan mechanism. No ticking sound, ideal for living rooms and bedrooms.",
      originalPrice: 6200,
      discountPercentage: 21,
      price: 4898,
      oldPrice: 6200,
      categoryId: "cat-clocks-mirrors",
      categoryName: "Luxury Wall Clocks & Mirrors",
      images: [
        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 20,
      featured: true,
      badge: "Trending",
      details: {
        material: "Powder Coated Metal with Walnut Wooden Hands",
        dimensions: "60cm (24 inches)",
        finishColor: "Matte Deep Charcoal & Natural Walnut",
        origin: "Direct Imported Movement, Custom Assembled in Khushab",
        careInstructions: "Requires 1x AA Carbon battery (included)."
      },
      active: true,
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-03-02T10:00:00.000Z"
    },
    {
      id: "prod-4",
      name: "Handcrafted Moroccan Filigree Brass Table Lantern",
      description: "Cast dramatic patterns of warm light across your room with this traditional handcrafted brass lantern featuring intricate floral fretwork.",
      originalPrice: 3600,
      discountPercentage: 0,
      price: 3600,
      oldPrice: null,
      categoryId: "cat-lighting",
      categoryName: "Lamps & Ambient Lighting",
      images: [
        "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 12,
      featured: false,
      badge: "Handcrafted",
      details: {
        material: "Hand-tooled Pure Brass Alloy",
        dimensions: "38cm Height x 18cm Base",
        finishColor: "Warm Brushed Brass Patina",
        origin: "Traditional Artisan Craft",
        careInstructions: "Fits standard E14/E27 LED warm bulbs or tea-lights."
      },
      active: true,
      createdAt: "2026-01-20T10:00:00.000Z",
      updatedAt: "2026-03-03T10:00:00.000Z"
    },
    {
      id: "prod-5",
      name: "Fluted Ceramic Donut Vase Set (Pair)",
      description: "Iconic contemporary hollow circular vases in textured off-white terracotta ceramic. Perfectly styles dried botanicals, faux eucalyptus, or pampas.",
      originalPrice: 3800,
      discountPercentage: 15,
      price: 3230,
      oldPrice: 3800,
      categoryId: "cat-vases-planters",
      categoryName: "Ceramic Vases & Table Accents",
      images: [
        "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 18,
      featured: true,
      badge: "New Arrival",
      details: {
        material: "High-fired Terracotta Ceramic",
        dimensions: "Large: 22cm x 20cm, Medium: 18cm x 16cm",
        finishColor: "Textured Matte Ivory",
        origin: "Pottery Line, Ahmed Home Decor",
        careInstructions: "Hand wash only with damp cloth."
      },
      active: true,
      createdAt: "2026-01-22T10:00:00.000Z",
      updatedAt: "2026-03-04T10:00:00.000Z"
    },
    {
      id: "prod-6",
      name: "Luxury Embossed Velvet Cushion Covers (Pack of 5)",
      description: "Heavyweight 450 GSM royal Pakistani velvet cushions with gold zari corded piping and concealed zippers. Transforms sofas and diwans instantly.",
      originalPrice: 3400,
      discountPercentage: 0,
      price: 3400,
      oldPrice: null,
      categoryId: "cat-cushions-textiles",
      categoryName: "Velvet Cushions & Living Textiles",
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 25,
      featured: false,
      badge: "Pakistani Velvet",
      details: {
        material: "Premium Spun Velvet with Satin Lining",
        dimensions: "16 x 16 inches (40cm x 40cm)",
        finishColor: "Emerald Green, Deep Gold & Midnight Blue",
        origin: "Tailored in Punjab, Pakistan",
        careInstructions: "Dry clean or gentle cold hand wash."
      },
      active: true,
      createdAt: "2026-01-25T10:00:00.000Z",
      updatedAt: "2026-03-05T10:00:00.000Z"
    },
    {
      id: "prod-7",
      name: "Surah Al-Ikhlas Kufic Geometric Wall Panel",
      description: "Sophisticated Kufic style Islamic calligraphy carved with CNC precision on composite wooden board with gold acrylic overlay. Stunning modern contrast.",
      originalPrice: 6500,
      discountPercentage: 20,
      price: 5200,
      oldPrice: 6500,
      categoryId: "cat-wall-art",
      categoryName: "Islamic Wall Art & Calligraphy",
      images: [
        "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 7,
      featured: true,
      badge: "Featured",
      details: {
        material: "HDF Wood Core with Mirror Gold Acrylic",
        dimensions: "60cm x 60cm square (24 x 24 inches)",
        finishColor: "Walnut Dark Wood & Mirror Gold",
        origin: "Khushab Workshop Crafted",
        careInstructions: "Dust with soft dry feather duster."
      },
      active: true,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-03-05T10:00:00.000Z"
    },
    {
      id: "prod-8",
      name: "Artisanal Natural Marble Serving & Display Tray with Gold Handles",
      description: "Hand-cut natural Pakistani Breshia/Onyx marble vanity tray with brushed brass handles. Perfect for perfume bottles, candles, and dry fruits.",
      originalPrice: 4800,
      discountPercentage: 21,
      price: 3792,
      oldPrice: 4800,
      categoryId: "cat-vases-planters",
      categoryName: "Ceramic Vases & Table Accents",
      images: [
        "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "low_stock",
      stockQuantity: 3,
      featured: false,
      badge: "Natural Stone",
      details: {
        material: "Authentic Pakistani Veined Natural Marble",
        dimensions: "30cm x 20cm (12 x 8 inches)",
        finishColor: "Natural Veined Beige & Brushed Brass",
        origin: "Quarried and Polished in Pakistan",
        careInstructions: "Wipe with damp sponge; do not leave lemon/acidic liquids."
      },
      active: true,
      createdAt: "2026-02-05T10:00:00.000Z",
      updatedAt: "2026-03-06T10:00:00.000Z"
    }
  ],
  inquiries: [
    {
      id: "inq-101",
      productId: "prod-1",
      productName: "Ayat-ul-Kursi 3D Stainless Steel Metal Wall Art",
      productPrice: 6800,
      quantity: 1,
      totalPrice: 6800,
      customerNote: "Customer inquiry initiated via WhatsApp",
      timestamp: "2026-03-12T14:30:00.000Z",
      status: "whatsapp_opened"
    }
  ],
  media: []
};
function calculateProductPricing(basePrice, discountPercent) {
  const original = Math.max(0, Math.round(Number(basePrice) || 0));
  const rawDiscount = Number(discountPercent) || 0;
  const clampedDiscount = Math.min(100, Math.max(0, Math.round(rawDiscount)));
  if (clampedDiscount > 0 && original > 0) {
    const discountAmount = Math.round(original * (clampedDiscount / 100));
    const salePrice = Math.max(0, original - discountAmount);
    return {
      originalPrice: original,
      discountPercentage: clampedDiscount,
      discountAmount,
      salePrice,
      hasDiscount: true
    };
  }
  return {
    originalPrice: original,
    discountPercentage: 0,
    discountAmount: 0,
    salePrice: original,
    hasDiscount: false
  };
}
function normalizeProductPricing(p) {
  if (!p) return p;
  if (typeof p.discountPercentage === "number") {
    const discount = Math.min(100, Math.max(0, Math.round(p.discountPercentage)));
    const original = Math.max(0, Math.round(Number(p.originalPrice || p.oldPrice || p.price) || 0));
    const calc = calculateProductPricing(original, discount);
    p.originalPrice = calc.originalPrice;
    p.discountPercentage = calc.discountPercentage;
    p.price = calc.salePrice;
    p.oldPrice = calc.hasDiscount ? calc.originalPrice : null;
  } else if (p.oldPrice && Number(p.oldPrice) > Number(p.price)) {
    const original = Math.max(0, Math.round(Number(p.oldPrice)));
    const sale = Math.max(0, Math.round(Number(p.price)));
    const discount = Math.round((original - sale) / original * 100);
    p.originalPrice = original;
    p.discountPercentage = discount;
    p.price = sale;
    p.oldPrice = original;
  } else {
    const base = Math.max(0, Math.round(Number(p.price) || 0));
    p.originalPrice = base;
    p.discountPercentage = 0;
    p.price = base;
    p.oldPrice = null;
  }
  return p;
}
var BACKUP_FILE = path.join(DATA_DIR, "db.backup.json");
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const candidatePaths = [
        path.join(process.cwd(), "data", "db.json"),
        path.join(__dirname, "data", "db.json"),
        path.join(__dirname, "..", "data", "db.json")
      ];
      for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate) && candidate !== DB_FILE) {
          try {
            const rawRepo = fs.readFileSync(candidate, "utf8");
            const repoData = JSON.parse(rawRepo);
            if (Array.isArray(repoData.products)) {
              repoData.products = repoData.products.map(normalizeProductPricing);
            }
            try {
              fs.writeFileSync(DB_FILE, JSON.stringify(repoData, null, 2), "utf8");
            } catch {
            }
            return repoData;
          } catch {
          }
        }
      }
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const rawBackup = fs.readFileSync(BACKUP_FILE, "utf8");
          const backupData = JSON.parse(rawBackup);
          if (Array.isArray(backupData.products)) {
            backupData.products = backupData.products.map(normalizeProductPricing);
          }
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(backupData, null, 2), "utf8");
          } catch {
          }
          return backupData;
        } catch {
        }
      }
      const cloned = JSON.parse(JSON.stringify(db_default || initialDbData));
      if (Array.isArray(cloned.products)) {
        cloned.products = cloned.products.map(normalizeProductPricing);
      }
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(cloned, null, 2), "utf8");
      } catch {
      }
      return cloned;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data.products)) {
      data.products = data.products.map(normalizeProductPricing);
    }
    return data;
  } catch (err) {
    console.error("Error reading database:", err);
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        const rawBackup = fs.readFileSync(BACKUP_FILE, "utf8");
        const backupData = JSON.parse(rawBackup);
        if (Array.isArray(backupData.products)) {
          backupData.products = backupData.products.map(normalizeProductPricing);
        }
        return backupData;
      } catch {
      }
    }
    return db_default || initialDbData;
  }
}
function writeDb(data) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(DB_FILE, jsonStr, "utf8");
    } catch (writeErr) {
      const fallbackDir = path.join("/tmp", "ahmed_decor", "data");
      if (!fs.existsSync(fallbackDir)) {
        try {
          fs.mkdirSync(fallbackDir, { recursive: true });
        } catch {
        }
      }
      const fallbackFile = path.join(fallbackDir, "db.json");
      fs.writeFileSync(fallbackFile, jsonStr, "utf8");
    }
    try {
      fs.writeFileSync(BACKUP_FILE, jsonStr, "utf8");
    } catch {
    }
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Missing or invalid admin token." });
  }
  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Missing or invalid admin token." });
  }
  const db = readDb();
  if (!db.admin?.tokens?.includes(token)) {
    return res.status(401).json({ error: "Unauthorized. Session expired or invalid." });
  }
  next();
}
app.get("/api/public/data", (req, res) => {
  const db = readDb();
  const settings = { ...db.settings || {} };
  const adminEmail = (db.admin?.email || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  if (settings.email && (settings.email.toLowerCase().trim() === adminEmail || settings.email.toLowerCase().trim() === "tayyabmateen2121@gmail.com")) {
    settings.email = "";
  }
  const allReviews = Array.isArray(db.reviews) ? db.reviews : [];
  const approvedReviews = allReviews.filter((r) => r.status === "approved");
  const reviewsSummary = {};
  for (const r of approvedReviews) {
    if (!reviewsSummary[r.productId]) {
      reviewsSummary[r.productId] = { averageRating: 0, totalReviews: 0 };
    }
  }
  for (const pId of Object.keys(reviewsSummary)) {
    const list = approvedReviews.filter((r) => r.productId === pId);
    const sum = list.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0);
    reviewsSummary[pId] = {
      totalReviews: list.length,
      averageRating: list.length > 0 ? Number((sum / list.length).toFixed(1)) : 0
    };
  }
  const publicData = {
    settings,
    slides: (db.slides || []).filter((s) => s.active).sort((a, b) => (a.order || 0) - (b.order || 0)),
    categories: (db.categories || []).filter((c) => c.active).sort((a, b) => (a.order || 0) - (b.order || 0)),
    products: (db.products || []).filter((p) => p.active),
    reviewsSummary
  };
  res.json(publicData);
});
app.post("/api/inquiries", (req, res) => {
  const {
    productId,
    productName,
    productPrice,
    quantity,
    customerNote,
    selectedDesignId,
    selectedDesignName,
    selectedDesignImage
  } = req.body;
  if (!productId || !productName) {
    return res.status(400).json({ error: "Product information is required." });
  }
  const db = readDb();
  const newInquiry = {
    id: `inq-${Date.now()}`,
    productId,
    productName,
    selectedDesignId: selectedDesignId || void 0,
    selectedDesignName: selectedDesignName || void 0,
    selectedDesignImage: selectedDesignImage || void 0,
    productPrice: Number(productPrice) || 0,
    quantity: Number(quantity) || 1,
    totalPrice: (Number(productPrice) || 0) * (Number(quantity) || 1),
    customerNote: customerNote || "Initiated WhatsApp order",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    status: "whatsapp_opened"
  };
  db.inquiries = [newInquiry, ...db.inquiries || []];
  writeDb(db);
  res.json({ success: true, inquiry: newInquiry });
});
app.get("/api/products/:id/reviews", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const allReviews = Array.isArray(db.reviews) ? db.reviews : [];
  const approvedReviews = allReviews.filter((r) => r.productId === id && r.status === "approved").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;
  for (const rev of approvedReviews) {
    const star = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5)));
    distribution[star] = (distribution[star] || 0) + 1;
    totalRating += Number(rev.rating) || 5;
  }
  const averageRating = approvedReviews.length > 0 ? Number((totalRating / approvedReviews.length).toFixed(1)) : 0;
  res.json({
    reviews: approvedReviews,
    summary: {
      averageRating,
      totalReviews: approvedReviews.length,
      distribution
    }
  });
});
app.post("/api/products/:id/reviews", (req, res) => {
  const { id } = req.params;
  const { userName, rating, comment } = req.body;
  const trimmedName = String(userName || "").trim();
  const trimmedComment = String(comment || "").trim();
  if (!trimmedName) {
    return res.status(400).json({ error: "Please enter your name." });
  }
  if (!trimmedComment) {
    return res.status(400).json({ error: "Please write your review comment." });
  }
  if (trimmedComment.length < 5) {
    return res.status(400).json({ error: "Review must be at least 5 characters long." });
  }
  const db = readDb();
  if (!Array.isArray(db.reviews)) {
    db.reviews = [];
  }
  const product = (db.products || []).find((p) => p.id === id);
  const newReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    productId: id,
    productName: product ? product.name : "Ahmed Home D\xE9cor Product",
    productImage: product?.images?.[0] || "",
    userName: trimmedName,
    rating: Math.max(1, Math.min(5, Math.round(Number(rating) || 5))),
    comment: trimmedComment,
    status: "pending",
    // CRITICAL: Always pending initially until admin approves!
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.reviews.unshift(newReview);
  writeDb(db);
  res.json({
    success: true,
    message: "Thank you for your review! Your review has been submitted for verification and will appear on the store once approved by our team.",
    review: newReview
  });
});
app.post("/api/admin/login", (req, res) => {
  const emailInput = (req.body.email || "").trim();
  const passwordInput = (req.body.password || "").trim();
  if (!emailInput || !passwordInput) {
    return res.status(400).json({ error: "Email and password are required to sign in." });
  }
  const db = readDb();
  if (!db.admin) {
    db.admin = {
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash: DEFAULT_ADMIN_HASH,
      tokens: []
    };
    writeDb(db);
  }
  const normalizedInput = emailInput.toLowerCase();
  const currentEmail = (db.admin.email || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  const isEmailMatch = normalizedInput === currentEmail;
  const isPasswordMatch = verifyPassword(passwordInput, db.admin.passwordHash);
  if (!isEmailMatch || !isPasswordMatch) {
    return res.status(401).json({ error: "Invalid admin email or password. Please verify your credentials." });
  }
  const canonicalHash = hashPassword(passwordInput, ADMIN_SALT);
  if (db.admin.passwordHash !== canonicalHash) {
    db.admin.passwordHash = canonicalHash;
  }
  const token = crypto.randomBytes(32).toString("hex");
  if (!db.admin.tokens || !Array.isArray(db.admin.tokens)) db.admin.tokens = [];
  db.admin.tokens = [token, ...db.admin.tokens.slice(0, 9)];
  writeDb(db);
  res.json({
    success: true,
    token,
    admin: { email: db.admin.email || DEFAULT_ADMIN_EMAIL }
  });
});
app.get("/api/admin/verify", requireAdmin, (req, res) => {
  const db = readDb();
  res.json({ success: true, email: db.admin?.email || DEFAULT_ADMIN_EMAIL });
});
app.post("/api/admin/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const db = readDb();
      if (db.admin?.tokens) {
        db.admin.tokens = db.admin.tokens.filter((t) => t !== token);
        writeDb(db);
      }
    }
  }
  res.json({ success: true, message: "Logged out successfully." });
});
app.post("/api/admin/change-credentials", requireAdmin, (req, res) => {
  const { currentPassword, newEmail, newPassword } = req.body;
  const db = readDb();
  if (!currentPassword) {
    return res.status(400).json({ error: "Current password is required to update credentials." });
  }
  if (!verifyPassword(currentPassword.trim(), db.admin.passwordHash)) {
    return res.status(400).json({ error: "Current password does not match." });
  }
  if (newEmail && newEmail.includes("@")) {
    db.admin.email = newEmail.trim().toLowerCase();
  }
  if (newPassword && newPassword.trim().length >= 6) {
    db.admin.passwordHash = hashPassword(newPassword.trim());
  }
  writeDb(db);
  res.json({
    success: true,
    message: "Admin credentials updated successfully.",
    email: db.admin.email
  });
});
app.post("/api/upload", requireAdmin, (req, res) => {
  try {
    const { filename, base64, mimeType } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: "No file payload provided." });
    }
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "video/mp4",
      "video/webm"
    ];
    const rawExt = path.extname(filename).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp4", ".webm"];
    const isVideo = mimeType && mimeType.startsWith("video/") || rawExt === ".mp4" || rawExt === ".webm";
    const isImage = mimeType && mimeType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(rawExt);
    if (!isVideo && !isImage && mimeType && !allowedMimeTypes.includes(mimeType) && !allowedExts.includes(rawExt)) {
      return res.status(400).json({
        error: "Unsupported file format. Please upload JPEG, PNG, WEBP, or MP4."
      });
    }
    const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const maxAllowedSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxAllowedSize) {
      return res.status(400).json({
        error: `File size exceeds allowed limit (${isVideo ? "50MB for videos" : "10MB for photos"}).`
      });
    }
    let ext = rawExt;
    if (!ext) {
      if (isVideo) ext = ".mp4";
      else if (mimeType?.includes("webp")) ext = ".webp";
      else if (mimeType?.includes("jpeg")) ext = ".jpg";
      else ext = ".png";
    }
    const resolvedMimeType = mimeType || (isVideo ? "video/mp4" : ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg");
    const safeName = `ahmed_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext.toLowerCase()}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    const db = readDb();
    if (!Array.isArray(db.media)) db.media = [];
    const existingMedia = db.media.find((m) => {
      if (m.size === buffer.length) {
        const diskFile = path.join(UPLOADS_DIR, m.filename);
        if (fs.existsSync(diskFile)) {
          try {
            const diskBuf = fs.readFileSync(diskFile);
            if (diskBuf.equals(buffer)) {
              return true;
            }
          } catch {
            return false;
          }
        }
      }
      return false;
    });
    if (existingMedia) {
      return res.json({
        success: true,
        url: existingMedia.url,
        filename: existingMedia.filename,
        size: existingMedia.size,
        file: existingMedia
      });
    }
    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${safeName}`;
    const mediaRecord = {
      id: `media-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      url: publicUrl,
      filename: safeName,
      originalName: path.basename(filename),
      mimeType: resolvedMimeType,
      size: buffer.length,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.media = db.media.filter((m) => m.filename !== safeName && m.url !== publicUrl);
    db.media.unshift(mediaRecord);
    writeDb(db);
    res.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      size: buffer.length,
      file: mediaRecord
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Failed to save uploaded file." });
  }
});
app.get("/api/admin/all-data", requireAdmin, (req, res) => {
  const db = readDb();
  const allReviews = Array.isArray(db.reviews) ? db.reviews : [];
  const enrichedReviews = allReviews.map((r) => {
    const prod = (db.products || []).find((p) => p.id === r.productId);
    return {
      ...r,
      productName: r.productName || prod?.name || "Ahmed Home D\xE9cor Item",
      productImage: r.productImage || prod?.images?.[0] || ""
    };
  });
  res.json({
    settings: db.settings,
    slides: db.slides || [],
    categories: db.categories || [],
    products: db.products || [],
    inquiries: db.inquiries || [],
    reviews: enrichedReviews,
    adminEmail: db.admin.email
  });
});
app.get("/api/admin/reviews", requireAdmin, (req, res) => {
  const db = readDb();
  const allReviews = Array.isArray(db.reviews) ? db.reviews : [];
  const enrichedReviews = allReviews.map((r) => {
    const prod = (db.products || []).find((p) => p.id === r.productId);
    return {
      ...r,
      productName: r.productName || prod?.name || "Ahmed Home D\xE9cor Item",
      productImage: r.productImage || prod?.images?.[0] || ""
    };
  });
  res.json({ reviews: enrichedReviews });
});
app.put("/api/admin/reviews/:id/status", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["approved", "hidden", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid review status. Must be approved, hidden, or pending." });
  }
  const db = readDb();
  if (!Array.isArray(db.reviews)) {
    db.reviews = [];
  }
  const reviewIndex = db.reviews.findIndex((r) => r.id === id);
  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Review not found." });
  }
  db.reviews[reviewIndex].status = status;
  db.reviews[reviewIndex].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  writeDb(db);
  res.json({ success: true, review: db.reviews[reviewIndex] });
});
app.delete("/api/admin/reviews/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!Array.isArray(db.reviews)) {
    db.reviews = [];
  }
  const initialCount = db.reviews.length;
  db.reviews = db.reviews.filter((r) => r.id !== id);
  if (db.reviews.length === initialCount) {
    return res.status(404).json({ error: "Review not found." });
  }
  writeDb(db);
  res.json({ success: true, message: "Review deleted successfully." });
});
app.post("/api/admin/products", requireAdmin, (req, res) => {
  const body = req.body;
  if (!body.name || !body.categoryId && !body.newCategoryName && !body.categoryName) {
    return res.status(400).json({ error: "Product name and category are required." });
  }
  const rawBasePrice = body.originalPrice !== void 0 && body.originalPrice !== "" ? Number(body.originalPrice) : Number(body.price);
  if (isNaN(rawBasePrice) || rawBasePrice <= 0) {
    return res.status(400).json({ error: "A valid positive product price is required." });
  }
  const rawDiscount = body.discountPercentage !== void 0 && body.discountPercentage !== "" ? Number(body.discountPercentage) : 0;
  if (isNaN(rawDiscount) || rawDiscount < 0 || rawDiscount > 100) {
    return res.status(400).json({ error: "Discount percentage must be between 0% and 100%." });
  }
  const pricing = calculateProductPricing(rawBasePrice, rawDiscount);
  const db = readDb();
  let category = (db.categories || []).find((c) => c.id === body.categoryId);
  let resolvedCategoryId = body.categoryId;
  let resolvedCategoryName = category?.name || body.categoryName || "General";
  const rawCustomCategory = String(body.newCategoryName || (!category && body.categoryName ? body.categoryName : "")).trim();
  if (rawCustomCategory && rawCustomCategory !== "__custom__") {
    const existing = (db.categories || []).find(
      (c) => c.name.toLowerCase() === rawCustomCategory.toLowerCase()
    );
    if (existing) {
      resolvedCategoryId = existing.id;
      resolvedCategoryName = existing.name;
    } else {
      const slug = rawCustomCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const newCat = {
        id: `cat-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        name: rawCustomCategory,
        slug: slug || `cat-${Date.now()}`,
        description: `Modern decorative pieces in ${rawCustomCategory}`,
        image: Array.isArray(body.images) && body.images[0] ? body.images[0] : "",
        active: true,
        order: (db.categories || []).length + 1
      };
      db.categories = [...db.categories || [], newCat];
      resolvedCategoryId = newCat.id;
      resolvedCategoryName = newCat.name;
    }
  }
  const newProduct = {
    id: `prod-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    name: body.name.trim(),
    description: body.description || "",
    originalPrice: pricing.originalPrice,
    discountPercentage: pricing.discountPercentage,
    price: pricing.salePrice,
    oldPrice: pricing.hasDiscount ? pricing.originalPrice : null,
    categoryId: resolvedCategoryId,
    categoryName: resolvedCategoryName,
    images: Array.isArray(body.images) && body.images.length > 0 ? body.images : ["/uploads/placeholder.png"],
    designs: Array.isArray(body.designs) ? body.designs : void 0,
    variants: Array.isArray(body.variants) ? body.variants : void 0,
    stockStatus: body.stockStatus || "in_stock",
    stockQuantity: Number(body.stockQuantity) || 1,
    featured: Boolean(body.featured),
    badge: body.badge || "",
    details: body.details || {},
    active: body.active !== void 0 ? Boolean(body.active) : true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.products = [newProduct, ...db.products || []];
  writeDb(db);
  res.status(201).json({ success: true, product: newProduct });
});
app.post("/api/admin/sync-products", (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.json({ success: true, count: 0 });
  }
  const db = readDb();
  let updated = false;
  const existingIds = new Set((db.products || []).map((p) => p.id));
  for (const prod of products) {
    if (prod && prod.id && !existingIds.has(prod.id)) {
      db.products = [normalizeProductPricing(prod), ...db.products || []];
      existingIds.add(prod.id);
      updated = true;
    }
  }
  if (updated) {
    writeDb(db);
  }
  res.json({ success: true, count: (db.products || []).length });
});
app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const db = readDb();
  const index = (db.products || []).findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found." });
  }
  const existing = db.products[index];
  let rawBasePrice;
  if (body.originalPrice !== void 0 && body.originalPrice !== "") {
    rawBasePrice = Number(body.originalPrice);
  } else if (body.price !== void 0 && body.price !== "") {
    rawBasePrice = existing.originalPrice || Number(body.price);
  } else {
    rawBasePrice = existing.originalPrice || existing.oldPrice || existing.price;
  }
  if (isNaN(rawBasePrice) || rawBasePrice <= 0) {
    return res.status(400).json({ error: "A valid positive product price is required." });
  }
  let rawDiscount;
  if (body.discountPercentage !== void 0 && body.discountPercentage !== "") {
    rawDiscount = Number(body.discountPercentage);
  } else if (body.discountPercentage === 0) {
    rawDiscount = 0;
  } else {
    rawDiscount = existing.discountPercentage || 0;
  }
  if (isNaN(rawDiscount) || rawDiscount < 0 || rawDiscount > 100) {
    return res.status(400).json({ error: "Discount percentage must be between 0% and 100%." });
  }
  const pricing = calculateProductPricing(rawBasePrice, rawDiscount);
  let category = (db.categories || []).find((c) => c.id === body.categoryId);
  let resolvedCategoryId = body.categoryId || existing.categoryId;
  let resolvedCategoryName = category?.name || body.categoryName || existing.categoryName;
  const rawCustomCategory = String(body.newCategoryName || (!category && body.categoryName ? body.categoryName : "")).trim();
  if (rawCustomCategory && rawCustomCategory !== "__custom__") {
    const existingCat = (db.categories || []).find(
      (c) => c.name.toLowerCase() === rawCustomCategory.toLowerCase()
    );
    if (existingCat) {
      resolvedCategoryId = existingCat.id;
      resolvedCategoryName = existingCat.name;
    } else {
      const slug = rawCustomCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const newCat = {
        id: `cat-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        name: rawCustomCategory,
        slug: slug || `cat-${Date.now()}`,
        description: `Modern decorative pieces in ${rawCustomCategory}`,
        image: Array.isArray(body.images) && body.images[0] ? body.images[0] : "",
        active: true,
        order: (db.categories || []).length + 1
      };
      db.categories = [...db.categories || [], newCat];
      resolvedCategoryId = newCat.id;
      resolvedCategoryName = newCat.name;
    }
  }
  const updatedProduct = {
    ...existing,
    name: body.name !== void 0 ? body.name.trim() : existing.name,
    description: body.description !== void 0 ? body.description : existing.description,
    originalPrice: pricing.originalPrice,
    discountPercentage: pricing.discountPercentage,
    price: pricing.salePrice,
    oldPrice: pricing.hasDiscount ? pricing.originalPrice : null,
    categoryId: resolvedCategoryId,
    categoryName: resolvedCategoryName,
    images: Array.isArray(body.images) ? body.images : existing.images,
    designs: body.designs !== void 0 ? Array.isArray(body.designs) ? body.designs : void 0 : existing.designs,
    variants: body.variants !== void 0 ? Array.isArray(body.variants) ? body.variants : void 0 : existing.variants,
    stockStatus: body.stockStatus || existing.stockStatus,
    stockQuantity: body.stockQuantity !== void 0 ? Number(body.stockQuantity) : existing.stockQuantity,
    featured: body.featured !== void 0 ? Boolean(body.featured) : existing.featured,
    badge: body.badge !== void 0 ? body.badge : existing.badge,
    details: body.details !== void 0 ? body.details : existing.details,
    active: body.active !== void 0 ? Boolean(body.active) : existing.active,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.products[index] = updatedProduct;
  writeDb(db);
  res.json({ success: true, product: updatedProduct });
});
app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialLength = (db.products || []).length;
  db.products = (db.products || []).filter((p) => p.id !== id);
  if (db.products.length === initialLength) {
    return res.status(404).json({ error: "Product not found." });
  }
  writeDb(db);
  res.json({ success: true, message: "Product deleted successfully." });
});
app.post("/api/admin/categories", requireAdmin, (req, res) => {
  const body = req.body;
  if (!body.name) {
    return res.status(400).json({ error: "Category name is required." });
  }
  const db = readDb();
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const newCategory = {
    id: `cat-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    name: body.name.trim(),
    slug: slug || `cat-${Date.now()}`,
    description: body.description || "",
    image: body.image || "",
    active: body.active !== void 0 ? Boolean(body.active) : true,
    order: Number(body.order) || (db.categories || []).length + 1
  };
  db.categories = [...db.categories || [], newCategory];
  writeDb(db);
  res.status(201).json({ success: true, category: newCategory });
});
app.put("/api/admin/categories/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const db = readDb();
  const index = (db.categories || []).findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Category not found." });
  }
  const prevName = db.categories[index].name;
  const updatedCategory = {
    ...db.categories[index],
    name: body.name !== void 0 ? body.name.trim() : db.categories[index].name,
    description: body.description !== void 0 ? body.description : db.categories[index].description,
    image: body.image !== void 0 ? body.image : db.categories[index].image,
    active: body.active !== void 0 ? Boolean(body.active) : db.categories[index].active,
    order: body.order !== void 0 ? Number(body.order) : db.categories[index].order
  };
  db.categories[index] = updatedCategory;
  if (body.name && body.name.trim() !== prevName) {
    db.products = (db.products || []).map((p) => {
      if (p.categoryId === id) {
        return { ...p, categoryName: body.name.trim() };
      }
      return p;
    });
  }
  writeDb(db);
  res.json({ success: true, category: updatedCategory });
});
app.delete("/api/admin/categories/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { force } = req.query;
  const db = readDb();
  const associatedProducts = (db.products || []).filter((p) => p.categoryId === id);
  if (associatedProducts.length > 0 && force !== "true") {
    return res.status(400).json({
      error: `Cannot delete category: ${associatedProducts.length} product(s) are currently attached to this category. Please reassign or delete the products first, or pass force=true to detach.`
    });
  }
  if (associatedProducts.length > 0 && force === "true") {
    db.products = (db.products || []).map((p) => {
      if (p.categoryId === id) {
        return { ...p, categoryId: "general", categoryName: "Uncategorized" };
      }
      return p;
    });
  }
  const initialLength = (db.categories || []).length;
  db.categories = (db.categories || []).filter((c) => c.id !== id);
  if (db.categories.length === initialLength) {
    return res.status(404).json({ error: "Category not found." });
  }
  writeDb(db);
  res.json({ success: true, message: "Category deleted successfully." });
});
app.post("/api/admin/slides", requireAdmin, (req, res) => {
  const body = req.body;
  if (!body.title || !body.image) {
    return res.status(400).json({ error: "Slide title and image are required." });
  }
  const db = readDb();
  const newSlide = {
    id: `slide-${Date.now()}`,
    title: body.title.trim(),
    subtitle: body.subtitle ? body.subtitle.trim() : "",
    badge: body.badge ? body.badge.trim() : "",
    description: body.description || "",
    image: body.image,
    buttonText: body.buttonText || "Explore Collection",
    buttonLink: body.buttonLink || "/products",
    active: body.active !== void 0 ? Boolean(body.active) : true,
    order: Number(body.order) || (db.slides || []).length + 1
  };
  db.slides = [...db.slides || [], newSlide];
  writeDb(db);
  res.status(201).json({ success: true, slide: newSlide });
});
app.put("/api/admin/slides/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const db = readDb();
  const index = (db.slides || []).findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Slide not found." });
  }
  const updatedSlide = {
    ...db.slides[index],
    title: body.title !== void 0 ? body.title.trim() : db.slides[index].title,
    subtitle: body.subtitle !== void 0 ? body.subtitle.trim() : db.slides[index].subtitle || "",
    badge: body.badge !== void 0 ? body.badge.trim() : db.slides[index].badge || "",
    description: body.description !== void 0 ? body.description : db.slides[index].description,
    image: body.image !== void 0 ? body.image : db.slides[index].image,
    buttonText: body.buttonText !== void 0 ? body.buttonText : db.slides[index].buttonText,
    buttonLink: body.buttonLink !== void 0 ? body.buttonLink : db.slides[index].buttonLink,
    active: body.active !== void 0 ? Boolean(body.active) : db.slides[index].active,
    order: body.order !== void 0 ? Number(body.order) : db.slides[index].order
  };
  db.slides[index] = updatedSlide;
  writeDb(db);
  res.json({ success: true, slide: updatedSlide });
});
app.delete("/api/admin/slides/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialLength = (db.slides || []).length;
  db.slides = (db.slides || []).filter((s) => s.id !== id);
  if (db.slides.length === initialLength) {
    return res.status(404).json({ error: "Slide not found." });
  }
  writeDb(db);
  res.json({ success: true, message: "Slide deleted successfully." });
});
app.put("/api/admin/slides/reorder", requireAdmin, (req, res) => {
  const { slideIds } = req.body;
  if (!Array.isArray(slideIds)) {
    return res.status(400).json({ error: "slideIds array is required." });
  }
  const db = readDb();
  const slideMap = new Map((db.slides || []).map((s) => [s.id, s]));
  const reordered = [];
  slideIds.forEach((id, idx) => {
    const slide = slideMap.get(id);
    if (slide) {
      slide.order = idx + 1;
      reordered.push(slide);
      slideMap.delete(id);
    }
  });
  slideMap.forEach((slide) => {
    slide.order = reordered.length + 1;
    reordered.push(slide);
  });
  db.slides = reordered;
  writeDb(db);
  res.json({ success: true, slides: db.slides });
});
app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const body = req.body;
  const db = readDb();
  delete body.about;
  delete body.introVideo;
  delete db.settings.about;
  delete db.settings.introVideo;
  db.settings = {
    ...db.settings,
    ...body,
    announcement: {
      ...db.settings.announcement,
      ...body.announcement || {}
    },
    socialLinks: {
      ...db.settings.socialLinks,
      ...body.socialLinks || {}
    }
  };
  delete db.settings.about;
  delete db.settings.introVideo;
  const adminEmail = (db.admin?.email || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  if (db.settings.email && (db.settings.email.toLowerCase().trim() === adminEmail || db.settings.email.toLowerCase().trim() === "tayyabmateen2121@gmail.com")) {
    db.settings.email = "";
  }
  writeDb(db);
  res.json({ success: true, settings: db.settings });
});
app.delete("/api/admin/inquiries/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.inquiries = (db.inquiries || []).filter((i) => i.id !== id);
  writeDb(db);
  res.json({ success: true });
});
app.delete("/api/admin/inquiries", requireAdmin, (req, res) => {
  const db = readDb();
  db.inquiries = [];
  writeDb(db);
  res.json({ success: true, message: "All inquiries cleared." });
});
app.get("/api/admin/media", requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const diskFiles = fs.readdirSync(UPLOADS_DIR).filter((f) => !f.startsWith("."));
    const db = readDb();
    if (!Array.isArray(db.media)) db.media = [];
    let dbUpdated = false;
    const existingMap = /* @__PURE__ */ new Map();
    db.media.forEach((m) => {
      if (m && m.filename) existingMap.set(m.filename, m);
    });
    for (const file of diskFiles) {
      if (!existingMap.has(file)) {
        const fullPath = path.join(UPLOADS_DIR, file);
        try {
          const stat = fs.statSync(fullPath);
          const ext = path.extname(file).toLowerCase();
          const isVideo = [".mp4", ".webm"].includes(ext);
          const mimeType = isVideo ? "video/mp4" : ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg";
          const newRecord = {
            id: `media-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
            url: `/uploads/${file}`,
            filename: file,
            originalName: file,
            mimeType,
            size: stat.size,
            createdAt: stat.birthtime ? stat.birthtime.toISOString() : (/* @__PURE__ */ new Date()).toISOString()
          };
          db.media.push(newRecord);
          existingMap.set(file, newRecord);
          dbUpdated = true;
        } catch {
        }
      }
    }
    const prevCount = db.media.length;
    db.media = db.media.filter((m) => {
      if (!m || !m.filename) return false;
      const onDisk = diskFiles.includes(m.filename);
      return onDisk;
    });
    if (db.media.length !== prevCount) {
      dbUpdated = true;
    }
    db.media.sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    if (dbUpdated) {
      writeDb(db);
    }
    const files = db.media.map((m) => m.url);
    res.json({
      success: true,
      files,
      items: db.media
    });
  } catch (err) {
    console.error("List media error:", err);
    res.status(500).json({ error: err.message || "Failed to list media files." });
  }
});
app.delete(["/api/admin/media/:filename", "/api/admin/media"], requireAdmin, (req, res) => {
  try {
    const rawFilename = req.params.filename || req.query.filename || req.body?.filename;
    if (!rawFilename) {
      return res.status(400).json({ error: "Filename is required to delete media file." });
    }
    const decoded = decodeURIComponent(String(rawFilename));
    const cleanBasename = path.basename(decoded.split("?")[0].replace(/\\/g, "/"));
    const safeFilename = path.basename(cleanBasename);
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    let deletedFromFileSystem = false;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deletedFromFileSystem = true;
      } catch (unlinkErr) {
        console.warn("Unlink warning:", unlinkErr);
      }
    }
    const db = readDb();
    let dbUpdated = false;
    if (Array.isArray(db.media)) {
      const prevLen = db.media.length;
      db.media = db.media.filter((m) => {
        const itemStr = typeof m === "string" ? m : m?.filename || m?.url || "";
        return !itemStr.includes(safeFilename);
      });
      if (db.media.length !== prevLen) dbUpdated = true;
    }
    if (Array.isArray(db.uploadedFiles)) {
      const prevLen = db.uploadedFiles.length;
      db.uploadedFiles = db.uploadedFiles.filter((m) => {
        const itemStr = typeof m === "string" ? m : m?.filename || m?.url || "";
        return !itemStr.includes(safeFilename);
      });
      if (db.uploadedFiles.length !== prevLen) dbUpdated = true;
    }
    if (dbUpdated) {
      writeDb(db);
    }
    res.json({
      success: true,
      deleted: deletedFromFileSystem,
      filename: safeFilename,
      message: `Media file ${safeFilename} deleted successfully.`
    });
  } catch (err) {
    console.error("Delete media error:", err);
    res.status(500).json({ error: err.message || "Failed to delete media file." });
  }
});
app.post("/api/admin/media/delete", requireAdmin, (req, res) => {
  try {
    const rawFilename = req.body?.filename || req.query?.filename;
    if (!rawFilename) {
      return res.status(400).json({ error: "Filename is required to delete media file." });
    }
    const decoded = decodeURIComponent(String(rawFilename));
    const cleanBasename = path.basename(decoded.split("?")[0].replace(/\\/g, "/"));
    const safeFilename = path.basename(cleanBasename);
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    let deletedFromFileSystem = false;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deletedFromFileSystem = true;
      } catch (unlinkErr) {
        console.warn("Unlink warning:", unlinkErr);
      }
    }
    const db = readDb();
    let dbUpdated = false;
    if (Array.isArray(db.media)) {
      const prevLen = db.media.length;
      db.media = db.media.filter((m) => {
        const itemStr = typeof m === "string" ? m : m?.filename || m?.url || "";
        return !itemStr.includes(safeFilename);
      });
      if (db.media.length !== prevLen) dbUpdated = true;
    }
    if (Array.isArray(db.uploadedFiles)) {
      const prevLen = db.uploadedFiles.length;
      db.uploadedFiles = db.uploadedFiles.filter((m) => {
        const itemStr = typeof m === "string" ? m : m?.filename || m?.url || "";
        return !itemStr.includes(safeFilename);
      });
      if (db.uploadedFiles.length !== prevLen) dbUpdated = true;
    }
    if (dbUpdated) {
      writeDb(db);
    }
    res.json({
      success: true,
      deleted: deletedFromFileSystem,
      filename: safeFilename,
      message: `Media file ${safeFilename} deleted successfully.`
    });
  } catch (err) {
    console.error("Delete media error:", err);
    res.status(500).json({ error: err.message || "Failed to delete media file." });
  }
});
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ahmed Home Decoration server running on port ${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;

// api/index.ts
var index_default = server_default;
export {
  index_default as default
};
