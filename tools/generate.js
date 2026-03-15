#!/usr/bin/env node
/**
 * Bhakti Cards — Content Generator
 *
 * Usage:
 *   node generate.js --type deity --god Ganesha --count 3
 *   node generate.js --type gita --count 10
 *   node generate.js --type upanishad --count 10
 *   node generate.js --type all --count 3
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const DATA_DIR  = path.join(__dirname, 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadCards() {
  if (!fs.existsSync(CARDS_FILE)) return [];
  return JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
}
function saveCards(cards) {
  fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
}
function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Deity definitions ─────────────────────────────────────────────────────────
export const DEITIES = [
  { name: 'Ganesha',          searchQuery: 'Ganesha hindu god',           lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#2C2C2A','#080807'], glow: 'rgba(130,120,100,0.22)' },
  { name: 'Hanuman',          searchQuery: 'Hanuman hindu god',           lang: 'Sanskrit/Hindi',     font: 'Noto Sans Devanagari', gradient: ['#6E2800','#180700'], glow: 'rgba(180,80,20,0.30)'  },
  { name: 'Shiva',            searchQuery: 'Shiva hindu god',             lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#1A1850','#060418'], glow: 'rgba(80,70,200,0.35)'  },
  { name: 'Lakshmi',          searchQuery: 'Lakshmi hindu goddess',       lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#4A2800','#1A0800'], glow: 'rgba(220,150,20,0.30)' },
  { name: 'Saraswati',        searchQuery: 'Saraswati hindu goddess',     lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#0A2040','#020810'], glow: 'rgba(80,140,220,0.25)' },
  { name: 'Durga',            searchQuery: 'Durga hindu goddess',         lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#3A0A0A','#100202'], glow: 'rgba(200,60,20,0.30)'  },
  { name: 'Krishna',          searchQuery: 'Krishna hindu god',           lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#0A1A40','#020810'], glow: 'rgba(60,100,220,0.35)' },
  { name: 'Murugan',          searchQuery: 'Murugan tamil god',           lang: 'Tamil',              font: 'Noto Sans Tamil',       gradient: ['#3A1A08','#0D0602'], glow: 'rgba(160,90,20,0.28)'  },
  { name: 'Subrahmanya',      searchQuery: 'Subramanya kartikeya god',    lang: 'Sanskrit/Kannada',   font: 'Noto Sans Devanagari', gradient: ['#3A1A08','#0D0602'], glow: 'rgba(160,90,20,0.28)'  },
  { name: 'Amman',            searchQuery: 'Amman tamil goddess',         lang: 'Tamil',              font: 'Noto Sans Tamil',       gradient: ['#3A0810','#100205'], glow: 'rgba(200,40,60,0.28)'  },
  { name: 'Venkateswara',     searchQuery: 'Venkateswara tirupati god',   lang: 'Sanskrit/Telugu',    font: 'Noto Sans Devanagari', gradient: ['#1A1A08','#080802'], glow: 'rgba(200,180,40,0.28)' },
  { name: 'Narasimha',        searchQuery: 'Narasimha hindu god',         lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#3A1A00','#100500'], glow: 'rgba(220,140,20,0.30)' },
  { name: 'Ayyappa',          searchQuery: 'Ayyappa sabarimala god',      lang: 'Sanskrit/Malayalam', font: 'Noto Sans Devanagari', gradient: ['#0A2010','#020802'], glow: 'rgba(40,160,60,0.25)'  },
  { name: 'Vitthal',          searchQuery: 'Vitthal pandharpur god',      lang: 'Sanskrit/Marathi',   font: 'Noto Sans Devanagari', gradient: ['#0A1A30','#020608'], glow: 'rgba(60,100,180,0.28)' },
  { name: 'Kali',             searchQuery: 'Kali hindu goddess',          lang: 'Sanskrit/Bengali',   font: 'Noto Sans Devanagari', gradient: ['#0A0A1A','#020205'], glow: 'rgba(100,20,180,0.30)' },
  { name: 'Jagannath',        searchQuery: 'Jagannath puri god',          lang: 'Sanskrit/Odia',      font: 'Noto Sans Devanagari', gradient: ['#1A0A00','#060200'], glow: 'rgba(180,100,20,0.28)' },
  { name: 'Raghavendra Swami',searchQuery: 'Raghavendra swami saint',     lang: 'Sanskrit/Kannada',   font: 'Noto Sans Devanagari', gradient: ['#0A1808','#020602'], glow: 'rgba(60,140,40,0.25)'  },
];

// ── LLM content generation ───────────────────────────────────────────────────
async function generateDeityContent(anthropic, deity, count) {
  console.log(`  Generating salutations for ${deity.name}...`);
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `For the Hindu deity "${deity.name}", provide ${count} distinct salutations or short mantras.

Language: ${deity.lang}. Use the native script (Devanagari for Sanskrit/Hindi, Tamil script for Tamil, etc.)

Rules:
- Short, well-known, authentic salutations (like "Om Namah Shivaya" style — not full hymns)
- Variety: pick different aspects/moods if multiple exist
- Correct native script rendering
- Accurate Roman transliteration (IAST or common usage)

Return ONLY a JSON array, no markdown, no explanation:
[{"script":"...","roman":"..."},...]`
    }]
  });
  const text = msg.content[0].text.trim();
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error(`No JSON in response for ${deity.name}`);
  return JSON.parse(m[0]);
}

async function generateGitaVerses(anthropic, count) {
  console.log(`  Generating ${count} Bhagavad Gita verses...`);
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Find ${count} uplifting, impactful verses from the Bhagavad Gita.

Rules:
- Uplifting only: duty, equanimity, devotion, self-knowledge, action without attachment, courage, peace
- NO dark themes: no verses about death being inevitable, war, destruction
- Include the complete Sanskrit verse in Devanagari
- Accurate Roman transliteration
- Exact chapter and verse number
- Pick a variety of chapters, not all from Chapter 2

Return ONLY a JSON array, no markdown:
[{"script":"Sanskrit Devanagari","roman":"transliteration","reference":"Chapter X, Verse Y"},...]`
    }]
  });
  const text = msg.content[0].text.trim();
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('No JSON in Gita response');
  return JSON.parse(m[0]);
}

async function generateUpanishadVerses(anthropic, count) {
  console.log(`  Generating ${count} Upanishad verses...`);
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Find ${count} uplifting verses or mahavakyas from the Upanishads.

Rules:
- Uplifting only: self-knowledge, unity of self and universe, consciousness, peace, liberation, the divine within
- NO dark themes
- Draw from variety: Kena, Katha, Isha, Mandukya, Chandogya, Brihadaranyaka, Mundaka, Taittiriya
- Include complete Sanskrit in Devanagari
- Accurate Roman transliteration
- Source reference: "Upanishad name, Section.Verse"

Return ONLY a JSON array, no markdown:
[{"script":"Sanskrit Devanagari","roman":"transliteration","reference":"Upanishad Name, X.Y"},...]`
    }]
  });
  const text = msg.content[0].text.trim();
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('No JSON in Upanishad response');
  return JSON.parse(m[0]);
}

// ── Image search ─────────────────────────────────────────────────────────────
async function searchUnsplash(query, count) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
    const res  = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    const data = await res.json();
    return (data.results || []).map(p => ({
      url:    p.urls.regular,
      author: p.user.name,
      source: 'unsplash.com',
      link:   p.links.html,
    }));
  } catch { return []; }
}

async function searchWikimedia(query, count) {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' painting artwork')}&srnamespace=6&srlimit=${count * 4}&format=json&origin=*`;
    const res  = await fetch(searchUrl);
    const data = await res.json();
    const titles = (data.query?.search || []).map(r => r.title);
    const images = [];
    for (const title of titles.slice(0, count * 2)) {
      if (images.length >= count) break;
      try {
        const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|user|mime&format=json&origin=*`;
        const infoRes  = await fetch(infoUrl);
        const infoData = await infoRes.json();
        for (const page of Object.values(infoData.query?.pages || {})) {
          const info = page.imageinfo?.[0];
          if (info?.url && info.mime?.startsWith('image/')) {
            images.push({ url: info.url, author: info.user, source: 'wikimedia.org', link: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}` });
          }
        }
      } catch { /* skip */ }
    }
    return images;
  } catch { return []; }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function arg(name) {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : null;
}

const TYPE  = arg('--type')  || 'all';
const GOD   = arg('--god');
const COUNT = parseInt(arg('--count') || '3');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY not set. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function run() {
  const cards    = loadCards();
  const newCards = [];

  // ── Deity cards ─────────────────────────────────────────────────────────────
  if (TYPE === 'deity' || TYPE === 'all') {
    const deities = GOD
      ? DEITIES.filter(d => d.name.toLowerCase() === GOD.toLowerCase())
      : DEITIES;

    if (GOD && deities.length === 0) {
      console.error(`Unknown deity: ${GOD}. Valid names: ${DEITIES.map(d => d.name).join(', ')}`);
      process.exit(1);
    }

    console.log(`\nGenerating deity cards for: ${deities.map(d => d.name).join(', ')}`);
    for (const deity of deities) {
      try {
        const salutations = await generateDeityContent(anthropic, deity, COUNT);
        const images = [
          ...(await searchUnsplash(deity.searchQuery, COUNT)),
          ...(await searchWikimedia(deity.searchQuery, COUNT)),
        ].slice(0, COUNT);

        salutations.forEach((sal, i) => {
          const img = images[i] || null;
          newCards.push({
            id:          makeId(deity.name.toLowerCase().replace(/\s+/g, '-')),
            type:        'deity',
            deity:       deity.name,
            script:      sal.script,
            roman:       sal.roman,
            image:       img?.url    || null,
            imageSource: img?.source || null,
            imageAuthor: img?.author || null,
            imageLink:   img?.link   || null,
            imgPos:      'center 10%',
            gradient:    `linear-gradient(170deg, ${deity.gradient[0]} 0%, ${deity.gradient[1]} 100%)`,
            glow:        deity.glow,
            font:        deity.font,
            status:      'pending',
          });
        });
        console.log(`  ✓ ${deity.name}: ${salutations.length} cards${images.length ? `, ${images.length} images found` : ', no images (add Unsplash key)'}`);
      } catch (e) {
        console.error(`  ✗ ${deity.name}: ${e.message}`);
      }
    }
  }

  // ── Gita cards ───────────────────────────────────────────────────────────────
  if (TYPE === 'gita' || TYPE === 'all') {
    console.log('\nGenerating Bhagavad Gita verse cards...');
    try {
      const verses = await generateGitaVerses(anthropic, COUNT);
      verses.forEach(v => {
        newCards.push({
          id:        makeId('gita'),
          type:      'gita',
          script:    v.script,
          roman:     v.roman,
          reference: v.reference,
          gradient:  'linear-gradient(170deg, #1A0A30 0%, #06020E 100%)',
          glow:      'rgba(120,80,200,0.25)',
          font:      'Noto Sans Devanagari',
          status:    'pending',
        });
      });
      console.log(`  ✓ ${verses.length} Gita verses`);
    } catch (e) {
      console.error(`  ✗ Gita: ${e.message}`);
    }
  }

  // ── Upanishad cards ──────────────────────────────────────────────────────────
  if (TYPE === 'upanishad' || TYPE === 'all') {
    console.log('\nGenerating Upanishad verse cards...');
    try {
      const verses = await generateUpanishadVerses(anthropic, COUNT);
      verses.forEach(v => {
        newCards.push({
          id:        makeId('upanishad'),
          type:      'upanishad',
          script:    v.script,
          roman:     v.roman,
          reference: v.reference,
          gradient:  'linear-gradient(170deg, #0A1808 0%, #020602 100%)',
          glow:      'rgba(60,160,80,0.25)',
          font:      'Noto Sans Devanagari',
          status:    'pending',
        });
      });
      console.log(`  ✓ ${verses.length} Upanishad verses`);
    } catch (e) {
      console.error(`  ✗ Upanishad: ${e.message}`);
    }
  }

  cards.push(...newCards);
  saveCards(cards);

  console.log(`\n✓ Added ${newCards.length} cards to pending queue`);
  console.log(`  Total cards in store: ${cards.length}`);
  console.log(`\nStart the approval interface:\n  node server.js\n`);
}

run().catch(e => { console.error(e.message); process.exit(1); });
