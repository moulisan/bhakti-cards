import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const CARDS_FILE = path.join(__dirname, 'data', 'cards.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function load()       { return fs.existsSync(CARDS_FILE) ? JSON.parse(fs.readFileSync(CARDS_FILE)) : []; }
function save(cards)  { fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2)); }

// ── API ───────────────────────────────────────────────────────────────────────
app.get('/api/cards', (req, res) => {
  let cards = load();
  if (req.query.status) cards = cards.filter(c => c.status === req.query.status);
  res.json(cards);
});

app.get('/api/stats', (req, res) => {
  const cards = load();
  res.json({
    total:    cards.length,
    pending:  cards.filter(c => c.status === 'pending').length,
    approved: cards.filter(c => c.status === 'approved').length,
    rejected: cards.filter(c => c.status === 'rejected').length,
  });
});

app.post('/api/cards/:id/approve', (req, res) => {
  const cards = load();
  const card  = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  card.status = 'approved';
  save(cards);
  res.json(card);
});

app.post('/api/cards/:id/reject', (req, res) => {
  const cards = load();
  const card  = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  card.status = 'rejected';
  save(cards);
  res.json(card);
});

app.post('/api/cards/:id/update', (req, res) => {
  const cards = load();
  const card  = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  const allowed = ['image', 'imgPos', 'script', 'roman', 'reference', 'imageSource', 'imageAuthor', 'imageLink'];
  allowed.forEach(k => { if (req.body[k] !== undefined) card[k] = req.body[k]; });
  save(cards);
  res.json(card);
});

// Export approved cards as a JS snippet ready to paste into index.html
app.get('/api/export', (req, res) => {
  const approved = load().filter(c => c.status === 'approved');
  const formatted = approved.map(c => {
    if (c.type === 'deity') {
      return {
        id:       c.id,
        type:     c.type,
        deity:    c.deity,
        script:   c.script,
        roman:    c.roman,
        image:    c.image,
        imgPos:   c.imgPos,
        gradient: c.gradient,
        glow:     c.glow,
        font:     c.font,
        credit:   c.imageSource || null,
      };
    }
    return {
      id:        c.id,
      type:      c.type,
      script:    c.script,
      roman:     c.roman,
      reference: c.reference,
      gradient:  c.gradient,
      glow:      c.glow,
      font:      c.font,
    };
  });
  res.type('text/plain').send(
    `// ${approved.length} approved cards — paste into CARDS array in index.html\n` +
    JSON.stringify(formatted, null, 2)
  );
});

const PORT = 4445;
app.listen(PORT, () => {
  console.log(`\nBhakti Cards Content Studio`);
  console.log(`Open: http://localhost:${PORT}\n`);
});
