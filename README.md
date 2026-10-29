# 🦖 Dino Coding Colosseum 3D

> An action-packed browser-based 3D arena brawler where computer science knowledge powers prehistoric combat.

---

## 🎮 Overview

**Dino Coding Colosseum 3D** fuses fast-paced 3D arcade combat with an educational coding gauntlet. Stepping into an ancient Roman-style colosseum, players command iconic apex predators—such as the **Tyrannosaurus Rex**, **Spinosaurus**, **Triceratops**, and **Ankylosaurus**—in intense duels against AI-driven opponents.

In this arena, **code is your weapon**:
- **Knowledge-Driven Combat**: Solve real-time technical challenges spanning Data Structures & Algorithms, Systems & Networks, Web Architecture, Machine Learning, and Modern Languages (JavaScript, Python, C++, Rust).
- **Tactical Strikes & Ragdoll Physics**: Correct answers execute bone-crushing bites, tail whips, and elemental attacks (fire, frost, tidal, laser). Mistakes leave your dinosaur vulnerable to counterattacks, stumbles, and ragdoll knockdowns.
- **Apex Boss Gauntlet**: Build combo streaks across stages to unlock ultimate abilities and defeat legendary apex bosses.

---

## 🌟 Key Technical Highlights

- **Active Ragdoll Physics**: Built with **Three.js** and **Cannon-es** for dynamic joint constraints, weight distribution, and impact physics.
- **Procedural 3D Dinosaurs**: Features 20+ species rendered via procedural geometry and in-engine textures—ensuring instant browser load times without heavy asset files.
- **Hybrid AI Quiz Engine**: Supports live question generation via **Google Gemini** and **xAI Grok** APIs, with a built-in offline bank of 600+ curated questions.
- **Synthesized Audio**: Real-time roars, swings, and impact sound effects produced directly through the Web Audio API.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/manishchauhan/dino_hunter.git
cd dino_hunter

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open your browser at `http://localhost:5173` to enter the Colosseum.

---

## 🛠️ Tech Stack

- **Core**: HTML5, Vanilla JavaScript, CSS3
- **3D Graphics**: [Three.js](https://threejs.org/)
- **Physics Engine**: [cannon-es](https://github.com/pmndrs/cannon-es)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Audio**: Web Audio API (procedural synthesis)
- **AI Integrations**: Google Gemini API & xAI Grok API (direct client integration)

---

## 📜 License
MIT License. Created by [Manish Chauhan](https://github.com/manishchauhan).
