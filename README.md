# Bhakti Cards — Project Notes

## What is Bhakti Cards?
A beautiful, mobile-first PWA (Progressive Web App) that shows devotees flippable sacred cards — deity photos, sacred object illustrations, and salutation phrases — in their language. Deeply Indian, phenomenally designed, configurable to the user's deity and language preference.

**Core experience**: Open the app when stressed, starting something new, or needing a moment. A beautiful card is there. Flip it. Your deity, a phrase that means something, in your language. One card at a time. No feed, no noise.

**The flip mechanic is intentional**: Not a notification, not a feed. A *moment*. You choose to flip. There's agency in it.

---

## Product Decisions (Locked)

### Platform
- PWA (Progressive Web App) — mobile only
- Pinnable to home screen
- Start with web, no app store needed
- Deploy: GitHub → Vercel → custom domain

### Domain to check
- bhakticards.com (preferred)
- bhakticards.in (fallback, arguably more appropriate)

### Monetisation
- Free for now
- Premium later — rare deity packs, special occasion card sets (Karthigai Deepam, Navratri), custom family deity
- ₹5 "Send a blessing" mechanic — share a card to someone via WhatsApp, small payment, drives distribution simultaneously

### Sharing
- Secondary feature (not v1)
- Every shared card is a product demo / distribution moment

---

## Card Types (Locked — 2 types only)

### Type 1 — Portrait Card
- Photographic deity image
- Salutation phrase (short — Om Namo Narayana style)
- Original script + transliteration

### Type 2 — Symbol Card
- Illustrated sacred object (Vel, Trishul, Lotus, Gada, Conch etc.)
- Slightly longer phrase or shloka line
- Original script + transliteration

*Mantra card (pure text) was considered and dropped — redundant given the above two.*

---

## Language System (Locked)

### Two variants per card:
1. **Original script** — Tamil in Tamil script, Sanskrit in Devanagari, etc.
2. **Transliterated** — how you say it, in English letters

### No English sentiment/meaning
Dropped deliberately — reads too much like Christian slogans, loses the feeling of the original.

### Onboarding language capture
First visit:
1. Which deity/deities do you connect with? (multi-select)
2. How do you prefer your cards? (multi-select)
   - In the original script
   - How I say it (transliteration)

---

## Deity List (Locked — 17 deities, flat list, no regional labels)

1. Ganesha
2. Hanuman
3. Shiva
4. Lakshmi
5. Saraswati
6. Durga
7. Krishna
8. Murugan *(Tamil)*
9. Subrahmanya *(Karnataka — same deity as Murugan, different name/phrase set)*
10. Amman
11. Venkateswara
12. Narasimha *(protective/Prahlada form)*
13. Ayyappa
14. Vitthal
15. Kali
16. Jagannath
17. Raghavendra Swami *(saint/guru — card treatment differs, phrases like "Sri Raghavendra Sharanu")*

*Note: Murugan and Subrahmanya are the same deity. Different name, different language, different devotee community. Same card engine, different phrase set. This is the regional configurability in action.*

---

## Phrase Sets (Work in Progress)

### Approved approach:
Each deity gets:
- 1 Portrait card (photo + salutation)
- 1+ Symbol card (illustration + shloka line)

Each card has:
- Original script version
- Transliterated version

### Phrases locked so far (pending visual review):

#### Ganesha
**Portrait — Salutation**
- Sanskrit: ॐ गं गणपतये नमः
- Transliteration: Om Gam Ganapataye Namaha

**Symbol — Modak/Tusk**
- Sanskrit: वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ
- Transliteration: Vakratunda Mahakaya Suryakoti Samaprabha

#### Hanuman
**Portrait — Salutation**
- Hindi/Sanskrit: जय हनुमान ज्ञान गुण सागर
- Transliteration: Jai Hanuman Gyan Gun Sagar

**Symbol — Gada (mace)**
- Sanskrit: ॐ हनुमते नमः
- Transliteration: Om Hanumate Namaha

#### Shiva
**Portrait — Salutation**
- Sanskrit: ॐ नमः शिवाय
- Transliteration: Om Namah Shivaya

**Symbol — Trishul/Lingam**
- Sanskrit: ॐ त्र्यम्बकं यजामहे
- Transliteration: Om Tryambakam Yajamahe

### Remaining deities (phrases to be generated):
- Lakshmi
- Saraswati
- Durga
- Krishna
- Murugan
- Subrahmanya
- Amman
- Venkateswara
- Narasimha
- Ayyappa
- Vitthal
- Kali
- Jagannath
- Raghavendra Swami

---

## Build Plan

### Phase 1 — Feel it first (current phase)
- Build 3-4 cards only (Ganesha + Shiva + Murugan suggested)
- Full working flip animation
- Real phrases, real design
- Mouli reviews and feels the app before we generate all content
- Deploy to Vercel for real mobile feel (not just browser preview)

### Phase 2 — Full content
- Complete all 17 deity phrase sets
- Source/generate deity photos and symbol illustrations
- Build onboarding flow (deity + language selection)

### Phase 3 — PWA polish
- Home screen pin prompt
- Offline support
- Smooth card deck navigation

### Phase 4 — Distribution
- WhatsApp sharing
- ₹5 blessing send mechanic
- Facebook groups, Instagram Reels, regional influencers

---

## Design Direction

### Non-negotiables
- Phenomenally well designed — India products are notoriously ugly (Tally, Zoho etc.), this breaks that
- Deeply, unmistakably Indian — someone looks at it and feels home
- Mobile only — most users will open from WhatsApp
- No dark mode complexity for v1

### Visual style
- Photographic for deity portraits
- Illustrated for sacred objects
- Rich, warm color palette — saffron, deep red, gold, cream, peacock green
- Typography must handle Devanagari + Tamil script + English gracefully
- The flip animation is a *moment* — tactile, satisfying, intentional

### Card feel
- Portrait card flip = darshan (sacred viewing)
- Symbol card flip = unwrapping something
- Restraint over maximalism — one card at a time, no feed

---

## Tech Stack
- Single HTML file or simple React PWA
- No backend for v1 (content is static JSON)
- Vercel hosting
- GitHub repo: `bhakti-cards`
- Google Fonts for script support (Noto Sans for Devanagari/Tamil)

---

## Context for Resuming Work
When starting a new session (Claude Code or claude.ai Project), paste this file and say:
> "Read bhakticards-notes.md. Let's continue. Next task is: [task from Build Plan above]."

### Immediate next task:
Build 3-4 card prototype (Ganesha, Shiva, Murugan) with flip animation for visual review. Deploy to Vercel.
