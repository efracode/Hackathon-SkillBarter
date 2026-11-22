# SkillBarter MVP

**Learning Without Money, Teaching for Credits**

Platform pertukaran keahlian antar mahasiswa berbasis micro-session 30 menit, ekonomi kredit anti-minus dengan escrow, dan ulasan terverifikasi berbasis check-in 6 digit / QR.

## Stack Teknologi
- **Framework:** Nuxt 4 (TypeScript)
- **UI & Styling:** Tailwind CSS v4 + Nuxt UI v3 + Phosphor Icons (`@iconify-json/ph`)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Google OAuth (`nuxt-auth-utils`)

## Cara Menjalankan Lokal
1. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Isi variabel pada `.env`:
   - `DATABASE_URL` (PostgreSQL, misalnya Neon / Supabase / Postgres lokal)
   - `NUXT_SESSION_PASSWORD` (minimal 32 karakter acak)
   - `NUXT_OAUTH_GOOGLE_CLIENT_ID` & `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`
3. Install dependensi dan dorong skema database:
   ```bash
   npm install
   npm run db:push
   npm run db:seed
   ```
4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
5. Untuk menjadikan akun sebagai Admin, ubah kolom `role` menjadi `'admin'` pada tabel `users` melalui `npm run db:studio`.

## Verifikasi & Pengujian
- `npm test` — Uji unit aturan ekonomi kredit, eskalasi cooldown, kuorum grup, dan window check-in.
- `npm run typecheck` — Pemeriksaan tipe TypeScript.
- `npm run build` — Build produksi Nuxt & Nitro.
