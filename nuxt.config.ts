export default defineNuxtConfig({
  compatibilityDate: '2025-03-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'light',
    fallback: 'light'
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'id'
      },
      title: 'SkillBarter - Learning Without Money, Teaching for Credits',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || '',
        redirectURL: process.env.NUXT_OAUTH_GOOGLE_REDIRECT_URL || 'http://localhost:3000/api/auth/google'
      }
    }
  }
})
