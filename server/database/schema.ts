import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  check,
  uniqueIndex
} from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    googleId: text('google_id').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    avatarUrl: text('avatar_url'),
    campus: text('campus'),
    major: text('major'),
    creditBalance: integer('credit_balance').notNull().default(0),
    penaltyCount: integer('penalty_count').notNull().default(0),
    teachingCooldownUntil: timestamp('teaching_cooldown_until', { withTimezone: true }),
    role: text('role').notNull().default('user'), // 'user' | 'admin'
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    check('credit_balance_non_negative', sql`${table.creditBalance} >= 0`)
  ]
)

export const userSkills = pgTable('user_skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  direction: text('direction').notNull(), // 'teach' | 'learn'
  category: text('category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  templateTag: text('template_tag'),
  availabilitySlots: jsonb('availability_slots').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tutorId: uuid('tutor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => userSkills.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(), // '1on1' | 'group'
  durationMinutes: integer('duration_minutes').notNull(), // 30 | 60
  format: text('format').notNull(), // 'online' | 'in_person'
  locationOrLink: text('location_or_link').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  maxLearners: integer('max_learners').notNull().default(1),
  checkinCode: text('checkin_code'),
  checkinGeneratedAt: timestamp('checkin_generated_at', { withTimezone: true }),
  status: text('status').notNull().default('confirmed'), // 'confirmed' | 'cancelled' | 'completed' | 'tutor_penalized'
  disputeEndsAt: timestamp('dispute_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const sessionBookings = pgTable('session_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Nullable while booking is in Hold Queue awaiting tutor schedule assignment
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => userSkills.id, { onDelete: 'cascade' }),
  learnerId: uuid('learner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  creditsHeld: integer('credits_held').notNull().default(1),
  status: text('status').notNull().default('confirmed'), // 'queued' | 'expired' | 'confirmed' | 'cancelled_free' | 'forfeited_to_tutor' | 'tutor_penalized' | 'checked_in' | 'completed' | 'disputed'
  preferredTimeNote: text('preferred_time_note'),
  holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  disputeEndsAt: timestamp('dispute_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const creditLedger = pgTable('credit_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Nullable for non-booking ledger events such as +2 onboarding bonus
  bookingId: uuid('booking_id').references(() => sessionBookings.id, { onDelete: 'set null' }),
  delta: integer('delta').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => sessionBookings.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tutorId: uuid('tutor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('reviews_booking_unique').on(table.bookingId),
    check('rating_range', sql`${table.rating} >= 1 AND ${table.rating} <= 5`)
  ]
)

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => sessionBookings.id, { onDelete: 'set null' }),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('open'), // 'open' | 'refunded' | 'released' | 'penalized'
  adminNote: text('admin_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})
