import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

async function seed() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client, { schema })

  const now = Date.now()
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000)
  const twoDays = new Date(now + 48 * 60 * 60 * 1000)
  const pastDay = new Date(now - 24 * 60 * 60 * 1000)

  const [mentor] = await db
    .insert(schema.users)
    .values({
      googleId: 'demo-mentor-1',
      email: 'nadhira.mentor@campus.ac.id',
      name: 'Nadhira Putri',
      campus: 'Institut Teknologi Bandung',
      major: 'Desain Komunikasi Visual',
      creditBalance: 5,
      penaltyCount: 0,
      role: 'user',
      onboardingCompletedAt: pastDay
    })
    .onConflictDoNothing()
    .returning()

  const [coder] = await db
    .insert(schema.users)
    .values({
      googleId: 'demo-mentor-2',
      email: 'rafi.dev@campus.ac.id',
      name: 'Rafi Pratama',
      campus: 'Universitas Indonesia',
      major: 'Ilmu Komputer',
      creditBalance: 3,
      penaltyCount: 0,
      role: 'user',
      onboardingCompletedAt: pastDay
    })
    .onConflictDoNothing()
    .returning()

  const [learner] = await db
    .insert(schema.users)
    .values({
      googleId: 'demo-learner-1',
      email: 'bima.learner@campus.ac.id',
      name: 'Bima Santoso',
      campus: 'Universitas Gadjah Mada',
      major: 'Manajemen',
      creditBalance: 2,
      penaltyCount: 0,
      role: 'user',
      onboardingCompletedAt: pastDay
    })
    .onConflictDoNothing()
    .returning()

  if (!mentor || !coder || !learner) {
    console.log('Seed data already exists, skipping.')
    await client.end()
    return
  }

  const [skillUi] = await db
    .insert(schema.userSkills)
    .values({
      userId: mentor.id,
      direction: 'teach',
      category: 'Desain & UI/UX',
      title: 'Bedah CV & Portofolio UI/UX untuk Magang',
      description: 'Review langsung struktur portofolio Figma atau Notion selama 30 menit.',
      templateTag: 'Review Tugas / Portofolio (30m)'
    })
    .returning()

  const [skillTs] = await db
    .insert(schema.userSkills)
    .values({
      userId: coder.id,
      direction: 'teach',
      category: 'Teknologi & Coding',
      title: 'Debugging TypeScript & REST API untuk Tugas Proyek',
      description: 'Sesi Q&A santai membedah error backend atau frontend.',
      templateTag: 'Q&A Dasar (30m)'
    })
    .returning()

  if (skillUi && skillTs) {
    // 3 completed sessions for Nadhira so she earns Verified Peer Mentor badge
    for (let i = 1; i <= 3; i++) {
      const [doneSess] = await db
        .insert(schema.sessions)
        .values({
          tutorId: mentor.id,
          skillId: skillUi.id,
          mode: '1on1',
          durationMinutes: 30,
          format: 'online',
          locationOrLink: 'https://meet.google.com/demo-verified',
          scheduledAt: new Date(now - i * 48 * 60 * 60 * 1000),
          maxLearners: 1,
          checkinCode: '482910',
          checkinGeneratedAt: new Date(now - i * 48 * 60 * 60 * 1000),
          status: 'completed'
        })
        .returning()

      if (doneSess) {
        const [doneBooking] = await db
          .insert(schema.sessionBookings)
          .values({
            sessionId: doneSess.id,
            skillId: skillUi.id,
            learnerId: learner.id,
            creditsHeld: 1,
            status: 'completed',
            checkedInAt: new Date(now - i * 48 * 60 * 60 * 1000)
          })
          .returning()

        if (doneBooking) {
          await db.insert(schema.reviews).values({
            sessionId: doneSess.id,
            bookingId: doneBooking.id,
            reviewerId: learner.id,
            tutorId: mentor.id,
            rating: 5,
            comment: 'Masukannya konkret dan langsung bisa dipakai untuk perbaikan portofolio.'
          })
        }
      }
    }

    // Upcoming slots for explore directory
    await db.insert(schema.sessions).values([
      {
        tutorId: mentor.id,
        skillId: skillUi.id,
        mode: '1on1',
        durationMinutes: 30,
        format: 'online',
        locationOrLink: 'https://meet.google.com/sb-uiux-30m',
        scheduledAt: tomorrow,
        maxLearners: 1,
        status: 'confirmed'
      },
      {
        tutorId: coder.id,
        skillId: skillTs.id,
        mode: 'group',
        durationMinutes: 60,
        format: 'in_person',
        locationOrLink: 'Perpustakaan Pusat Lt. 2 Meja B4',
        scheduledAt: twoDays,
        maxLearners: 4,
        status: 'confirmed'
      }
    ])
  }

  console.log('Seed completed successfully.')
  await client.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
