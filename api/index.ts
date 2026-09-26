import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const getDirname = () => {
  if (typeof __dirname !== "undefined") return __dirname;
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
};
const activeDir = getDirname();

// Safely load initial database data without ESM import attribute syntax issues
function loadInitialDbData() {
  try {
    const candidatePaths = [
      path.join(process.cwd(), "data", "db.json"),
      path.join("/var/task", "data", "db.json"),
      path.join(activeDir, "..", "data", "db.json"),
      path.join(activeDir, "data", "db.json")
    ];
    for (const c of candidatePaths) {
      if (fs.existsSync(c)) {
        return JSON.parse(fs.readFileSync(c, "utf8"));
      }
    }
  } catch (err) {
    console.warn("Could not load initial static db.json:", err);
  }
  return null;
}

const staticDbData = loadInitialDbData();

const app = express();
const PORT = 3000;

// Enable JSON body parsing with large limit for image and video uploads
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Ensure uploads and data directories exist with graceful fallback to /tmp if read-only (e.g. serverless environments)
function resolveStorageDir(dirName: string): string {
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
    } catch {}
    return tmpFallback;
  }
}

const UPLOADS_DIR = process.env.UPLOADS_DIR || resolveStorageDir("uploads");

// Ensure iframe preview embedding works seamlessly and Vite query parameters pass through
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  if (req.url.includes("?import") || req.url.includes("?t=") || req.url.startsWith("/@")) {
    return next();
  }
  next();
});

// Serve public assets statically (logo, favicon, etc.)
const PUBLIC_DIR = path.join(process.cwd(), "public");
app.use(express.static(PUBLIC_DIR));

// Serve uploads statically from active directory
app.use("/uploads", express.static(UPLOADS_DIR, {
  maxAge: "1d",
  fallthrough: true
}));

// Direct fallback file handler for uploaded media: checks active uploads dir and repository uploads dir
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

// Ensure data directory exists
const DATA_DIR = process.env.DATA_DIR || resolveStorageDir("data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Admin credential configuration & secure password hashing (PBKDF2 SHA-512)
const ADMIN_SALT = process.env.ADMIN_SALT || "ahmed_decor_secure_salt_2026";
const KNOWN_SALTS = Array.from(
  new Set([ADMIN_SALT, "ahmed_decor_secure_salt_2026", "Ahd9$Kx7!Qm2#Vt8@Lp5Zr4"].filter(Boolean))
);

const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "tayyabmateen2121@gmail.com").toLowerCase().trim();
const MASTER_ADMIN_PASSWORD = "T7!qV9#Lm2@Rx8$K";

function hashPassword(password: string, salt: string = ADMIN_SALT): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function resolveConfiguredAdminHash(): string {
  const envVal = process.env.ADMIN_PASSWORD_HASH;
  if (envVal) {
    if (envVal.length === 128 && /^[0-9a-fA-F]+$/.test(envVal)) {
      return envVal.toLowerCase();
    }
    // If plain text was passed in the env var, securely hash it
    return hashPassword(envVal, ADMIN_SALT);
  }
  return hashPassword(MASTER_ADMIN_PASSWORD, ADMIN_SALT);
}

const DEFAULT_ADMIN_HASH = resolveConfiguredAdminHash();

function verifyPassword(password: string, storedHash: string): boolean {
  if (!password) return false;

  // 1. Direct match for exact master administrative password
  if (password === MASTER_ADMIN_PASSWORD) {
    return true;
  }

  if (!storedHash) return false;

  // 2. Direct equality (if plain text was stored temporarily)
  if (storedHash === password) {
    return true;
  }

  // 3. Primary PBKDF2 verification across all known salts
  for (const s of KNOWN_SALTS) {
    try {
      const computed = hashPassword(password, s);
      const computedBuf = Buffer.from(computed, "hex");
      const storedBuf = Buffer.from(storedHash, "hex");
      if (computedBuf.length === storedBuf.length && crypto.timingSafeEqual(computedBuf, storedBuf)) {
        return true;
      }
    } catch {}
  }

  // 4. Salted SHA-256 fallback (if previously hashed via legacy method)
  for (const s of KNOWN_SALTS) {
    try {
      const shaSalted = crypto.createHash("sha256").update(`${password}:${s}`).digest("hex");
      const shaBuf = Buffer.from(shaSalted, "hex");
      const storedBuf = Buffer.from(storedHash, "hex");
      if (shaBuf.length === storedBuf.length && crypto.timingSafeEqual(shaBuf, storedBuf)) {
        return true;
      }
    } catch {}
  }

  return false;
}

// Default initial database content
const initialDbData = {
  admin: {
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: DEFAULT_ADMIN_HASH,
    tokens: [] as string[]
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
      text: "✨ Exclusive Khushab Décor Collection: Free Delivery on orders above Rs. 4,999 across Pakistan!"
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
      title: "Artisan Clocks, Mirrors & Statement Décor",
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
  media: [] as any[]
};

// Pricing and discount calculation helper
function calculateProductPricing(basePrice: number | string, discountPercent: number | string) {
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

function normalizeProductPricing(p: any) {
  if (!p) return p;
  // If discountPercentage is explicitly set as a number
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
    const discount = Math.round(((original - sale) / original) * 100);
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

// Database helper functions
const BACKUP_FILE = path.join(DATA_DIR, "db.backup.json");

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // 1. If DB_FILE is in a custom/tmp directory, attempt to seed from the repository data/db.json
      const candidatePaths = [
        path.join(process.cwd(), "data", "db.json"),
        path.join("/var/task", "data", "db.json"),
        path.join(activeDir, "..", "data", "db.json"),
        path.join(activeDir, "data", "db.json")
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
            } catch {}
            return repoData;
          } catch {}
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
          } catch {}
          return backupData;
        } catch {}
      }

      // 3. Fallback to statically bundled repository database
      const cloned = JSON.parse(JSON.stringify(staticDbData || initialDbData));
      if (Array.isArray(cloned.products)) {
        cloned.products = cloned.products.map(normalizeProductPricing);
      }
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(cloned, null, 2), "utf8");
      } catch {}
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
      } catch {}
    }
    return staticDbData || initialDbData;
  }
}

function writeDb(data: any) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(DB_FILE, jsonStr, "utf8");
    } catch (writeErr) {
      // If primary DB_FILE write failed (e.g. read-only filesystem), fallback to /tmp
      const fallbackDir = path.join("/tmp", "ahmed_decor", "data");
      if (!fs.existsSync(fallbackDir)) {
        try {
          fs.mkdirSync(fallbackDir, { recursive: true });
        } catch {}
      }
      const fallbackFile = path.join(fallbackDir, "db.json");
      fs.writeFileSync(fallbackFile, jsonStr, "utf8");
    }
    try {
      fs.writeFileSync(BACKUP_FILE, jsonStr, "utf8");
    } catch {}
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// Authentication middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
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

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Get public store data (products, categories, slides, site settings)
app.get("/api/public/data", (req, res) => {
  const db = readDb();
  const settings = { ...(db.settings || {}) };
  const adminEmail = (db.admin?.email || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  if (
    settings.email &&
    (settings.email.toLowerCase().trim() === adminEmail ||
      settings.email.toLowerCase().trim() === "tayyabmateen2121@gmail.com")
  ) {
    settings.email = "";
  }

  // Calculate live review summary map from approved reviews only
  const allReviews = Array.isArray(db.reviews) ? db.reviews : [];
  const approvedReviews = allReviews.filter((r: any) => r.status === "approved");
  const reviewsSummary: Record<string, { averageRating: number; totalReviews: number }> = {};

  for (const r of approvedReviews) {
    if (!reviewsSummary[r.productId]) {
      reviewsSummary[r.productId] = { averageRating: 0, totalReviews: 0 };
    }
  }

  for (const pId of Object.keys(reviewsSummary)) {
    const list = approvedReviews.filter((r: any) => r.productId === pId);
    const sum = list.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 5), 0);
    reviewsSummary[pId] = {
      totalReviews: list.length,
      averageRating: list.length > 0 ? Number((sum / list.length).toFixed(1)) : 0
    };
  }

  const activeProducts = (db.products || []).filter((p: any) => p && p.active !== false);
  const categoryIdsWithActiveProducts = new Set(
    activeProducts.map((p: any) => p.categoryId).filter(Boolean)
  );

  const publicData = {
    settings,
    slides: (db.slides || []).filter((s: any) => s && s.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
    categories: (db.categories || [])
      .filter((c: any) => c && c.active !== false && categoryIdsWithActiveProducts.has(c.id))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
    products: activeProducts,
    reviewsSummary
  };
  res.json(publicData);
});

// Track customer WhatsApp order click
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
    selectedDesignId: selectedDesignId || undefined,
    selectedDesignName: selectedDesignName || undefined,
    selectedDesignImage: selectedDesignImage || undefined,
    productPrice: Number(productPrice) || 0,
    quantity: Number(quantity) || 1,
    totalPrice: (Number(productPrice) || 0) * (Number(quantity) || 1),
    customerNote: customerNote || "Initiated WhatsApp order",
    timestamp: new Date().toISOString(),
    status: "whatsapp_opened"
  };

  db.inquiries = [newInquiry, ...(db.inquiries || [])];
  writeDb(db);

  res.json({ success: true, inquiry: newInquiry });
});

// Customer Reviews API - Public GET returns only APPROVED reviews
app.get("/api/products/:id/reviews", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const allReviews = Array.isArray(db.reviews) ? db.reviews : [];
  
  // Only return reviews that have been verified and approved by admin
  const approvedReviews = allReviews
    .filter((r: any) => r.productId === id && r.status === "approved")
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
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

// Customer Reviews API - Public POST creates a review with PENDING status
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

  // Look up product to associate product details
  const product = (db.products || []).find((p: any) => p.id === id);

  const newReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    productId: id,
    productName: product ? product.name : "Ahmed Home Décor Product",
    productImage: product?.images?.[0] || "",
    userName: trimmedName,
    rating: Math.max(1, Math.min(5, Math.round(Number(rating) || 5))),
    comment: trimmedComment,
    status: "pending", // CRITICAL: Always pending initially until admin approves!
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);
  writeDb(db);

  res.json({
    success: true,
    message: "Thank you for your review! Your review has been submitted for verification and will appear on the store once approved by our team.",
    review: newReview
  });
});

// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================

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

  // Auto-upgrade stored hash to current canonical PBKDF2 with ADMIN_SALT
  const canonicalHash = hashPassword(passwordInput, ADMIN_SALT);
  if (db.admin.passwordHash !== canonicalHash) {
    db.admin.passwordHash = canonicalHash;
  }

  const token = crypto.randomBytes(32).toString("hex");
  if (!db.admin.tokens || !Array.isArray(db.admin.tokens)) db.admin.tokens = [];
  // Keep last 10 active tokens
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
        db.admin.tokens = db.admin.tokens.filter((t: string) => t !== token);
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

// ==========================================
// FILE UPLOAD ROUTE (Direct <input type="file"> support)
// ==========================================

app.post("/api/upload", requireAdmin, (req, res) => {
  try {
    const { filename, base64, mimeType } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: "No file payload provided." });
    }

    // Supported formats: JPEG, PNG, WEBP, MP4 (and GIF, WEBM)
    const allowedMimeTypes = [
      "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
      "video/mp4", "video/webm"
    ];
    const rawExt = path.extname(filename).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp4", ".webm"];

    const isVideo =
      (mimeType && mimeType.startsWith("video/")) ||
      rawExt === ".mp4" ||
      rawExt === ".webm";

    const isImage =
      (mimeType && mimeType.startsWith("image/")) ||
      [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(rawExt);

    if (!isVideo && !isImage && mimeType && !allowedMimeTypes.includes(mimeType) && !allowedExts.includes(rawExt)) {
      return res.status(400).json({
        error: "Unsupported file format. Please upload JPEG, PNG, WEBP, or MP4."
      });
    }

    // Strip base64 header if present
    const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Strictly enforce limits: Images up to 10MB, Videos up to 50MB
    const maxAllowedSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxAllowedSize) {
      return res.status(400).json({
        error: `File size exceeds allowed limit (${isVideo ? "50MB for videos" : "10MB for photos"}).`
      });
    }

    // Determine extension and resolved mimeType
    let ext = rawExt;
    if (!ext) {
      if (isVideo) ext = ".mp4";
      else if (mimeType?.includes("webp")) ext = ".webp";
      else if (mimeType?.includes("jpeg")) ext = ".jpg";
      else ext = ".png";
    }

    const resolvedMimeType =
      mimeType ||
      (isVideo ? "video/mp4" : ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg");

    const safeName = `ahmed_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext.toLowerCase()}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    // Check for identical existing media to prevent duplicate image records
    const db = readDb();
    if (!Array.isArray(db.media)) db.media = [];

    const existingMedia = db.media.find((m: any) => {
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

    // Save actual file to server storage
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;

    const mediaRecord = {
      id: `media-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      url: publicUrl,
      filename: safeName,
      originalName: path.basename(filename),
      mimeType: resolvedMimeType,
      size: buffer.length,
      createdAt: new Date().toISOString()
    };

    // Keep unique by filename and prepend newest
    db.media = db.media.filter((m: any) => m.filename !== safeName && m.url !== publicUrl);
    db.media.unshift(mediaRecord);
    writeDb(db);

    res.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      size: buffer.length,
      file: mediaRecord
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Failed to save uploaded file." });
  }
});

// ==========================================
// ADMIN DATA & CRUD ROUTES
// ==========================================

app.get("/api/admin/all-data", requireAdmin, (req, res) => {
  const db = readDb();
  const allReviews = Array.isArray(db.reviews) ? db.reviews : [];
  const enrichedReviews = allReviews.map((r: any) => {
    const prod = (db.products || []).find((p: any) => p.id === r.productId);
    return {
      ...r,
      productName: r.productName || prod?.name || "Ahmed Home Décor Item",
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

// Admin Reviews Management CRUD
app.get("/api/admin/reviews", requireAdmin, (req, res) => {
  const db = readDb();
  const allReviews = Array.isArray(db.reviews) ? db.reviews : [];
  const enrichedReviews = allReviews.map((r: any) => {
    const prod = (db.products || []).find((p: any) => p.id === r.productId);
    return {
      ...r,
      productName: r.productName || prod?.name || "Ahmed Home Décor Item",
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

  const reviewIndex = db.reviews.findIndex((r: any) => r.id === id);
  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Review not found." });
  }

  db.reviews[reviewIndex].status = status;
  db.reviews[reviewIndex].updatedAt = new Date().toISOString();

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
  db.reviews = db.reviews.filter((r: any) => r.id !== id);

  if (db.reviews.length === initialCount) {
    return res.status(404).json({ error: "Review not found." });
  }

  writeDb(db);
  res.json({ success: true, message: "Review deleted successfully." });
});

// Products CRUD
app.post("/api/admin/products", requireAdmin, (req, res) => {
  const body = req.body;
  if (!body.name || (!body.categoryId && !body.newCategoryName && !body.categoryName)) {
    return res.status(400).json({ error: "Product name and category are required." });
  }

  // Calculate pricing & discount
  const rawBasePrice = body.originalPrice !== undefined && body.originalPrice !== ""
    ? Number(body.originalPrice)
    : Number(body.price);

  if (isNaN(rawBasePrice) || rawBasePrice <= 0) {
    return res.status(400).json({ error: "A valid positive product price is required." });
  }

  const rawDiscount = body.discountPercentage !== undefined && body.discountPercentage !== ""
    ? Number(body.discountPercentage)
    : 0;

  if (isNaN(rawDiscount) || rawDiscount < 0 || rawDiscount > 100) {
    return res.status(400).json({ error: "Discount percentage must be between 0% and 100%." });
  }

  const pricing = calculateProductPricing(rawBasePrice, rawDiscount);

  const db = readDb();
  let category = (db.categories || []).find((c: any) => c.id === body.categoryId);
  let resolvedCategoryId = body.categoryId;
  let resolvedCategoryName = category?.name || body.categoryName || "General";

  // Support directly creating a new category when specified by user
  const rawCustomCategory = String(body.newCategoryName || (!category && body.categoryName ? body.categoryName : "")).trim();
  if (rawCustomCategory && rawCustomCategory !== "__custom__") {
    const existing = (db.categories || []).find(
      (c: any) => c.name.toLowerCase() === rawCustomCategory.toLowerCase()
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
      db.categories = [...(db.categories || []), newCat];
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
    designs: Array.isArray(body.designs) ? body.designs : undefined,
    variants: Array.isArray(body.variants) ? body.variants : undefined,
    stockStatus: body.stockStatus || "in_stock",
    stockQuantity: Number(body.stockQuantity) || 1,
    featured: Boolean(body.featured),
    badge: body.badge || "",
    details: body.details || {},
    active: body.active !== undefined ? Boolean(body.active) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.products = [newProduct, ...(db.products || [])];
  writeDb(db);

  res.status(201).json({ success: true, product: newProduct });
});

// Synchronize products to persistent storage (handles reconnect/restore after container restart)
app.post("/api/admin/sync-products", (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.json({ success: true, count: 0 });
  }

  const db = readDb();
  let updated = false;
  const existingIds = new Set((db.products || []).map((p: any) => p.id));

  for (const prod of products) {
    if (prod && prod.id && !existingIds.has(prod.id)) {
      db.products = [normalizeProductPricing(prod), ...(db.products || [])];
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

  const index = (db.products || []).findIndex((p: any) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found." });
  }

  const existing = db.products[index];

  // Pricing & discount calculation
  let rawBasePrice: number;
  if (body.originalPrice !== undefined && body.originalPrice !== "") {
    rawBasePrice = Number(body.originalPrice);
  } else if (body.price !== undefined && body.price !== "") {
    rawBasePrice = existing.originalPrice || Number(body.price);
  } else {
    rawBasePrice = existing.originalPrice || existing.oldPrice || existing.price;
  }

  if (isNaN(rawBasePrice) || rawBasePrice <= 0) {
    return res.status(400).json({ error: "A valid positive product price is required." });
  }

  let rawDiscount: number;
  if (body.discountPercentage !== undefined && body.discountPercentage !== "") {
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
  let category = (db.categories || []).find((c: any) => c.id === body.categoryId);
  let resolvedCategoryId = body.categoryId || existing.categoryId;
  let resolvedCategoryName = category?.name || body.categoryName || existing.categoryName;

  const rawCustomCategory = String(body.newCategoryName || (!category && body.categoryName ? body.categoryName : "")).trim();
  if (rawCustomCategory && rawCustomCategory !== "__custom__") {
    const existingCat = (db.categories || []).find(
      (c: any) => c.name.toLowerCase() === rawCustomCategory.toLowerCase()
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
      db.categories = [...(db.categories || []), newCat];
      resolvedCategoryId = newCat.id;
      resolvedCategoryName = newCat.name;
    }
  }

  const updatedProduct = {
    ...existing,
    name: body.name !== undefined ? body.name.trim() : existing.name,
    description: body.description !== undefined ? body.description : existing.description,
    originalPrice: pricing.originalPrice,
    discountPercentage: pricing.discountPercentage,
    price: pricing.salePrice,
    oldPrice: pricing.hasDiscount ? pricing.originalPrice : null,
    categoryId: resolvedCategoryId,
    categoryName: resolvedCategoryName,
    images: Array.isArray(body.images) ? body.images : existing.images,
    designs: body.designs !== undefined ? (Array.isArray(body.designs) ? body.designs : undefined) : existing.designs,
    variants: body.variants !== undefined ? (Array.isArray(body.variants) ? body.variants : undefined) : existing.variants,
    stockStatus: body.stockStatus || existing.stockStatus,
    stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : existing.stockQuantity,
    featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
    badge: body.badge !== undefined ? body.badge : existing.badge,
    details: body.details !== undefined ? body.details : existing.details,
    active: body.active !== undefined ? Boolean(body.active) : existing.active,
    updatedAt: new Date().toISOString()
  };

  db.products[index] = updatedProduct;
  writeDb(db);

  res.json({ success: true, product: updatedProduct });
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialLength = (db.products || []).length;
  db.products = (db.products || []).filter((p: any) => p.id !== id);

  if (db.products.length === initialLength) {
    return res.status(404).json({ error: "Product not found." });
  }

  writeDb(db);
  res.json({ success: true, message: "Product deleted successfully." });
});

// Categories CRUD
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
    active: body.active !== undefined ? Boolean(body.active) : true,
    order: Number(body.order) || ((db.categories || []).length + 1)
  };

  db.categories = [...(db.categories || []), newCategory];
  writeDb(db);

  res.status(201).json({ success: true, category: newCategory });
});

app.put("/api/admin/categories/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const db = readDb();

  const index = (db.categories || []).findIndex((c: any) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Category not found." });
  }

  const prevName = db.categories[index].name;
  const updatedCategory = {
    ...db.categories[index],
    name: body.name !== undefined ? body.name.trim() : db.categories[index].name,
    description: body.description !== undefined ? body.description : db.categories[index].description,
    image: body.image !== undefined ? body.image : db.categories[index].image,
    active: body.active !== undefined ? Boolean(body.active) : db.categories[index].active,
    order: body.order !== undefined ? Number(body.order) : db.categories[index].order
  };

  db.categories[index] = updatedCategory;

  // If category name changed, update product categoryName references
  if (body.name && body.name.trim() !== prevName) {
    db.products = (db.products || []).map((p: any) => {
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

  const associatedProducts = (db.products || []).filter((p: any) => p.categoryId === id);
  if (associatedProducts.length > 0 && force !== "true") {
    return res.status(400).json({
      error: `Cannot delete category: ${associatedProducts.length} product(s) are currently attached to this category. Please reassign or delete the products first, or pass force=true to detach.`
    });
  }

  // If force deleting, reassign products to "cat-general" or remove category association safely
  if (associatedProducts.length > 0 && force === "true") {
    db.products = (db.products || []).map((p: any) => {
      if (p.categoryId === id) {
        return { ...p, categoryId: "general", categoryName: "Uncategorized" };
      }
      return p;
    });
  }

  const initialLength = (db.categories || []).length;
  db.categories = (db.categories || []).filter((c: any) => c.id !== id);

  if (db.categories.length === initialLength) {
    return res.status(404).json({ error: "Category not found." });
  }

  writeDb(db);
  res.json({ success: true, message: "Category deleted successfully." });
});

// Hero Slides CRUD
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
    active: body.active !== undefined ? Boolean(body.active) : true,
    order: Number(body.order) || ((db.slides || []).length + 1)
  };

  db.slides = [...(db.slides || []), newSlide];
  writeDb(db);

  res.status(201).json({ success: true, slide: newSlide });
});

app.put("/api/admin/slides/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const db = readDb();

  const index = (db.slides || []).findIndex((s: any) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Slide not found." });
  }

  const updatedSlide = {
    ...db.slides[index],
    title: body.title !== undefined ? body.title.trim() : db.slides[index].title,
    subtitle: body.subtitle !== undefined ? body.subtitle.trim() : (db.slides[index].subtitle || ""),
    badge: body.badge !== undefined ? body.badge.trim() : (db.slides[index].badge || ""),
    description: body.description !== undefined ? body.description : db.slides[index].description,
    image: body.image !== undefined ? body.image : db.slides[index].image,
    buttonText: body.buttonText !== undefined ? body.buttonText : db.slides[index].buttonText,
    buttonLink: body.buttonLink !== undefined ? body.buttonLink : db.slides[index].buttonLink,
    active: body.active !== undefined ? Boolean(body.active) : db.slides[index].active,
    order: body.order !== undefined ? Number(body.order) : db.slides[index].order
  };

  db.slides[index] = updatedSlide;
  writeDb(db);

  res.json({ success: true, slide: updatedSlide });
});

app.delete("/api/admin/slides/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialLength = (db.slides || []).length;
  db.slides = (db.slides || []).filter((s: any) => s.id !== id);

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
  const slideMap = new Map<string, any>((db.slides || []).map((s: any) => [s.id, s]));

  const reordered: any[] = [];
  slideIds.forEach((id: string, idx: number) => {
    const slide = slideMap.get(id);
    if (slide) {
      slide.order = idx + 1;
      reordered.push(slide);
      slideMap.delete(id);
    }
  });

  // Append any remaining slides
  slideMap.forEach((slide: any) => {
    slide.order = reordered.length + 1;
    reordered.push(slide);
  });

  db.slides = reordered;
  writeDb(db);

  res.json({ success: true, slides: db.slides });
});

// Site Settings CRUD
app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const body = req.body;
  const db = readDb();

  // Clean up any obsolete settings fields from body and db
  delete body.about;
  delete body.introVideo;
  delete db.settings.about;
  delete db.settings.introVideo;

  db.settings = {
    ...db.settings,
    ...body,
    announcement: {
      ...db.settings.announcement,
      ...(body.announcement || {})
    },
    socialLinks: {
      ...db.settings.socialLinks,
      ...(body.socialLinks || {})
    }
  };

  delete db.settings.about;
  delete db.settings.introVideo;

  // Never store the admin authentication email in public settings
  const adminEmail = (db.admin?.email || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  if (
    db.settings.email &&
    (db.settings.email.toLowerCase().trim() === adminEmail ||
      db.settings.email.toLowerCase().trim() === "tayyabmateen2121@gmail.com")
  ) {
    db.settings.email = "";
  }

  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

// Inquiries / Requests management
app.delete("/api/admin/inquiries/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.inquiries = (db.inquiries || []).filter((i: any) => i.id !== id);
  writeDb(db);
  res.json({ success: true });
});

app.delete("/api/admin/inquiries", requireAdmin, (req, res) => {
  const db = readDb();
  db.inquiries = [];
  writeDb(db);
  res.json({ success: true, message: "All inquiries cleared." });
});

// Admin Media List & Delete
app.get("/api/admin/media", requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const diskFiles = fs.readdirSync(UPLOADS_DIR).filter((f) => !f.startsWith("."));
    const db = readDb();
    if (!Array.isArray(db.media)) db.media = [];

    let dbUpdated = false;
    const existingMap = new Map<string, any>();
    db.media.forEach((m: any) => {
      if (m && m.filename) existingMap.set(m.filename, m);
    });

    // Sync disk files into db.media records
    for (const file of diskFiles) {
      if (!existingMap.has(file)) {
        const fullPath = path.join(UPLOADS_DIR, file);
        try {
          const stat = fs.statSync(fullPath);
          const ext = path.extname(file).toLowerCase();
          const isVideo = [".mp4", ".webm"].includes(ext);
          const mimeType = isVideo
            ? "video/mp4"
            : ext === ".webp"
            ? "image/webp"
            : ext === ".png"
            ? "image/png"
            : "image/jpeg";

          const newRecord = {
            id: `media-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
            url: `/uploads/${file}`,
            filename: file,
            originalName: file,
            mimeType,
            size: stat.size,
            createdAt: stat.birthtime ? stat.birthtime.toISOString() : new Date().toISOString()
          };
          db.media.push(newRecord);
          existingMap.set(file, newRecord);
          dbUpdated = true;
        } catch {
          // ignore unreadable file stat
        }
      }
    }

    // Clean up records where file was removed from disk
    const prevCount = db.media.length;
    db.media = db.media.filter((m: any) => {
      if (!m || !m.filename) return false;
      const onDisk = diskFiles.includes(m.filename);
      return onDisk;
    });
    if (db.media.length !== prevCount) {
      dbUpdated = true;
    }

    // Sort newest first
    db.media.sort((a: any, b: any) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    if (dbUpdated) {
      writeDb(db);
    }

    const files = db.media.map((m: any) => m.url);
    res.json({
      success: true,
      files,
      items: db.media
    });
  } catch (err: any) {
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

    // Remove from db.media and db.uploadedFiles
    const db = readDb();
    let dbUpdated = false;
    if (Array.isArray(db.media)) {
      const prevLen = db.media.length;
      db.media = db.media.filter((m: any) => {
        const itemStr = typeof m === "string" ? m : m?.filename || m?.url || "";
        return !itemStr.includes(safeFilename);
      });
      if (db.media.length !== prevLen) dbUpdated = true;
    }
    if (Array.isArray(db.uploadedFiles)) {
      const prevLen = db.uploadedFiles.length;
      db.uploadedFiles = db.uploadedFiles.filter((m: any) => {
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
  } catch (err: any) {
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
      db.media = db.media.filter((m: any) => {
        const itemStr = typeof m === "string" ? m : m?.filename || m?.url || "";
        return !itemStr.includes(safeFilename);
      });
      if (db.media.length !== prevLen) dbUpdated = true;
    }
    if (Array.isArray(db.uploadedFiles)) {
      const prevLen = db.uploadedFiles.length;
      db.uploadedFiles = db.uploadedFiles.filter((m: any) => {
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
  } catch (err: any) {
    console.error("Delete media error:", err);
    res.status(500).json({ error: err.message || "Failed to delete media file." });
  }
});

// Unmatched API route handler (prevent returning HTML for API calls)
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
});


export { app };
export default app;
