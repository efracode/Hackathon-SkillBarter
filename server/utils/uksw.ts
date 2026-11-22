export function isUkswEmail(email?: string | null): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return normalized.endsWith('@student.uksw.edu') || normalized.endsWith('@uksw.edu')
}
