export const DESIGN_TOKENS = {
  colors: {
    bgCanvas: '#FAF8F4',
    bgSurface: '#FFFFFF',
    bgInset: '#F3EFE6',
    borderHairline: '#E5E0D5',
    borderControl: '#94A3B8',
    inkPrimary: '#14181F',
    inkSecondary: '#475569',
    inkTertiary: '#526071',
    primary: '#1D4ED8',
    primaryHover: '#1E40AF',
    primarySoft: '#EFF6FF',
    primaryBorder: '#BFDBFE',
    success: '#047857',
    successSoft: '#ECFDF5',
    successBorder: '#A7F3D0',
    warning: '#92400E',
    warningSoft: '#FFFBEB',
    warningBorder: '#FDE68A',
    danger: '#BE123C',
    dangerSoft: '#FFF1F2',
    dangerBorder: '#FECDD3'
  },
  radius: {
    badge: '4px',
    control: '6px',
    panel: '8px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  breakpoints: {
    mobile: 390,
    md: 768,
    lg: 1024,
    desktop: 1280
  },
  motion: {
    fast: '150ms cubic-bezier(0.22, 1, 0.36, 1)',
    panel: '170ms cubic-bezier(0.22, 1, 0.36, 1)'
  }
} as const

export const SKILL_CATEGORIES = [
  'Semua',
  'Teknologi & Coding',
  'Desain & UI/UX',
  'Bahasa & Presentasi',
  'Akademik & Riset',
  'Karier & CV'
] as const

export const TEACH_CATEGORIES = [
  'Teknologi & Coding',
  'Desain & UI/UX',
  'Bahasa & Presentasi',
  'Akademik & Riset',
  'Karier & CV'
] as const

export function getUserInitials(name?: string | null): string {
  if (!name) return 'SB'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'SB'
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}
