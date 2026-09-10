/**
 * CloakSight — Extension Build Script
 *
 * Compiles TypeScript source files from extension/src/ into extension/dist/
 * and copies static assets, manifest, and icons.
 *
 * Usage:
 *   node scripts/build-extension.js          # Single build
 *   node scripts/build-extension.js --watch  # Rebuild on file changes
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const EXT_SRC = path.join(ROOT_DIR, "extension", "src");
const EXT_DIST = path.join(ROOT_DIR, "extension", "dist");
const EXT_ROOT = path.join(ROOT_DIR, "extension");

// ============================================================
// 1. Icon Generator (Pure Node.js PNG — Zero Dependencies)
// ============================================================
function generateShieldPng(size) {
  function crc32(buf) {
    let table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      table[n] = c >>> 0;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    return (crc ^ (-1)) >>> 0;
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawRows = [];
  const cx = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    rawRows.push(0x00); // Filter: None
    for (let x = 0; x < size; x++) {
      const nx = Math.abs((x - cx) / (size * 0.44));
      const ny = (y - 0.1 * size) / (size * 0.85);

      let inShield = false;
      if (ny >= 0 && ny <= 1) {
        const maxWidth = ny < 0.35 ? 1.0 : (1.0 - Math.pow((ny - 0.35) / 0.65, 1.8));
        if (nx <= maxWidth) inShield = true;
      }

      if (inShield) {
        // Shield gradient: Royal Blue (#2563eb) to Darker Blue (#1d4ed8)
        const r = Math.round(37 + (29 - 37) * ny);
        const g = Math.round(99 + (78 - 99) * ny);
        const b = Math.round(235 + (216 - 235) * ny);
        rawRows.push(r, g, b, 255);
      } else {
        rawRows.push(0, 0, 0, 0); // Transparent background
      }
    }
  }

  const idat = zlib.deflateSync(Buffer.from(rawRows));
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function ensureIcons() {
  const iconSizes = [16, 48, 128];
  const targetDirs = [
    path.join(EXT_ROOT, "icons"),
    path.join(EXT_DIST, "icons"),
  ];

  for (const dir of targetDirs) {
    fs.mkdirSync(dir, { recursive: true });
    for (const size of iconSizes) {
      const iconPath = path.join(dir, `icon${size}.png`);
      if (!fs.existsSync(iconPath)) {
        fs.writeFileSync(iconPath, generateShieldPng(size));
      }
    }
  }
}

// ============================================================
// 2. Build Pipeline
// ============================================================
function build() {
  const startTime = Date.now();
  console.log("\n[CloakSight] Starting extension build...");

  // 1. Ensure dist directories
  fs.mkdirSync(path.join(EXT_DIST, "background"), { recursive: true });
  fs.mkdirSync(path.join(EXT_DIST, "content"), { recursive: true });
  fs.mkdirSync(path.join(EXT_DIST, "popup"), { recursive: true });
  fs.mkdirSync(path.join(EXT_DIST, "icons"), { recursive: true });

  // 2. Generate icons
  ensureIcons();

  // 3. Bundle TypeScript entry points using esbuild
  const entryPoints = [
    {
      in: path.join(EXT_SRC, "background", "background.ts"),
      out: path.join(EXT_DIST, "background", "background.js"),
      format: "esm",
    },
    {
      in: path.join(EXT_SRC, "content", "content.ts"),
      out: path.join(EXT_DIST, "content", "content.js"),
      format: "iife",
    },
    {
      in: path.join(EXT_SRC, "popup", "popup.ts"),
      out: path.join(EXT_DIST, "popup", "popup.js"),
      format: "esm",
    },
  ];

  for (const entry of entryPoints) {
    const cmd = `npx -y esbuild "${entry.in}" --bundle --platform=browser --target=es2022 --format=${entry.format} --define:process.env.NODE_ENV='"production"' --define:process.env.CLOAKSIGHT_LOG_LEVEL='"info"' --outfile="${entry.out}"`;
    try {
      execSync(cmd, { cwd: ROOT_DIR, stdio: "pipe" });
      console.log(`  ✓ Built ${path.relative(ROOT_DIR, entry.out)}`);
    } catch (err) {
      console.error(`  ✗ Failed building ${entry.in}:`, err.stderr?.toString() || err.message);
      throw err;
    }
  }

  // 4. Copy static assets
  const copies = [
    {
      src: path.join(EXT_ROOT, "manifest.json"),
      dest: path.join(EXT_DIST, "manifest.json"),
    },
    {
      src: path.join(EXT_SRC, "popup", "popup.html"),
      dest: path.join(EXT_DIST, "popup", "popup.html"),
    },
    {
      src: path.join(EXT_SRC, "popup", "popup.css"),
      dest: path.join(EXT_DIST, "popup", "popup.css"),
    },
  ];

  for (const { src, dest } of copies) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Copied ${path.basename(dest)} to dist/`);
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[CloakSight] Build completed in ${elapsed}ms -> extension/dist/\n`);
  console.log("Ready to load unpacked in Chrome:");
  console.log(`  Path: ${EXT_DIST}\n`);
}

// ============================================================
// 3. CLI Execution & Watch Mode
// ============================================================
const isWatch = process.argv.includes("--watch");

try {
  build();
} catch (e) {
  process.exit(1);
}

if (isWatch) {
  console.log("[CloakSight] Watching extension/src for changes...");
  let debounceTimeout = null;

  fs.watch(EXT_SRC, { recursive: true }, (event, filename) => {
    if (!filename) return;
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log(`[CloakSight] Change detected in ${filename}, rebuilding...`);
      try {
        build();
      } catch (err) {
        console.error("[CloakSight] Rebuild failed:", err.message);
      }
    }, 150);
  });
}
