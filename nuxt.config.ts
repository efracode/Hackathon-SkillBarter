export default defineNuxtConfig({
  compatibilityDate: '2025-03-01',
  devtools: { enabled: false },
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
  fonts: {
    providers: {
      google: false,
      bunny: false,
      fontshare: false,
      fontsource: false,
      googleicons: false
    }
  },
  icon: {
    clientBundle: {
      scan: true
    }
  },
  app: {
    pageTransition: { name: 'page-fade', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'id'
      },
      title: 'SkillBarter - Learning Without Money, Teaching for Credits',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
        }
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
