# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/e-modul/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. Otherwise follow the rules below.

**Project:** e-modul (Induksi Elektromagnetik)
**Style:** Minimalism & Swiss, "Clean Academic" (white base, mode terang default + mode gelap)
**Revision:** 2026-11-18, replaces the earlier Claymorphism / teal-cream / dark-mode system.

---

## Color Tokens

| Role | Hex | Tailwind |
|------|-----|----------|
| Page & surface | `#FFFFFF` | `bg-white` |
| Subtle panel | `#F8FAFC` | `bg-slate-50` |
| Border | `#E2E8F0` (strong `#CBD5E1`) | `border-slate-200/300` |
| Text | `#0F172A` | `text-slate-900` |
| Muted text | `#475569` | `text-slate-600` |
| Brand (single hue) | `#2563EB` (hover `#1D4ED8`, tint `#EFF6FF`) | `brand-600/700/50` |
| Success | `#059669` | `emerald-600` |
| Warning | `#D97706` | `amber-600` |
| Danger | `#DC2626` | `rose-600` |

Physics-only colors (SVG simulations): north pole `#DC2626`, south pole `#2563EB`, field lines `#0891B2`, copper coil `#D97706`, induced current `#059669`.

Rules: one brand hue; no gradients, glows or blurred blobs. Semantic colors (success/warning/danger) are for status only.

## Typography

- Headings: **Outfit** (`font-display`)
- Body: **Work Sans** (`font-sans`)
- Numbers, formulas, micro-labels: **JetBrains Mono** (`font-mono`)

## Shape, Depth, Spacing

- Radius: cards 12px (`.card`), controls 10px, small chips/icons 8px.
- Depth: 1px border plus `0 1px 2px rgba(15,23,42,.04)`. Hover on interactive cards: border `brand-300` only (`.card-hover`).
- Spacing: 4/8 rhythm (`gap-3/4/6`, card padding `p-5/6/8`).

## Component Classes (`src/index.css`)

| Class | Use |
|-------|-----|
| `.card`, `.card-hover`, `.card-tint` | Surfaces |
| `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-success` | Buttons (min-height 44px) |
| `.input` | Text input, textarea, select |
| `.badge` | Pill labels |
| `.sim-canvas` | Light canvas around SVG simulations |
| `.slider` | Range inputs |

## Rules

- Icons: Lucide SVG only, no emoji.
- Every clickable element has `cursor-pointer`, a visible `:focus-visible` ring, and a 150-200ms color transition.
- Body text contrast at least 4.5:1; honor `prefers-reduced-motion`.
- File inputs use `sr-only` (not `hidden`) so they stay keyboard reachable.
- Check at 375, 768, 1024 and 1440px widths.

## Dark Mode

- Toggle (Sun/Moon) di header; pilihan disimpan di `localStorage` key `emodul_theme`, default terang. Class `dark` dipasang pada `<html>` (skrip inline di `index.html` mencegah kilatan).
- Semua skala warna (slate, brand, emerald, amber, rose, red) membaca CSS variable dari `src/theme-tokens.css`. Mode gelap membalik skala slate (50<->950) dan memakai versi gelap/terang untuk tint dan teks aksen. `brand-600` tetap agar tombol solid berteks putih tetap kontras.
- `bg-white` mengikuti mode (permukaan slate-900 di gelap). Pakai `bg-[#fff]` untuk elemen yang harus tetap putih (kertas sketsa, gambar referensi, QR).
- Teks/ikon brand memakai `text-brand-700` (bukan 600) agar kontras di kedua mode.
- SVG simulasi: warna terang pada atribut ditimpa lewat selector `.dark svg [fill=...]` di `index.css`; warna fisika tidak berubah.
- Halaman cetak LKPD/portofolio selalu terang.
