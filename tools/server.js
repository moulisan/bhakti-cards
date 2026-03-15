import express    from 'express';
import fs          from 'fs';
import path        from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, '..');          // bhakthi-cards root
const INDEX_HTML = path.join(ROOT, 'index.html');
const CARDS_FILE = path.join(__dirname, 'data', 'cards.json');
const ENV_FILE   = path.join(__dirname, '.env');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    fs.readFileSync(ENV_FILE, 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
      .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
  );
}
function saveEnv(obj) {
  const current = loadEnv();
  const merged  = { ...current, ...obj };
  fs.writeFileSync(ENV_FILE, Object.entries(merged).map(([k,v]) => `${k}=${v}`).join('\n') + '\n');
}

function loadCards() { return fs.existsSync(CARDS_FILE) ? JSON.parse(fs.readFileSync(CARDS_FILE)) : []; }
function saveCards(c) { fs.writeFileSync(CARDS_FILE, JSON.stringify(c, null, 2)); }

// ── In-memory generation job ──────────────────────────────────────────────────
let job = null; // { running, log, done, error }

// ── Cards API ─────────────────────────────────────────────────────────────────
app.get('/api/cards', (req, res) => {
  let cards = loadCards();
  if (req.query.status) cards = cards.filter(c => c.status === req.query.status);
  res.json(cards);
});

app.get('/api/stats', (req, res) => {
  const cards = loadCards();
  res.json({
    total:    cards.length,
    pending:  cards.filter(c => c.status === 'pending').length,
    approved: cards.filter(c => c.status === 'approved').length,
    rejected: cards.filter(c => c.status === 'rejected').length,
  });
});

app.post('/api/cards/:id/approve', (req, res) => {
  const cards = loadCards(), card = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  card.status = 'approved'; saveCards(cards); res.json(card);
});

app.post('/api/cards/:id/reject', (req, res) => {
  const cards = loadCards(), card = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  card.status = 'rejected'; saveCards(cards); res.json(card);
});

app.post('/api/cards/:id/update', (req, res) => {
  const cards = loadCards(), card = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  ['image','imgPos','script','roman','reference','imageSource','imageAuthor','imageLink']
    .forEach(k => { if (req.body[k] !== undefined) card[k] = req.body[k]; });
  saveCards(cards); res.json(card);
});

// ── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const env = loadEnv();
  res.json({
    anthropic_set: !!env.ANTHROPIC_API_KEY,
    openai_set:    !!env.OPENAI_API_KEY,
    unsplash_set:  !!env.UNSPLASH_ACCESS_KEY,
  });
});

app.post('/api/settings', (req, res) => {
  const { anthropic_key, openai_key, unsplash_key } = req.body;
  const patch = {};
  if (anthropic_key) patch.ANTHROPIC_API_KEY  = anthropic_key;
  if (openai_key)    patch.OPENAI_API_KEY      = openai_key;
  if (unsplash_key)  patch.UNSPLASH_ACCESS_KEY = unsplash_key;
  saveEnv(patch);
  res.json({ ok: true });
});

// ── Generate ──────────────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  if (job?.running) return res.status(409).json({ error: 'Generation already running' });

  const { type, god, count } = req.body;
  job = { running: true, log: [], done: false, error: null };
  res.json({ ok: true });

  const env = loadEnv();
  const ANTHROPIC_KEY  = env.ANTHROPIC_API_KEY;
  const OPENAI_KEY     = env.OPENAI_API_KEY;
  const UNSPLASH_KEY   = env.UNSPLASH_ACCESS_KEY;

  if (!ANTHROPIC_KEY && !OPENAI_KEY) {
    job.log.push('Error: No LLM key set. Add Anthropic or OpenAI key in Settings.');
    job.running = false; job.done = true; job.error = 'No API key';
    return;
  }
  if (ANTHROPIC_KEY)  job.log.push('Using Anthropic');
  else                job.log.push('Using OpenAI');

  // Lazy import generators (they need the key at runtime)
  try {
    const { runGenerate } = await import('./lib/generators.js');
    await runGenerate({
      type: type || 'all',
      god:  god  || null,
      count: parseInt(count) || 3,
      anthropicKey: ANTHROPIC_KEY || null,
      openaiKey:    OPENAI_KEY    || null,
      unsplashKey:  UNSPLASH_KEY  || null,
      cardsFile:    CARDS_FILE,
      log: msg => job.log.push(msg),
    });
    job.done = true; job.running = false;
  } catch (e) {
    job.log.push(`Error: ${e.message}`);
    job.running = false; job.done = true; job.error = e.message;
  }
});

app.get('/api/generate/status', (req, res) => {
  res.json(job || { running: false, done: true, log: [], error: null });
});

// ── Update Bhakti Cards ───────────────────────────────────────────────────────
// Takes all approved cards that aren't already in index.html and appends them,
// then commits everything to git.
app.post('/api/update-app', (req, res) => {
  try {
    const approved = loadCards().filter(c => c.status === 'approved');
    if (approved.length === 0) return res.status(400).json({ error: 'No approved cards to add' });

    const html = fs.readFileSync(INDEX_HTML, 'utf8');

    // Find existing card IDs already in index.html
    const existingIds = new Set();
    const idMatches = html.matchAll(/id:\s*['"]([^'"]+)['"]/g);
    for (const m of idMatches) existingIds.add(m[1]);

    const newCards = approved.filter(c => !existingIds.has(c.id));
    if (newCards.length === 0) return res.json({ ok: true, added: 0, message: 'All approved cards already in app' });

    // Format each card as a JS object literal
    function formatCard(c) {
      if (c.type === 'deity') {
        return `    {
      id:       '${c.id}',
      type:     'deity',
      deity:    '${c.deity}',
      script:   '${c.script.replace(/'/g,"\\'")}',
      roman:    '${c.roman.replace(/'/g,"\\'")}',
      image:    '${c.image || ''}',
      imgPos:   '${c.imgPos || 'center 10%'}',
      gradient: '${c.gradient}',
      glow:     '${c.glow}',
      font:     '${c.font}',${c.imageSource ? `\n      credit:   '${c.imageSource}',` : ''}
    }`;
      }
      return `    {
      id:        '${c.id}',
      type:      '${c.type}',
      script:    '${c.script.replace(/'/g,"\\'")}',
      roman:     '${c.roman.replace(/'/g,"\\'")}',
      reference: '${(c.reference||'').replace(/'/g,"\\'")}',
      gradient:  '${c.gradient}',
      glow:      '${c.glow}',
      font:      '${c.font}',
    }`;
    }

    const insertions = newCards.map(formatCard).join(',\n') + ',';

    // Insert before the closing ]; of the CARDS array
    const updated = html.replace(
      /^(const CARDS = \[[\s\S]*?)(^\s*\];)/m,
      (_, arr, close) => arr + insertions + '\n  ' + close
    );

    if (updated === html) return res.status(500).json({ error: 'Could not locate CARDS array in index.html' });

    fs.writeFileSync(INDEX_HTML, updated);

    // Git commit
    const added = newCards.length;
    const msg   = `content: add ${added} approved card${added !== 1 ? 's' : ''} to Bhakti Cards`;
    execSync(`git -C "${ROOT}" add index.html tools/data/cards.json`, { stdio: 'pipe' });
    execSync(`git -C "${ROOT}" commit -m "${msg}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`, { stdio: 'pipe' });

    res.json({ ok: true, added, message: `Added ${added} cards and committed to git` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 4445;
app.listen(PORT, () => {
  console.log(`\nBhakti Cards Content Studio → http://localhost:${PORT}\n`);
});
