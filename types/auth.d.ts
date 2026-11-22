declare module '#auth-utils' {
  interface User {
    id: string
    googleId: string
    email: string
    name: string
    avatarUrl: string | null
    role: string
    isVerifiedUksw: boolean
    onboardingCompleted: boolean
  }
}

export {}
