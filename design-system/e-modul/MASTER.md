# DESIGN SYSTEM MASTER BLUEPRINT
## Playful Educational Platform (Claymorphism & Vibrant STEM Studio)
### Based on UI/UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`) & `uupm.cc/demo/educational-platform`

---

### 1. Aesthetic Persona & Design Philosophy
* **Design Style**: Claymorphism (Soft 3D, tactile pillowy containers, generous border radii, dual-layer outer drop shadow + inner highlight & depth).
* **Vibe**: Playful, vibrant, welcoming, educational, and high-craft gamified STEM learning.
* **Canvas Backdrop**: Soft pastel tinted canvas (`#F5F3FF` to `#F8FAFC` with subtle mesh blobs of cyan, violet, and amber).
* **Typography Ink**: Deep Indigo-Black (`#1E1B4B` / `#0F172A`) ensuring **WCAG AAA Compliance (> 7:1 contrast ratio)** across all cards, tables, and inputs.

---

### 2. Color Palette & Tokens (Vibrant & Engaging)

| Token | Light Hex | Role & Contrast Ratio (vs `#FFFFFF`) |
| :--- | :--- | :--- |
| `--bg-canvas` | `#F5F3FF` | Soft Lavender/White playful canvas |
| `--card-base` | `#FFFFFF` | Claymorphic inflated card base with triple-shadow |
| `--text-heading` | `#1E1B4B` | Deep Indigo-Slate for all headers & titles (Contrast > 15:1) |
| `--text-body` | `#1E293B` | Dark Slate body copy (Contrast > 12:1) |
| `--text-caption`| `#334155` | Slate-700 for labels, badges & metadata (Contrast > 7:1) |
| `--accent-cyan` | `#0284C7` | Ocean Blue for Magnetic Flux ($\Phi$) & interactive actions |
| `--accent-amber`| `#D97706` | Warm Amber for EMF ($\varepsilon$), coil windings, awards |
| `--accent-emerald`| `#059669`| Mint Emerald for Current Direction ($I$) & completed steps |
| `--accent-purple` | `#7C3AED` | Playful Purple for EDP Challenges & milestone badges |
| `--accent-rose` | `#E11D48` | Coral Rose for North Pole ($U$) & alerts |
| `--sim-viewport`| `#0A0F1D` | Dedicated oscilloscope viewport for live physics simulations |

---

### 3. Claymorphic Shadow & Geometry Recipe
```css
/* Tactile Clay Card */
border-radius: 28px;
background: #FFFFFF;
border: 2px solid rgba(255, 255, 255, 0.95);
box-shadow: 
  0 14px 28px -6px rgba(30, 27, 75, 0.08),
  0 6px 12px -3px rgba(30, 27, 75, 0.04),
  inset 0 3px 6px 0 rgba(255, 255, 255, 0.95),
  inset 0 -3px 6px 0 rgba(30, 27, 75, 0.06);

/* Squishy Tactile Button */
border-radius: 20px;
border: 2px solid rgba(255, 255, 255, 0.5);
box-shadow: 
  0 8px 18px -3px rgba(14, 165, 233, 0.4),
  inset 0 2px 4px rgba(255, 255, 255, 0.65),
  inset 0 -3px 4px rgba(0, 0, 0, 0.18);
```

---

### 4. Interactive Simulation Viewport Rule
Setiap kanvas simulasi fisika (kumparan, fluks magnetik, Hukum Faraday, Hukum Lenz) ditempatkan di dalam monitor mini laboratorium berlatar gelap pekat (`#0A0F1D`) agar pendaran LED, garis fluks magnetik cyan, dan panah arus hijau kawat depan berpendar kontras tinggi tanpa pernah pudar di latar putih.
Semua teks di dalam layar simulasi wajib menggunakan `#FFFFFF` atau `#F8FAFC`.
Semua teks di luar layar simulasi (di kartu putih) wajib menggunakan `#1E1B4B` atau `#1E293B`.
