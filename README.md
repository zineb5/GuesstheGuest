# Global Guess — Intelligence Network

A rotating-selector, team-based deduction game where one player thinks of a person (real, fictional, historical, or personal) and others ask yes/no questions to guess who it is.

**Stack:** React 18 + Vite + Tailwind CSS + TypeScript + Zustand

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:3000
```

---

## Architecture

```
src/
├── App.tsx                 # Main router
├── main.tsx               # Entry point
├── index.css              # Global styles + Tailwind
├── screens/               # All game screens
│   ├── HomeScreen.tsx
│   ├── CreateScreen.tsx
│   ├── LobbyScreen.tsx
│   ├── RoleSelectorScreen.tsx
│   ├── RoleGuesserScreen.tsx
│   ├── TargetEntryScreen.tsx
│   ├── TargetConfirmScreen.tsx
│   ├── SelectorScreen.tsx
│   ├── GuesserScreen.tsx
│   ├── GuessInputScreen.tsx
│   ├── RevealScreen.tsx
│   └── FinalScreen.tsx
├── components/            # Reusable UI components
│   ├── Toast.tsx
│   ├── Header.tsx
│   ├── TimerRing.tsx
│   └── QuestionCard.tsx
├── store/
│   └── gameStore.ts       # Zustand state management
├── utils/
│   └── wikiApi.ts         # Wikipedia API integration
└── types/
    └── index.ts           # TypeScript interfaces
```

---

## Game Flow

1. **Home** → Create or Join a game
2. **Create** → Configure: name, player count (2-20), mode (Timer/Question Limit)
3. **Lobby** → Wait for agents to connect (simulated bots)
4. **Role Assignment** → Selector or Guesser revealed
5. **Target Entry** → Selector searches Wikipedia or enters manually
6. **Target Confirm** → Review auto-generated facts, edit if needed
7. **Guessing Phase** → Ask yes/no questions, "I Know Who" to guess
8. **Round Reveal** → Show target, all guesses, update scores
9. **Final Scoreboard** → Rankings after all rounds

---

## Game Modes

| Mode | Description | Win Condition |
|------|-------------|---------------|
| **Timer** | 1-10 minutes per round | Correct guess OR time expires |
| **Question Limit** | 10-50 shared questions | Correct guess OR limit reached |

---

## Scoring

| Action | Points |
|--------|--------|
| First correct guess | 2 pts |
| Later correct guess | 1 pt |
| Selector stump (no correct guess) | 1 pt |
| Wrong guess | 0 pts |

---

## Wikipedia Integration

- **Search:** `en.wikipedia.org/w/api.php` (CORS-enabled)
- **Summary:** `en.wikipedia.org/api/rest_v1/page/summary/{title}`
- **Auto-facts:** Gender, alive/dead, nationality, profession, birth era
- **Images:** Thumbnails fetched from Wikipedia

---

## Bot AI

15 named bots with strategic behavior:
- Ask logical yes/no questions from a curated pool
- Guess based on answered questions (35% base accuracy)
- Respect game mode limits (timer/qlimit)

---

## Future: Firebase Integration

To add true multiplayer (Architecture v6):

1. Add Firebase config to `src/firebase.ts`
2. Replace `gameStore.ts` with RTDB listeners
3. Deploy Cloud Functions for `submitGuess`, `answerQuestion`
4. Add Google PSE API key for search fallback
5. Host on Vercel

---

## License

MIT — Built for the intelligence community.
