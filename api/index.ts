import "dotenv/config";
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

// Primary Persistent Database Configuration: Upstash Redis REST API
function getPersistentStorageConfig() {
  let restUrl = (
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    ""
  ).trim().replace(/\/+$/, "");

  let restToken = (
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    ""
  ).trim();

  // If REST URL or Token not found, attempt to parse from KV_URL / UPSTASH_REDIS_URL / REDIS_URL
  if (!restUrl || !restToken) {
    const connStr = (
      process.env.KV_URL ||
      process.env.UPSTASH_REDIS_URL ||
      process.env.REDIS_URL ||
      ""
    ).trim();

    if (connStr) {
      try {
        const parsed = new URL(connStr);
        if (parsed.hostname && parsed.password) {
          if (!restUrl) {
            restUrl = `https://${parsed.hostname}`;
          }
          if (!restToken) {
            restToken = decodeURIComponent(parsed.password);
          }
        }
      } catch {}
    }
  }

  return {
    url: restUrl,
    token: restToken,
    isConfigured: Boolean(restUrl && restToken)
  };
}

const STORE_DB_KEY = "ahmed_store_database";

const UPLOADS_DIR = process.env.UPLOADS_DIR || resolveStorageDir("uploads");
const DATA_DIR = process.env.DATA_DIR || resolveStorageDir("data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const BACKUP_FILE = path.join(DATA_DIR, "db.backup.json");

let inMemoryDb: any = null;

function readLocalDbFile(): any {
  const candidatePaths = [
    DB_FILE,
    BACKUP_FILE,
    path.join(process.cwd(), "src", "data", "storeDb.json"),
    path.join(process.cwd(), "data", "db.json"),
    path.join("/tmp", "ahmed_decor", "data", "db.json")
  ];
  for (const c of candidatePaths) {
    if (fs.existsSync(c)) {
      try {
        const raw = fs.readFileSync(c, "utf8");
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        }
      } catch {}
    }
  }
  return staticDbData || null;
}

function getFastDbSnapshot(): any {
  if (inMemoryDb) return inMemoryDb;
  return readLocalDbFile();
}

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

// Direct fallback file handler for uploaded media: checks active uploads dir, public uploads, dist, Upstash remote media, base64 db cache, and graceful fallback
app.get("/uploads/:filename", async (req, res) => {
  const safeName = path.basename(req.params.filename);

  // 1. Filesystem candidate checks
  const diskCandidates = [
    path.join(UPLOADS_DIR, safeName),
    path.join(process.cwd(), "public", "uploads", safeName),
    path.join(process.cwd(), "uploads", safeName),
    path.join(process.cwd(), "dist", "uploads", safeName),
    path.join("/tmp", "ahmed_decor", "uploads", safeName)
  ];

  for (const candidate of diskCandidates) {
    if (fs.existsSync(candidate)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(candidate);
    }
  }

  // 2. Upstash Redis remote media storage lookup (survives Vercel serverless recycling)
  try {
    const config = getPersistentStorageConfig();
    if (config.isConfigured) {
      const remoteRes = await fetch(`${config.url}/get/ahmed_media:${safeName}`, {
        headers: { Authorization: `Bearer ${config.token}` }
      });
      if (remoteRes.ok) {
        const json: any = await remoteRes.json();
        if (json && json.result) {
          const mediaObj = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
          if (mediaObj && mediaObj.base64) {
            const buffer = Buffer.from(mediaObj.base64, "base64");
            try {
              const cacheTarget = path.join(UPLOADS_DIR, safeName);
              fs.writeFileSync(cacheTarget, buffer);
            } catch {}
            res.setHeader("Content-Type", mediaObj.mimeType || "image/png");
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            return res.send(buffer);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Notice: remote media lookup error:", err);
  }

  // 3. Database media base64 fallback
  try {
    const db = getFastDbSnapshot();
    const allMedia = Array.isArray(db?.media) ? db.media : [];
    const mediaRecord = allMedia.find(
      (m: any) => m && (m.filename === safeName || m.url === `/uploads/${safeName}`)
    );

    if (mediaRecord && mediaRecord.base64) {
      const buffer = Buffer.from(mediaRecord.base64, "base64");
      try {
        const cacheTarget = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(cacheTarget, buffer);
      } catch {}

      res.setHeader("Content-Type", mediaRecord.mimeType || "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(buffer);
    }
  } catch (err) {
    console.error("Notice: base64 media lookup error:", err);
  }

  // 4. Fallback for the known artificial grass panel photo
  if (safeName.includes("1790432214895") || safeName.toLowerCase().includes("grass")) {
    const grassFile = path.join(process.cwd(), "public", "uploads", "ahmed_1790432214895_f13f6208.png");
    if (fs.existsSync(grassFile)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(grassFile);
    }
  }

  // 5. Clean branded SVG placeholder to avoid ugly broken 404 images in production
  const ext = path.extname(safeName).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#f8fafc"/>
      <rect x="20" y="20" width="560" height="560" rx="24" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="300" cy="270" r="64" fill="#047857" opacity="0.1"/>
      <path d="M300 230 C280 250 280 290 300 310 C320 290 320 250 300 230 Z" fill="#047857"/>
      <text x="300" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#334155" text-anchor="middle">Ahmed Home Décor</text>
      <text x="300" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Artisan Collection • Khushab</text>
    </svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(svg);
  }

  return res.status(404).send("File not found");
});

// Data directory and files are already resolved at top of file

// Admin credential configuration & secure password hashing (PBKDF2 SHA-512)
const ADMIN_SALT = process.env.ADMIN_SALT || "ahmed_decor_secure_salt_2026";
const KNOWN_SALTS = Array.from(
  new Set([ADMIN_SALT, "ahmed_decor_secure_salt_2026", "Ahd9$Kx7!Qm2#Vt8@Lp5Zr4"].filter(Boolean))
);

// Cryptographically signed stateless session secret (verifiable across all Vercel serverless containers)
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || ADMIN_SALT || "ahmed_decor_secure_session_secret_2026_v9x";

interface AdminSessionPayload {
  email: string;
  role: "admin";
  iat: number;
  exp: number;
  nonce: string;
}

function createAdminToken(email: string): string {
  const payload: AdminSessionPayload = {
    email: email.toLowerCase().trim(),
    role: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days validity
    nonce: crypto.randomBytes(8).toString("hex")
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(payloadBase64).digest("base64url");
  return `ahmed_adm_${payloadBase64}.${signature}`;
}

function verifyAdminToken(token: string): { valid: boolean; email?: string } {
  if (!token || typeof token !== "string") return { valid: false };
  const trimmed = token.trim();

  // 1. Primary: Verify stateless cryptographically signed session token (cross-container safe)
  if (trimmed.startsWith("ahmed_adm_")) {
    try {
      const raw = trimmed.slice("ahmed_adm_".length);
      const parts = raw.split(".");
      if (parts.length === 2) {
        const [payloadBase64, signature] = parts;
        const expectedSig = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(payloadBase64).digest("base64url");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSig);
        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
          const payload: AdminSessionPayload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
          const now = Math.floor(Date.now() / 1000);
          if (payload && payload.role === "admin" && payload.exp && payload.exp > now) {
            return { valid: true, email: payload.email };
          }
        }
      }
    } catch {}
  }

  // 2. Legacy fallback: check tokens in database
  try {
    const db = getFastDbSnapshot();
    if (Array.isArray(db.admin?.tokens) && db.admin.tokens.includes(trimmed)) {
      return { valid: true, email: db.admin?.email || DEFAULT_ADMIN_EMAIL };
    }
  } catch {}

  return { valid: false };
}

// Request cookie parser helper
function parseCookies(req: express.Request): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      list[name] = decodeURIComponent(val);
    }
  });
  return list;
}

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
const initialDbData = staticDbData || {
  admin: {
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: DEFAULT_ADMIN_HASH,
    tokens: [] as string[]
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
      id: "slide-1790179919346",
      title: "Lush Greenery for Modern Outdoor Spaces",
      subtitle: "PREMIUM ARTIFICIAL GRASS & GREENERY",
      badge: "Commercial & Home Grade",
      description: "Transform your patios, balconies, rooftops, and vertical walls with all-weather, UV-treated lifelike artificial grass.",
      image: "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Browse Grass Panels",
      buttonLink: "/products",
      whatsappText: "Salam Ahmed Home Decor, I am inquiring about Artificial Grass Wall Panels.",
      active: true,
      order: 1
    },
    {
      id: "slide-1790319348448",
      title: "Modern Wall Art & Living Room Decor",
      subtitle: "HANDCRAFTED LUXURY STATEMENT PIECES",
      badge: "Best Seller In Khushab",
      description: "Discover framed landscape canvas sets, electroplated metal sculptures, and bespoke artisan accents.",
      image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1600&q=80",
      buttonText: "Explore Collection",
      buttonLink: "/products",
      whatsappText: "Salam Ahmed Home Decor, I want to explore your Wall Art and Framed Decor Collection.",
      active: true,
      order: 2
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
      description: "Minimalist Nordic ceramic donut vases, pampas grass arrangements, and gold electroplated metal centerpieces.",
      image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 4
    },
    {
      id: "cat-cushions-textiles",
      name: "Velvet Cushions & Living Textiles",
      slug: "cushions-textiles",
      description: "Embroidered ethnic throw pillow covers, textured waffle sofa runners, and dining table mats.",
      image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 5
    },
    {
      id: "cat-1790432369943-85580a",
      name: "Artificial Grass & Plants",
      slug: "artificial-grass-plants",
      description: "Premium UV-resistant artificial grass rolls, vertical garden wall mats, and realistic indoor faux greenery.",
      image: "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
      active: true,
      order: 6
    }
  ],
  products: [
    {
      id: "prod-1790329404741-caed26",
      name: "Framed Scenic Landscape & Floral Vertical Wall Art Set",
      description: "A breathtaking museum-grade framed canvas triptych capturing misty mountain valleys and vibrant botanical blooms in natural morning sunlight. Encased in floating Champagne Gold composite frames with crystal clear acrylic protective face. Ideal for living room center walls, dining areas, and upscale executive lounges.",
      originalPrice: 14500,
      discountPercentage: 21,
      price: 11455,
      oldPrice: 14500,
      categoryId: "cat-clocks-mirrors",
      categoryName: "Luxury Wall Clocks & Mirrors",
      images: [
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 12,
      featured: true,
      badge: "Artisan Choice",
      details: {
        material: "Waterproof Textured Canvas on Engineered Wood with Brushed Gold Frame",
        dimensions: "120cm x 80cm (48 x 32 inches total span)",
        finishColor: "Champagne Gold Floating Frame with Vibrant Natural Pigments",
        origin: "Ahmed Home Decoration Curated Artisan Collection, Khushab",
        careInstructions: "Dust gently with dry microfiber cloth. Do not use wet scouring pads."
      },
      active: true,
      createdAt: "2026-03-27T08:00:00.000Z",
      updatedAt: "2026-03-27T08:00:00.000Z"
    },
    {
      id: "prod-1790432370431-0c5a57",
      name: "Artificial Grass Wall Panel (Rs. 130 per sq. ft.)",
      description: "Ultra-dense, realistic artificial grass and foliage wall panels designed for vibrant accent walls, background partitions, indoor gardens, and commercial displays. Weather-resistant and UV-treated for lasting emerald brilliance without fading.",
      originalPrice: 150,
      discountPercentage: 13,
      price: 130,
      oldPrice: 150,
      categoryId: "cat-1790432369943-85580a",
      categoryName: "Artificial Grass & Plants",
      images: [
        "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80"
      ],
      stockStatus: "in_stock",
      stockQuantity: 500,
      featured: true,
      badge: "Hot Deal",
      details: {
        material: "High Density UV-Stabilized Polyethylene (PE) with Mesh Backing",
        dimensions: "Rate per square foot (Custom cut & multi-panel interlocking)",
        finishColor: "Lush Multi-Tone Emerald & Forest Green",
        origin: "Direct Wholesale Import & Expert Installation by Ahmed Home Decoration, Khushab",
        careInstructions: "Wash with low pressure water hose or brush with soft broom."
      },
      active: true,
      createdAt: "2026-03-28T09:00:00.000Z",
      updatedAt: "2026-03-28T09:00:00.000Z"
    }
  ],
  reviews: [] as any[],
  inquiries: [] as any[],
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

// Local file mirror for passive backup
function writeLocalBackup(data: any): void {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE, jsonStr, "utf8");
    } catch {}

    try {
      const dir = path.dirname(BACKUP_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(BACKUP_FILE, jsonStr, "utf8");
    } catch {}

    try {
      const tmpDir = path.join("/tmp", "ahmed_decor", "data");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, "db.json"), jsonStr, "utf8");
    } catch {}
  } catch {}
}

async function getDatabase(): Promise<any> {
  const config = getPersistentStorageConfig();

  // 1. Primary Persistent Connection: Read directly from Upstash Redis / Vercel KV REST API
  if (config.isConfigured) {
    try {
      const res = await fetch(`${config.url}/get/${STORE_DB_KEY}`, {
        headers: {
          Authorization: `Bearer ${config.token}`
        }
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Upstash Redis read failed with HTTP ${res.status}: ${errText}`);
      }

      const json: any = await res.json();
      // Check if key exists in Upstash Redis
      if (json && json.result !== null && json.result !== undefined) {
        const remoteDb = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
        if (remoteDb && typeof remoteDb === "object") {
          if (!Array.isArray(remoteDb.products)) {
            remoteDb.products = [];
          }
          remoteDb.products = remoteDb.products.map(normalizeProductPricing);
          inMemoryDb = remoteDb;
          writeLocalBackup(remoteDb);
          return remoteDb;
        }
      } else {
        // Key does NOT exist in Upstash Redis yet (brand-new empty database initialization)
        console.log("Upstash Redis store database key not found. Initializing persistent catalog once.");
        const seed = readLocalDbFile() || staticDbData || initialDbData;
        await saveDatabase(seed);
        return seed;
      }
    } catch (err: any) {
      console.error("Persistent storage read error:", err);
      // If we previously loaded data from Upstash in this server instance, serve it as a temporary resilience cache
      if (inMemoryDb) {
        console.warn("Serving cached in-memory database snapshot due to temporary connection error.");
        return inMemoryDb;
      }
      // CRITICAL: Never silently fall back to hardcoded initialDbData when persistent storage is configured!
      throw new Error(`Failed to load store database from persistent storage: ${err.message}`);
    }
  }

  // 2. Persistent storage is unconfigured
  if (process.env.VERCEL) {
    throw new Error(
      "Persistent database (Upstash Redis / Vercel KV) is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) in your Vercel Project Settings > Environment Variables."
    );
  }

  // Local development fallback
  if (inMemoryDb) {
    return inMemoryDb;
  }

  const local = readLocalDbFile() || staticDbData || initialDbData;
  inMemoryDb = local;
  return local;
}

async function saveDatabase(data: any): Promise<boolean> {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid database payload for save");
  }

  if (!Array.isArray(data.products)) data.products = [];
  if (!Array.isArray(data.categories)) data.categories = [];
  if (!Array.isArray(data.slides)) data.slides = [];
  if (!Array.isArray(data.reviews)) data.reviews = [];
  if (!Array.isArray(data.inquiries)) data.inquiries = [];
  if (!Array.isArray(data.media)) data.media = [];

  // Sanitize media items in db.media so large raw base64 data is not stored in the main DB key
  const sanitizedMedia = data.media.map((m: any) => {
    if (!m) return m;
    const { base64, ...rest } = m;
    return rest;
  });
  const dataToSave = {
    ...data,
    media: sanitizedMedia
  };

  const jsonStr = JSON.stringify(dataToSave);
  const config = getPersistentStorageConfig();

  // 1. Primary Persistent Save: Await direct write to Upstash Redis with NO TTL (permanent storage)
  if (config.isConfigured) {
    const res = await fetch(`${config.url}/set/${STORE_DB_KEY}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json"
      },
      body: jsonStr
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`Upstash Redis write failed: HTTP ${res.status}: ${errText}`);
      throw new Error(`Failed to persist data to Upstash Redis (HTTP ${res.status}: ${errText})`);
    }

    const json = await res.json().catch(() => ({}));
    if (json.error) {
      console.error("Upstash Redis write error:", json.error);
      throw new Error(`Upstash Redis write error: ${json.error}`);
    }

    inMemoryDb = JSON.parse(jsonStr);
    writeLocalBackup(inMemoryDb);
    return true;
  }

  // 2. If running on Vercel and persistent storage is missing, fail clearly
  if (process.env.VERCEL) {
    throw new Error(
      "Cannot save changes: Upstash Redis / Vercel KV is not configured in Vercel environment variables."
    );
  }

  // 3. Fallback to local files only in local development
  inMemoryDb = JSON.parse(jsonStr);
  writeLocalBackup(inMemoryDb);
  return true;
}

// Global async database helpers
async function readDb(): Promise<any> {
  return await getDatabase();
}

async function writeDb(data: any): Promise<boolean> {
  return await saveDatabase(data);
}

function extractAdminToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const t = authHeader.substring(7).trim();
    if (t) return t;
  }
  const customHeader = req.headers["x-admin-token"];
  if (typeof customHeader === "string" && customHeader.trim()) {
    return customHeader.trim();
  }
  const cookies = parseCookies(req);
  if (cookies.ahmed_admin_session && cookies.ahmed_admin_session.trim()) {
    return cookies.ahmed_admin_session.trim();
  }
  return null;
}

// Authentication middleware: validates stateless cryptographic token or legacy token across all Vercel instances
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractAdminToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Missing or invalid admin token." });
  }

  const verified = verifyAdminToken(token);
  if (!verified.valid) {
    return res.status(401).json({ error: "Unauthorized. Session expired or invalid." });
  }

  (req as any).admin = { email: verified.email || DEFAULT_ADMIN_EMAIL };
  next();
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Get public store data (products, categories, slides, site settings)
app.get("/api/public/data", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const db = await readDb();
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
  } catch (err: any) {
    console.error("Public data load error:", err);
    res.status(500).json({ error: "Failed to load store data." });
  }
});

// Track customer WhatsApp order click
app.post("/api/inquiries", async (req, res) => {
  try {
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

    const db = await readDb();
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
    await writeDb(db);

    res.json({ success: true, inquiry: newInquiry });
  } catch (err: any) {
    console.error("Inquiry logging error:", err);
    res.status(500).json({ error: "Failed to save inquiry." });
  }
});

// Customer Reviews API - Public GET returns only APPROVED reviews
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDb();
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
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch product reviews." });
  }
});

// Customer Reviews API - Public POST creates a review with PENDING status
app.post("/api/products/:id/reviews", async (req, res) => {
  try {
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

    const db = await readDb();
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
    await writeDb(db);

    res.json({
      success: true,
      message: "Thank you for your review! Your review has been submitted for verification and will appear on the store once approved by our team.",
      review: newReview
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to submit review." });
  }
});

// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================

app.post("/api/admin/login", async (req, res) => {
  try {
    const emailInput = (req.body.email || "").trim();
    const passwordInput = (req.body.password || "").trim();

    if (!emailInput || !passwordInput) {
      return res.status(400).json({ error: "Email and password are required to sign in." });
    }

    const db = await readDb();
    if (!db.admin) {
      db.admin = {
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash: DEFAULT_ADMIN_HASH,
        tokens: []
      };
      await writeDb(db);
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

    // Create cryptographically signed stateless token (works across all serverless instances)
    const token = createAdminToken(db.admin.email || DEFAULT_ADMIN_EMAIL);
    if (!db.admin.tokens || !Array.isArray(db.admin.tokens)) db.admin.tokens = [];
    db.admin.tokens = [token, ...db.admin.tokens.slice(0, 9)];
    await writeDb(db);

    // Set secure HTTP-only cookie without explicit domain restriction (works across main & preview domains)
    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
    try {
      res.cookie("ahmed_admin_session", token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    } catch {}

    res.json({
      success: true,
      token,
      admin: { email: db.admin.email || DEFAULT_ADMIN_EMAIL }
    });
  } catch (err: any) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "An unexpected error occurred during admin sign-in." });
  }
});

app.get("/api/admin/verify", requireAdmin, (req, res) => {
  const verifiedEmail = (req as any).admin?.email || DEFAULT_ADMIN_EMAIL;
  res.json({ success: true, email: verifiedEmail });
});

app.post("/api/admin/logout", async (req, res) => {
  try {
    res.clearCookie("ahmed_admin_session", {
      path: "/",
      sameSite: "lax"
    });
  } catch {}

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const db = await readDb();
        if (db.admin?.tokens && db.admin.tokens.includes(token)) {
          db.admin.tokens = db.admin.tokens.filter((t: string) => t !== token);
          await writeDb(db);
        }
      } catch {}
    }
  }
  res.json({ success: true, message: "Logged out successfully." });
});

// Storage and persistence status diagnosis endpoint
app.get("/api/admin/storage-status", requireAdmin, async (req, res) => {
  try {
    const config = getPersistentStorageConfig();
    let isRemoteConnected = false;
    let remoteCheckError = null;

    if (config.isConfigured) {
      try {
        const testRes = await fetch(`${config.url}/ping`, {
          headers: { Authorization: `Bearer ${config.token}` }
        });
        isRemoteConnected = testRes.ok;
      } catch (e: any) {
        remoteCheckError = e.message;
      }
    }

    const db = await readDb();
    res.json({
      status: "ok",
      storageType: config.isConfigured ? "upstash_redis_cloud" : "local_file_backed",
      hasRemoteStorage: config.isConfigured,
      isRemoteConnected,
      remoteCheckError,
      productsCount: (db.products || []).length,
      categoriesCount: (db.categories || []).length,
      reviewsCount: (db.reviews || []).length,
      mediaCount: (db.media || []).length,
      sessionMode: "stateless_cryptographic_hmac",
      verifiedEmail: (req as any).admin?.email || DEFAULT_ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch storage status: " + err.message });
  }
});

// Full database export endpoint (for store owner backup)
app.get("/api/admin/export-database", requireAdmin, async (req, res) => {
  try {
    const db = await readDb();
    const exportPayload = {
      ...db,
      admin: {
        email: db.admin?.email || DEFAULT_ADMIN_EMAIL
      }
    };
    res.setHeader("Content-Disposition", `attachment; filename=ahmed_decor_db_${Date.now()}.json`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(exportPayload, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to export database." });
  }
});

// Full database import endpoint (for store owner restore)
app.post("/api/admin/import-database", requireAdmin, async (req, res) => {
  try {
    const { database } = req.body;
    if (!database || !Array.isArray(database.products) || !Array.isArray(database.categories)) {
      return res.status(400).json({ error: "Invalid database JSON. Expected products and categories arrays." });
    }

    const currentDb = await readDb();
    const merged = {
      ...database,
      admin: {
        ...database.admin,
        email: currentDb.admin?.email || database.admin?.email || DEFAULT_ADMIN_EMAIL,
        passwordHash: currentDb.admin?.passwordHash || database.admin?.passwordHash || DEFAULT_ADMIN_HASH,
        tokens: currentDb.admin?.tokens || []
      }
    };

    await writeDb(merged);
    res.json({
      success: true,
      message: "Database successfully restored from backup.",
      productsCount: merged.products.length,
      categoriesCount: merged.categories.length
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to import database." });
  }
});

app.post("/api/admin/change-credentials", requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;
    const db = await readDb();

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

    await writeDb(db);
    res.json({
      success: true,
      message: "Admin credentials updated successfully.",
      email: db.admin.email
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update admin credentials." });
  }
});

// ==========================================
// FILE UPLOAD ROUTE (Direct <input type="file"> support)
// ==========================================

app.post("/api/upload", requireAdmin, async (req, res) => {
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
    const db = await readDb();
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
    try {
      fs.writeFileSync(filePath, buffer);
    } catch {}

    // Also mirror to public/uploads if writable
    try {
      const pubPath = path.join(process.cwd(), "public", "uploads", safeName);
      fs.writeFileSync(pubPath, buffer);
    } catch {}

    const publicUrl = `/uploads/${safeName}`;

    // If persistent storage is configured, save individual media base64 under dedicated key
    const config = getPersistentStorageConfig();
    if (config.isConfigured && base64Data) {
      try {
        await fetch(`${config.url}/set/ahmed_media:${safeName}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mimeType: resolvedMimeType,
            base64: base64Data
          })
        });
      } catch (mediaErr) {
        console.warn("Could not save media base64 to dedicated Upstash key:", mediaErr);
      }
    }

    // Persist media metadata record without bloating the main database payload
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
    await writeDb(db);

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

app.get("/api/admin/all-data", requireAdmin, async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const db = await readDb();
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
    adminEmail: db.admin?.email || DEFAULT_ADMIN_EMAIL,
    admin: { email: db.admin?.email || DEFAULT_ADMIN_EMAIL }
  });
});

// Admin Reviews Management CRUD
app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
  const db = await readDb();
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

app.put("/api/admin/reviews/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "hidden", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid review status. Must be approved, hidden, or pending." });
    }

    const db = await readDb();
  if (!Array.isArray(db.reviews)) {
    db.reviews = [];
  }

  const reviewIndex = db.reviews.findIndex((r: any) => r.id === id);
  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Review not found." });
  }

  db.reviews[reviewIndex].status = status;
  db.reviews[reviewIndex].updatedAt = new Date().toISOString();

  await writeDb(db);
  res.json({ success: true, review: db.reviews[reviewIndex] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update review status." });
  }
});

app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDb();
  if (!Array.isArray(db.reviews)) {
    db.reviews = [];
  }

  const initialCount = db.reviews.length;
  db.reviews = db.reviews.filter((r: any) => r.id !== id);

  if (db.reviews.length === initialCount) {
    return res.status(404).json({ error: "Review not found." });
  }

  await writeDb(db);
  res.json({ success: true, message: "Review deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete review." });
  }
});

// Products CRUD
app.post("/api/admin/products", requireAdmin, async (req, res) => {
  try {
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

  const db = await readDb();
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
  await writeDb(db);

  res.status(201).json({ success: true, product: newProduct });
  } catch (err: any) {
    console.error("Create product error:", err);
    res.status(500).json({ error: err.message || "Failed to create product." });
  }
});

// Synchronize products to persistent storage (handles reconnect/restore after container restart)
app.post("/api/admin/sync-products", async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const db = await readDb();
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
    await writeDb(db);
  }

  res.json({ success: true, count: (db.products || []).length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to sync products." });
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const db = await readDb();

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
  await writeDb(db);

  res.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    console.error("Update product error:", err);
    res.status(500).json({ error: err.message || "Failed to update product." });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDb();

  const initialLength = (db.products || []).length;
  db.products = (db.products || []).filter((p: any) => p.id !== id);

  if (db.products.length === initialLength) {
    return res.status(404).json({ error: "Product not found." });
  }

  await writeDb(db);
  res.json({ success: true, message: "Product deleted successfully." });
  } catch (err: any) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: err.message || "Failed to delete product." });
  }
});

// Categories CRUD
app.post("/api/admin/categories", requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!body.name) {
      return res.status(400).json({ error: "Category name is required." });
    }

    const db = await readDb();
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
  await writeDb(db);

  res.status(201).json({ success: true, category: newCategory });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create category." });
  }
});

app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const db = await readDb();

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

  await writeDb(db);
  res.json({ success: true, category: updatedCategory });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update category." });
  }
});

app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const db = await readDb();

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

  await writeDb(db);
  res.json({ success: true, message: "Category deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete category." });
  }
});

// Hero Slides CRUD
app.post("/api/admin/slides", requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!body.title || !body.image) {
      return res.status(400).json({ error: "Slide title and image are required." });
    }

    const db = await readDb();
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
  await writeDb(db);

  res.status(201).json({ success: true, slide: newSlide });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create slide." });
  }
});

app.put("/api/admin/slides/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const db = await readDb();

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
  await writeDb(db);

  res.json({ success: true, slide: updatedSlide });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update slide." });
  }
});

app.delete("/api/admin/slides/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDb();

  const initialLength = (db.slides || []).length;
  db.slides = (db.slides || []).filter((s: any) => s.id !== id);

  if (db.slides.length === initialLength) {
    return res.status(404).json({ error: "Slide not found." });
  }

  await writeDb(db);
  res.json({ success: true, message: "Slide deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete slide." });
  }
});

app.put("/api/admin/slides/reorder", requireAdmin, async (req, res) => {
  try {
    const { slideIds } = req.body;
    if (!Array.isArray(slideIds)) {
      return res.status(400).json({ error: "slideIds array is required." });
    }

    const db = await readDb();
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
  await writeDb(db);

  res.json({ success: true, slides: db.slides });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to reorder slides." });
  }
});

// Site Settings CRUD
app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const db = await readDb();

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

  await writeDb(db);
  res.json({ success: true, settings: db.settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update settings." });
  }
});

// Inquiries / Requests management
app.delete("/api/admin/inquiries/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDb();
    db.inquiries = (db.inquiries || []).filter((i: any) => i.id !== id);
    await writeDb(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete inquiry." });
  }
});

app.delete("/api/admin/inquiries", requireAdmin, async (req, res) => {
  try {
    const db = await readDb();
    db.inquiries = [];
    await writeDb(db);
    res.json({ success: true, message: "All inquiries cleared." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to clear inquiries." });
  }
});

// Admin Media List & Delete
app.get("/api/admin/media", requireAdmin, async (req, res) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const diskFiles = fs.readdirSync(UPLOADS_DIR).filter((f) => !f.startsWith("."));
    const db = await readDb();
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
      await writeDb(db);
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

app.delete(["/api/admin/media/:filename", "/api/admin/media"], requireAdmin, async (req, res) => {
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
    const db = await readDb();
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
      await writeDb(db);
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

app.post("/api/admin/media/delete", requireAdmin, async (req, res) => {
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

    const db = await readDb();
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
      await writeDb(db);
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
