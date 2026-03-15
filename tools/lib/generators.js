import Anthropic from '@anthropic-ai/sdk';
import OpenAI    from 'openai';
import fs from 'fs';

export const DEITIES = [
  { name: 'Ganesha',           searchQuery: 'Ganesha hindu god',          lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#2C2C2A','#080807'], glow: 'rgba(130,120,100,0.22)' },
  { name: 'Hanuman',           searchQuery: 'Hanuman hindu god',          lang: 'Sanskrit/Hindi',     font: 'Noto Sans Devanagari', gradient: ['#6E2800','#180700'], glow: 'rgba(180,80,20,0.30)'  },
  { name: 'Shiva',             searchQuery: 'Shiva hindu god',            lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#1A1850','#060418'], glow: 'rgba(80,70,200,0.35)'  },
  { name: 'Lakshmi',           searchQuery: 'Lakshmi hindu goddess',      lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#4A2800','#1A0800'], glow: 'rgba(220,150,20,0.30)' },
  { name: 'Saraswati',         searchQuery: 'Saraswati hindu goddess',    lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#0A2040','#020810'], glow: 'rgba(80,140,220,0.25)' },
  { name: 'Durga',             searchQuery: 'Durga hindu goddess',        lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#3A0A0A','#100202'], glow: 'rgba(200,60,20,0.30)'  },
  { name: 'Krishna',           searchQuery: 'Krishna hindu god',          lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#0A1A40','#020810'], glow: 'rgba(60,100,220,0.35)' },
  { name: 'Murugan',           searchQuery: 'Murugan tamil god',          lang: 'Tamil',              font: 'Noto Sans Tamil',       gradient: ['#3A1A08','#0D0602'], glow: 'rgba(160,90,20,0.28)'  },
  { name: 'Subrahmanya',       searchQuery: 'Subramanya kartikeya god',   lang: 'Sanskrit/Kannada',   font: 'Noto Sans Devanagari', gradient: ['#3A1A08','#0D0602'], glow: 'rgba(160,90,20,0.28)'  },
  { name: 'Amman',             searchQuery: 'Amman tamil goddess',        lang: 'Tamil',              font: 'Noto Sans Tamil',       gradient: ['#3A0810','#100205'], glow: 'rgba(200,40,60,0.28)'  },
  { name: 'Venkateswara',      searchQuery: 'Venkateswara tirupati god',  lang: 'Sanskrit/Telugu',    font: 'Noto Sans Devanagari', gradient: ['#1A1A08','#080802'], glow: 'rgba(200,180,40,0.28)' },
  { name: 'Narasimha',         searchQuery: 'Narasimha hindu god',        lang: 'Sanskrit',           font: 'Noto Sans Devanagari', gradient: ['#3A1A00','#100500'], glow: 'rgba(220,140,20,0.30)' },
  { name: 'Ayyappa',           searchQuery: 'Ayyappa sabarimala god',     lang: 'Sanskrit/Malayalam', font: 'Noto Sans Devanagari', gradient: ['#0A2010','#020802'], glow: 'rgba(40,160,60,0.25)'  },
  { name: 'Vitthal',           searchQuery: 'Vitthal pandharpur god',     lang: 'Sanskrit/Marathi',   font: 'Noto Sans Devanagari', gradient: ['#0A1A30','#020608'], glow: 'rgba(60,100,180,0.28)' },
  { name: 'Kali',              searchQuery: 'Kali hindu goddess',         lang: 'Sanskrit/Bengali',   font: 'Noto Sans Devanagari', gradient: ['#0A0A1A','#020205'], glow: 'rgba(100,20,180,0.30)' },
  { name: 'Jagannath',         searchQuery: 'Jagannath puri god',         lang: 'Sanskrit/Odia',      font: 'Noto Sans Devanagari', gradient: ['#1A0A00','#060200'], glow: 'rgba(180,100,20,0.28)' },
  { name: 'Raghavendra Swami', searchQuery: 'Raghavendra swami saint',    lang: 'Sanskrit/Kannada',   font: 'Noto Sans Devanagari', gradient: ['#0A1808','#020602'], glow: 'rgba(60,140,40,0.25)'  },
];

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
}

function makeLLM({ anthropicKey, openaiKey }) {
  if (anthropicKey) {
    const client = new Anthropic({ apiKey: anthropicKey });
    return async (prompt) => {
      const msg = await client.messages.create({
        model: 'claude-opus-4-6', max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });
      return msg.content[0].text.trim();
    };
  }
  if (openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey });
    return async (prompt) => {
      const res = await client.chat.completions.create({
        model: 'gpt-4o', max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });
      return res.choices[0].message.content.trim();
    };
  }
  throw new Error('No LLM API key set. Add one in Settings.');
}

async function llm(call, prompt) {
  const text = await call(prompt);
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('No JSON array in LLM response');
  return JSON.parse(m[0]);
}

async function searchUnsplash(query, count, key) {
  if (!key) return [];
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
    const res  = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    const data = await res.json();
    return (data.results || []).map(p => ({ url: p.urls.regular, author: p.user.name, source: 'unsplash.com', link: p.links.html }));
  } catch { return []; }
}

async function searchWikimedia(query, count) {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${count*3}&format=json&origin=*`;
    const data = await (await fetch(searchUrl)).json();
    const titles = (data.query?.search || []).map(r => r.title);
    const images = [];
    for (const title of titles) {
      if (images.length >= count) break;
      try {
        const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|user|mime&format=json&origin=*`;
        const pages = (await (await fetch(infoUrl)).json()).query?.pages || {};
        for (const page of Object.values(pages)) {
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

export async function runGenerate({ type, god, count, anthropicKey, openaiKey, unsplashKey, cardsFile, log }) {
  const call = makeLLM({ anthropicKey, openaiKey });
  const cards     = fs.existsSync(cardsFile) ? JSON.parse(fs.readFileSync(cardsFile)) : [];
  const newCards  = [];

  // ── Deity cards ─────────────────────────────────────────────────────────────
  if (type === 'deity' || type === 'all') {
    const deities = god
      ? DEITIES.filter(d => d.name.toLowerCase() === god.toLowerCase())
      : DEITIES;

    log(`Generating deity cards for: ${deities.map(d=>d.name).join(', ')}`);

    for (const deity of deities) {
      try {
        const salutations = await llm(call, `For the Hindu deity "${deity.name}", provide ${count} distinct salutations or short mantras.
Language: ${deity.lang}. Use native script (Devanagari for Sanskrit/Hindi, Tamil for Tamil).
Rules: short well-known salutations, variety, correct script, accurate Roman transliteration.
Return ONLY a JSON array: [{"script":"...","roman":"..."},...]`);

        const images = [
          ...(await searchUnsplash(deity.searchQuery, count, unsplashKey)),
          ...(await searchWikimedia(deity.searchQuery, count)),
        ].slice(0, count);

        salutations.forEach((sal, i) => {
          const img = images[i] || null;
          newCards.push({
            id: makeId(deity.name.toLowerCase().replace(/\s+/g,'-')),
            type: 'deity', deity: deity.name,
            script: sal.script, roman: sal.roman,
            image: img?.url||null, imageSource: img?.source||null,
            imageAuthor: img?.author||null, imageLink: img?.link||null,
            imgPos: 'center 10%',
            gradient: `linear-gradient(170deg, ${deity.gradient[0]} 0%, ${deity.gradient[1]} 100%)`,
            glow: deity.glow, font: deity.font, status: 'pending',
          });
        });
        log(`✓ ${deity.name}: ${salutations.length} cards${images.length ? `, ${images.length} images` : ', no images'}`);
      } catch (e) {
        log(`✗ ${deity.name}: ${e.message}`);
      }
    }
  }

  // ── Gita cards ───────────────────────────────────────────────────────────────
  if (type === 'gita' || type === 'all') {
    log(`Generating ${count} Bhagavad Gita verses...`);
    try {
      const verses = await llm(call, `Find ${count} uplifting verses from the Bhagavad Gita.
Rules: uplifting only (duty, equanimity, devotion, self-knowledge, action without attachment, courage). NO death/war/dark themes. Variety of chapters. Full Sanskrit Devanagari + Roman transliteration + exact chapter/verse.
Return ONLY JSON: [{"script":"...","roman":"...","reference":"Chapter X, Verse Y"},...]`);
      verses.forEach(v => newCards.push({
        id: makeId('gita'), type: 'gita',
        script: v.script, roman: v.roman, reference: v.reference,
        gradient: 'linear-gradient(170deg, #1A0A30 0%, #06020E 100%)',
        glow: 'rgba(120,80,200,0.25)', font: 'Noto Sans Devanagari', status: 'pending',
      }));
      log(`✓ ${verses.length} Gita verses`);
    } catch (e) { log(`✗ Gita: ${e.message}`); }
  }

  // ── Upanishad cards ──────────────────────────────────────────────────────────
  if (type === 'upanishad' || type === 'all') {
    log(`Generating ${count} Upanishad verses...`);
    try {
      const verses = await llm(call, `Find ${count} uplifting verses/mahavakyas from the Upanishads.
Rules: uplifting only (self-knowledge, unity, consciousness, peace, divine within). NO dark themes. Variety: Kena, Katha, Isha, Mandukya, Chandogya, Brihadaranyaka, Mundaka, Taittiriya. Full Sanskrit Devanagari + Roman transliteration + source.
Return ONLY JSON: [{"script":"...","roman":"...","reference":"Upanishad Name, X.Y"},...]`);
      verses.forEach(v => newCards.push({
        id: makeId('upanishad'), type: 'upanishad',
        script: v.script, roman: v.roman, reference: v.reference,
        gradient: 'linear-gradient(170deg, #0A1808 0%, #020602 100%)',
        glow: 'rgba(60,160,80,0.25)', font: 'Noto Sans Devanagari', status: 'pending',
      }));
      log(`✓ ${verses.length} Upanishad verses`);
    } catch (e) { log(`✗ Upanishad: ${e.message}`); }
  }

  cards.push(...newCards);
  fs.writeFileSync(cardsFile, JSON.stringify(cards, null, 2));
  log(`Done. Added ${newCards.length} cards to review queue.`);
}
