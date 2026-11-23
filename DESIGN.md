# DESIGN.md — Editorial Campus Exchange (SkillBarter Design System v3.0)

Dokumen ini menetapkan sistem desain resmi **Editorial Campus Exchange** untuk **SkillBarter MVP** (Nuxt 3 compat v4 + TypeScript + Tailwind CSS v4 + Nuxt UI v3 + Phosphor Icons).

---

## 1. Arah Desain: Editorial Campus Exchange

SkillBarter dirancang seperti **jurnal akademik kampus modern yang berpadu dengan buku besar pertukaran (*exchange ledger*)**: terang, terstruktur dengan garis tipis (*hairline rules*), tipografi ekspresif, dan komposisi asimetris yang memberi ruang pada konten.

### Prinsip Anti-Generik
1. **Aturan Garis (*Hairline Rules*), Bukan Kotak Seragam:** Pisahkan daftar, metrik, dan seksi menggunakan `border-b border-stone-200`, `divide-stone-200`, dan kolom asimetris—bukan membungkus setiap blok informasi ke dalam kartu putih `rounded-2xl`.
2. **Tipografi sebagai Arsitektur:** Padukan `Instrument Serif` (judul editorial & aksen), `Plus Jakarta Sans` (UI & keterbacaan), dan `JetBrains Mono` (`tabular-nums` untuk kredit, escrow, kode check-in 6 digit, dan waktu).
3. **Warna Fungsional Terukur:** 90% antarmuka menggunakan kanvas kertas hangat, permukaan putih bersih, dan tinta gelap. Warna aksen hanya muncul untuk **fungsi dan status semantik yang jelas**.
4. **Radius Tajam & Tenang:** Gunakan `rounded-sm` (`4px`) untuk tag/badge/baris ledger, `rounded-md` (`6px`) untuk tombol/input, dan `rounded-lg` (`8px`) untuk panel atau drawer utama. Hindari `rounded-2xl` massal dan hindari shadow/gradient dekoratif.

---

## 2. Token Warna & Semantik (WCAG AA)

Konfigurasi `app/app.config.ts`: `primary: 'blue'`, `secondary: 'amber'`, `success: 'emerald'`, `warning: 'amber'`, `error: 'rose'`, `neutral: 'stone'`.

| Token / Peran | Nilai / Kelas Tailwind | Rasio Kontras | Fungsi Tunggal |
| :--- | :--- | :--- | :--- |
| **Canvas (Kertas Hangat)** | `#FAF8F4` (`--bg-canvas`) | — | Latar belakang utama seluruh aplikasi. |
| **Surface (Lembar Bersih)** | `#FFFFFF` (`bg-white`) | — | Panel kerja, form, drawer, masthead, tabel aktif. |
| **Surface Inset (Kertas Redup)** | `#F3EFE6` (`--bg-inset`) | — | Header tabel, strip ringkasan, kutipan, panel pratinjau sekunder. |
| **Ink Utama** | `#14181F` (`--ink-primary`) | `> 15:1` | Headline, judul skill, nama mentor, angka metrik utama. |
| **Ink Sekunder** | `#475569` (`text-slate-600`) | `7.2:1` | Deskripsi paragraf, isi ulasan, teks instruksi. |
| **Ink Tersier** | `#64748B` (`text-slate-500`) | `4.6:1` | Metadata kategori, durasi, kampus, timestamp. |
| **Hairline Border** | `#E5E0D5` (`border-stone-200`) | — | Pembatas seksi, baris tabel, stroke panel standar. |
| **Primary Cobalt** | `#1D4ED8` (`blue-700`) / `#2563EB` (`blue-600`) | `> 6.5:1` (`blue-700` on white) | CTA utama, link aktif, fokus keyboard, badge `Verified UKSW`. |
| **Escrow / Pending Ochre** | `amber-700` (`#B45309`) on `amber-50` + `border-amber-200` | `5.0:1` | Khusus **kredit terkunci di Escrow**, **Hold Queue 48 jam**, dan status menunggu. |
| **Verified / Completed Sage** | `emerald-700` (`#047857`) on `emerald-50` + `border-emerald-200` | `5.4:1` | Khusus **Check-in Terverifikasi**, **Kredit Cair**, **Sesi Selesai**, dan kuorum terpenuhi. |
| **Danger / Cooldown Crimson** | `rose-700` (`#BE123C`) on `rose-50` + `border-rose-200` | `6.1:1` | Khusus error API, **Cooldown Mengajar**, batal `< 12 jam`, sengketa, dan tombol Tolak/Keluar. |

---

## 3. Skala Tipografi & Hierarki

- **Editorial Display (`h1` Landing / Hero):** `Instrument Serif` + `Plus Jakarta Sans`, `clamp(2.25rem, 4.5vw, 3.5rem)`, `leading-[1.06]`, `tracking-tight`, `text-wrap: balance`.
- **Page Masthead (`h1` Workspace):** `Plus Jakarta Sans` `text-2xl sm:text-3xl font-bold tracking-tight text-[#14181F]`.
- **Section Heading (`h2`):** `text-lg sm:text-xl font-bold tracking-tight text-[#14181F]`, atau label seksi editorial `font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500`.
- **Body & Microcopy:** `14px`–`15px` (`text-sm`/`text-[15px]`), `leading-relaxed`, bahasa Indonesia langsung tanpa klise ("Welcome back", dll.) dan tanpa em dash (`—`).
- **Tabular Numerals (`font-mono tabular-nums`):** Wajib untuk saldo kredit (`2K`), escrow (`1E`), kode check-in (`482910`), kuorum (`2/5`), dan durasi (`30m` / `60m`).

---

## 4. Arsitektur Navigasi (Application Shell)

- **Desktop (`>= 768px`) — Sticky Top Editorial Masthead (`h-14`):**
  - Memberi ruang horizontal penuh (`max-w-6xl` hingga `max-w-7xl`) untuk komposisi split-view, tabel admin, dan studio mengajar tanpa terjepit sidebar tetap.
  - Kiri: Wordmark `SkillBarter` + label edisi kampus.
  - Tengah: Navigasi datar (`Dashboard`, `Jelajah`, `Sesi Saya`, `Mengajar`, `Dompet`, dan `Admin` khusus role `admin`) dengan garis bawah aktif `2px solid #1D4ED8` (`aria-current="page"`).
  - Kanan: Tombol `Ctrl+K` Quick Command, readout ringkas saldo (`Tersedia · Escrow`), dan akses cepat `/profile`.
- **Mobile (`< 768px`) — Minimal Top Bar + 5-Tab Bottom Bar:**
  - Top bar menampilkan Logo, tombol pencarian `Ctrl+K`, dan pill Dompet (`K` / `E`).
  - Bottom Navigation (`Beranda`, `Jelajah`, `Sesi`, `Mengajar`, `Profil`) memiliki tinggi nyaman (`>= 56px`), garis aktif atas `2px`, dan `pb-24` pada `<main>` agar tidak pernah menutupi konten.

---

## 5. Komposisi Khusus per Halaman (11 Halaman)

1. **`/` (Editorial Landing):** Masthead publik + Split Editorial Hero (`Instrument Serif` + **`CreditFlowSimulator`** langsung di *above-the-fold*) + Strip Prinsip `01–03` tanpa kotak + Seksi Bukti Kehadiran (`CheckinPreviewWidget`) + **Master-Detail Direktori Publik** (`12 kolom`: daftar tipis ber-garis di kiri, detail mentor sorotan di kanan).
2. **`/login` (Split Architectural Auth):** Kiri: manifesto pertukaran waktu 1:1 + simulasi domain `@student.uksw.edu` vs Gmail Umum; Kanan: gerbang masuk tunggal `<a href="/api/auth/google">` dengan auto-redirect jika sudah terautentikasi.
3. **`/onboarding` (3-Step Progressive Disclosure + Live Card):** Step 1 Identitas & Foto (upload/crop WebP 256x256, nama kustom, bio, kampus/jurusan), Step 2 Minat Belajar, Step 3 Draf Micro-Session 30m — didampingi Live Preview kartu profil dan jaminan `+2 Kredit Awal`.
4. **`/dashboard` (Editorial Activity Center):** **Contextual Priority Action Strip** + baris readout saldo di atas kanvas kertas (tanpa 4 kotak metrik seragam) + Switcher `Mode Belajar` / `Mode Mengajar` + tata letak asimetris 7/5 langsung di atas `#FAF8F4` (`lg:border-l border-stone-200`) + Quick-Booking Slideover.
5. **`/explore` (Master-Detail Directory):** Search editorial tipis + kategori *horizontal scrollable* + tombol `Filter (N)` (`USlideover`) pada `< 1024px` + Desktop Split `7/5` + Mobile `USlideover` detail.
6. **`/sessions` (Structured Queue & Schedule):** Pemisahan jelas antara **Aksi Mendesak (Hold Queue Masuk/Keluar)**, **Jadwal Aktif**, dan **Riwayat Sesi** dengan modal konfirmasi pembatalan & penolakan Hold Queue.
7. **`/sessions/[id]` (Live Session Workspace):** Header **State Timeline** (desktop 4 kolom, mobile ringkas 1 baris + tab switcher `Check-in & Aksi` | `Chat Sesi`) + Generator QR/Kode 6-Digit reaktif + Review & Report (`confirmed` & `checked_in` + pengajar).
8. **`/teach` (Teaching Studio):** Kanvas utama daftar **Slot Jadwal Terpublikasi & Topik Mengajar**, sedangkan form publikasi slot dan tambah topik dibuka melalui `USlideover` kontekstual + proteksi cooldown.
9. **`/wallet` (Credit & Escrow Ledger):** Bar proporsi **Saldo Tersedia vs Terkunci di Escrow** + filter mutasi (`Semua`, `Masuk`, `Escrow / Keluar`) + tabel ledger responsif.
10. **`/profile` (Identity, Skills & Reputation):** Header identitas editorial + tab terpisah untuk Edit Identitas, Skill & Ulasan, Pengaturan/Logout, serta akses cepat `/admin` bagi akun admin di mobile.
11. **`/admin` (Operations Console):** Metrik terkelompok (**Operasional Sesi** vs **Sirkulasi Kredit**) + ekspor CSV/JSON + simulator *fast-forward* juri + antrean sengketa dengan input `adminNote` dan modal konfirmasi.

---

## 6. Standar Aksesibilitas, Responsivitas & Gerak

- Seluruh halaman data wajib menangani **Loading** (`aria-busy="true"`), **Error + Retry**, **Empty State**, **Success Feedback**, dan **Konfirmasi aksi berisiko**.
- Target sentuh minimum `40px`–`44px`, `:focus-visible` `2px solid #1D4ED8`, semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<table>`), dan dukungan `@media (prefers-reduced-motion: reduce)`.
- Ikonografi memakai **Phosphor Icons** (`i-ph-*`) secara konsisten tanpa emoji di seluruh UI.
