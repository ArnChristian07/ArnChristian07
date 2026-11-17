// Builds the README's light/dark SVG panels into assets/.
// Content and design tokens mirror the portfolio site (arnchristian-portfolio)
// so the profile and the site read as one system. Run: node scripts/build-assets.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets");
mkdirSync(out, { recursive: true });

/* ---------- content (from the portfolio site) ---------- */

const PROFILE = {
  availability: "Open to opportunities",
  headline: ["Hi, I’m Arn Christian", "(AnKurisu).", "I’m a Programmer"],
  tagline:
    "My love for technology and my interest in how things work make me develop applications and work on new technologies in order to become better at programming.",
};

const ABOUT_STATS = [
  { value: "40+", label: "Project Shipped" },
  { value: "6", label: "Years Coding" },
  { value: "2", label: "Certificates" },
];

const SKILLS = [
  { title: "Programing Language", items: ["Lua", "Python", "Java", "Java Script", "Type Script", "C", "C#", "C++", "Visual Basic", "PHP"] },
  { title: "Frontend Frameworks", items: ["React JS", "Vue JS", "Next JS", "Tailwind CSS", "Bootstrap"] },
  { title: "Backend Frameworks", items: ["Express JS", "Nest JS", ".NET", "Laravel"] },
  { title: "Databases", items: ["MariaDB", "MongoDB", "SQLite", "MySQL", "PostgreSQL", "Firebase", "SQL Server"] },
  { title: "Tools and Platforms", items: ["VS Code", "Visual Studio", "GitHub", "Docker", "Android Studio", "GitLab"] },
  { title: "Others", items: ["HTML", "CSS", "VBScript", "XML"] },
];

const CONTACT = {
  title: "Let’s build something",
  body: "Open to new opportunities and freelance front-end work. Send a message and I usually reply within a day.",
};

const SECTIONS = [
  ["about", "01", "About me", "A developer who likes small screens and big ideas."],
  ["skills", "02", "Skills", "Tools I reach for."],
];

/* ---------- tokens ---------- */

const THEMES = {
  light: {
    heroFrom: "#f2f6fd", heroTo: "#ffffff", card: "#ffffff", mutedCard: "#f4f6fa",
    border: "#e4e8ef", borderStrong: "#d5dbe5", grid: "#a8b6cb", fg: "#0f172a",
    fgSoft: "#334155", muted: "#5b6678", faint: "#8792a5", accent: "#2563eb",
    accentSoft: "#e3ecfc", chip: "#eef2f8", chipFg: "#334155", ink: "#111a2e",
    inkFg: "#ffffff", inkAccent: "#7ea6ff", artCard: "#dbe7fb", shadow: "15,23,42", shadowA: 0.12,
  },
  dark: {
    heroFrom: "#0e1730", heroTo: "#0a0f1c", card: "#111a2c", mutedCard: "#142036",
    border: "#1e2a40", borderStrong: "#2a3852", grid: "#1e2a40", fg: "#e7ecf4",
    fgSoft: "#c3ccda", muted: "#94a0b4", faint: "#6b778c", accent: "#4f8cff",
    accentSoft: "#16264a", chip: "#18233a", chipFg: "#c3ccda", ink: "#050913",
    inkFg: "#e7ecf4", inkAccent: "#4f8cff", artCard: "#172a52", shadow: "0,0,0", shadowA: 0.45,
  },
};

const DISPLAY = `'Space Grotesk','Segoe UI',Inter,-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif`;
const SANS = `Inter,'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif`;
const MONO = `'JetBrains Mono',ui-monospace,SFMono-Regular,Consolas,Menlo,monospace`;

/* ---------- helpers ---------- */

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Rough rendered width; system fallbacks vary, so layouts keep slack. */
const textW = (s, size, k = 0.56) => s.length * size * k;
const pad2 = (n) => String(n).padStart(2, "0");

/** Greedy word wrap by estimated width. */
function wrap(text, maxW, size, k = 0.52) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && textW(next, size, k) > maxW) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const tspans = (lines, x, y, lh) =>
  lines.map((l, i) => `<tspan x="${x}" y="${y + i * lh}">${esc(l)}</tspan>`).join("");

const svg = (w, h, body, style = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
<style>
  .display{font-family:${DISPLAY}}
  .sans{font-family:${SANS}}
  .mono{font-family:${MONO}}
  ${style}
  @media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
${body}
</svg>
`;

const shadowFilter = (t, id = "shadow") => `<filter id="${id}" x="-10%" y="-20%" width="120%" height="160%">
  <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgb(${t.shadow})" flood-opacity="${t.shadowA / 3}"/>
  <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="rgb(${t.shadow})" flood-opacity="${t.shadowA / 1.6}"/>
</filter>`;

function chipRow(items, x, y, maxW, t, { fill = t.chip, stroke = "", fg = t.chipFg } = {}) {
  let cx = x, cy = y;
  const parts = [];
  for (const item of items) {
    const w = textW(item, 12, 0.6) + 22;
    if (cx + w > x + maxW) { cx = x; cy += 32; }
    parts.push(`<rect x="${cx}" y="${cy}" width="${w}" height="24" rx="12" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ""}/>
<text x="${cx + w / 2}" y="${cy + 16}" text-anchor="middle" class="sans" font-size="12" font-weight="500" fill="${fg}">${esc(item)}</text>`);
    cx += w + 6;
  }
  return { svg: parts.join("\n"), bottom: cy + 24 };
}

function pill(label, x, y, t, mono = true) {
  const w = textW(label, 11, mono ? 0.64 : 0.58) + 22;
  return {
    w,
    svg: `<rect x="${x}" y="${y}" width="${w}" height="22" rx="11" fill="${t.accentSoft}"/>
<text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" class="${mono ? "mono" : "sans"}" font-size="11" font-weight="600" letter-spacing="${mono ? 0.8 : 0}" fill="${t.accent}">${esc(mono ? label.toUpperCase() : label)}</text>`,
  };
}

const art = readFileSync(join(out, "art.png")).toString("base64");

/* ---------- hero ---------- */

function hero(t) {
  const W = 1000;
  const lines = PROFILE.headline;
  const tag = wrap(PROFILE.tagline, 470, 15.5, 0.5);
  const h1Top = 160, h1Lh = 54;
  const tagTop = h1Top + (lines.length - 1) * h1Lh + 52;
  const H = Math.max(480, tagTop + (tag.length - 1) * 24 + 70);

  const cx = 748, cy = H / 2 - 10; // grid bright spot, behind the art
  const BEAMS = [
    ["v", -6, 6, -1], ["v", -3, 7, -3.5], ["v", 0, 8, -5], ["v", 3, 9, -4], ["v", 6, 8, -6.5],
    ["h", -3, 7.5, -2], ["h", 0, 9, -0.5], ["h", 3, 8.5, -5.5],
  ];
  const gx = Math.round(cx / 44) * 44, gy = Math.round(cy / 44) * 44;
  const beams = BEAMS.map(([d, n, dur, delay]) =>
    d === "v"
      ? `<rect class="bv" x="${gx + n * 44 - 0.5}" y="0" width="1.5" height="90" fill="url(#beamV)" style="animation-duration:${dur}s;animation-delay:${delay}s"/>`
      : `<rect class="bh" x="0" y="${gy + n * 44 - 0.5}" width="120" height="1.5" fill="url(#beamH)" style="animation-duration:${dur}s;animation-delay:${delay}s"/>`
  ).join("\n");

  const pillW = textW(PROFILE.availability, 12, 0.56) + 44;
  const headline = lines.map((l, i) =>
    `<text x="54" y="${h1Top + i * h1Lh}">${esc(l)}${i === lines.length - 1 ? `<tspan fill="${t.accent}">.</tspan>` : ""}</text>`
  ).join("\n    ");

  const body = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.heroFrom}"/><stop offset="1" stop-color="${t.heroTo}"/></linearGradient>
  <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" stroke="${t.grid}" stroke-width="1"/></pattern>
  <radialGradient id="spot" cx="${cx / W}" cy="${cy / H}" r="0.42" gradientTransform="translate(${cx / W} ${cy / H}) scale(1 ${(W / H) * 0.75}) translate(${-cx / W} ${-cy / H})">
    <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="spotMask"><rect width="${W}" height="${H}" fill="url(#spot)"/></mask>
  <linearGradient id="beamV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset=".6" stop-color="${t.accent}" stop-opacity=".9"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>
  <linearGradient id="beamH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset=".6" stop-color="${t.accent}" stop-opacity=".9"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>
  ${shadowFilter(t, "lift")}
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#spotMask)" opacity=".5"/>
  <g mask="url(#spotMask)">${beams}</g>

  <!-- availability pill -->
  <rect x="56" y="62" width="${pillW}" height="28" rx="14" fill="${t.card}" stroke="${t.border}" filter="url(#lift)"/>
  <circle class="ping" cx="74" cy="76" r="4" fill="#10b981"/>
  <circle cx="74" cy="76" r="4" fill="#10b981"/>
  <text x="86" y="80.5" class="sans" font-size="12" fill="${t.fgSoft}">${esc(PROFILE.availability)}</text>

  <!-- headline -->
  <g class="display" font-weight="700" font-size="48" letter-spacing="-1.4" fill="${t.fg}">
    ${headline}
  </g>

  <text class="sans" font-size="15.5" fill="${t.muted}">${tspans(tag, 56, tagTop, 24)}</text>

  <!-- art card -->
  <g transform="rotate(3 ${cx} ${cy})">
    <rect x="${cx - 175}" y="${cy - 170}" width="350" height="350" rx="28" fill="${t.artCard}" filter="url(#lift)"/>
    <rect class="edge" x="${cx - 175}" y="${cy - 170}" width="350" height="350" rx="28" stroke="${t.accent}" stroke-width="2" pathLength="100" stroke-dasharray="14 86" stroke-linecap="round"/>
  </g>
  <g class="float">
    <image href="data:image/png;base64,${art}" x="${cx - 152}" y="${cy - 192}" width="304" height="414" preserveAspectRatio="xMidYMid meet"/>
  </g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" stroke="${t.border}"/>`;

  const style = `
  .bv{animation:bv linear infinite}
  .bh{animation:bh linear infinite}
  @keyframes bv{from{transform:translateY(-100px)}to{transform:translateY(${H + 20}px)}}
  @keyframes bh{from{transform:translateX(${cx - 420}px)}to{transform:translateX(${cx + 300}px)}}
  .ping{transform-box:fill-box;transform-origin:center;animation:ping 2.4s cubic-bezier(0,0,.2,1) infinite}
  @keyframes ping{0%{transform:scale(1);opacity:.55}75%,100%{transform:scale(2.4);opacity:0}}
  .edge{animation:edge 7s linear infinite}
  @keyframes edge{to{stroke-dashoffset:-100}}
  .float{animation:float 6s ease-in-out infinite}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}`;
  return svg(W, H, body, style);
}

/* ---------- section heading ---------- */

function heading(t, n, eyebrow, title) {
  const lines = wrap(title.replace(/\.$/, ""), 900, 34, 0.46);
  const H = 70 + (lines.length - 1) * 42 + 22;
  const text = lines.map((l, i) =>
    `<tspan x="0" y="${70 + i * 42}">${esc(l)}${i === lines.length - 1 ? `<tspan fill="${t.accent}">.</tspan>` : ""}</tspan>`
  ).join("");
  return svg(1000, H, `<text x="2" y="24" class="mono" font-size="12" font-weight="500" letter-spacing="1.7" fill="${t.accent}">${n} — ${esc(eyebrow.toUpperCase())}</text>
<text class="display" font-size="34" font-weight="700" letter-spacing="-0.9" fill="${t.fg}">${text}</text>`);
}

/* ---------- about stats ---------- */

function stats(t) {
  const W = 1000, gap = 16, w = (W - gap * 2 - 4) / 3, h = 112;
  const tiles = ABOUT_STATS.map((s, i) => {
    const x = 2 + i * (w + gap);
    return `<rect x="${x}" y="2" width="${w}" height="${h}" rx="14" fill="${t.mutedCard}" stroke="${t.border}"/>
<text x="${x + 24}" y="54" class="display" font-size="32" font-weight="700" letter-spacing="-0.6" fill="${t.fg}">${esc(s.value)}</text>
<text x="${x + 24}" y="86" class="sans" font-size="13" fill="${t.muted}">${esc(s.label)}</text>`;
  }).join("\n");
  return svg(W, h + 4, tiles);
}

/* ---------- skills ---------- */

function skills(t) {
  const W = 1000, gap = 16, cols = 2, w = (W - gap - 4) / cols, pad = 26;
  const rows = Math.ceil(SKILLS.length / cols);
  // Cards in a row share the height of the tallest one.
  const rowH = Array.from({ length: rows }, (_, r) =>
    Math.max(...SKILLS.slice(r * cols, r * cols + cols).map((s) => chipRow(s.items, 0, 0, w - pad * 2, t).bottom)) + 92
  );
  const H = rowH.reduce((a, b) => a + b, 0) + (rows - 1) * gap + 24;
  const cards = SKILLS.map((s, i) => {
    const r = Math.floor(i / cols);
    const x = 2 + (i % cols) * (w + gap);
    const y = 2 + rowH.slice(0, r).reduce((a, b) => a + b, 0) + r * gap;
    const chips = chipRow(s.items, x + pad, y + 68, w - pad * 2, t).svg;
    return `<rect x="${x}" y="${y}" width="${w}" height="${rowH[r]}" rx="16" fill="${t.card}" stroke="${t.border}" filter="url(#shadow)"/>
<text x="${x + pad}" y="${y + 42}" class="display" font-size="17" font-weight="600" fill="${t.fg}">${esc(s.title)}</text>
<text x="${x + w - pad}" y="${y + 42}" text-anchor="end" class="mono" font-size="11" font-weight="500" letter-spacing="1" fill="${t.faint}">${pad2(s.items.length)}</text>
${chips}`;
  }).join("\n");
  return svg(W, H, `<defs>${shadowFilter(t)}</defs>\n${cards}`);
}

/* ---------- contact CTA (ink footer) ---------- */

function cta(t) {
  const W = 1000, H = 230;
  return svg(W, H, `<defs>
  <pattern id="g" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" stroke="#ffffff" stroke-opacity=".06"/></pattern>
  <radialGradient id="glow" cx=".85" cy="0" r=".7"><stop offset="0" stop-color="${t.accent}" stop-opacity=".35"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
  <clipPath id="c"><rect width="${W}" height="${H}" rx="24"/></clipPath>
</defs>
<g clip-path="url(#c)">
  <rect width="${W}" height="${H}" fill="${t.ink}"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="56" y="70" class="mono" font-size="12" font-weight="500" letter-spacing="1.7" fill="${t.inkAccent}">03 — CONTACT</text>
  <text x="54" y="122" class="display" font-size="40" font-weight="700" letter-spacing="-1.2" fill="${t.inkFg}">${esc(CONTACT.title)}<tspan fill="${t.inkAccent}">.</tspan></text>
  <text class="sans" font-size="15" fill="#94a0b4">${tspans(wrap(CONTACT.body, 860, 15, 0.5), 56, 164, 24)}</text>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" stroke="${t.border}"/>`);
}

/* ---------- write ---------- */

for (const f of readdirSync(out)) if (f.endsWith(".svg")) unlinkSync(join(out, f));

for (const [mode, t] of Object.entries(THEMES)) {
  const files = {
    hero: hero(t),
    stats: stats(t),
    skills: skills(t),
    contact: cta(t),
  };
  for (const [id, n, eyebrow, title] of SECTIONS) files[`h-${id}`] = heading(t, n, eyebrow, title);
  for (const [name, content] of Object.entries(files)) writeFileSync(join(out, `${name}-${mode}.svg`), content);
}
console.log("assets built");
