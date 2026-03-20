import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const publicBaseUrl = process.env.VITE_PUBLIC_BASE_URL
let publicHost: string | null = null

if (publicBaseUrl) {
  try {
    publicHost = new URL(publicBaseUrl).hostname
  } catch {
    publicHost = null
  }
}

const allowedHosts = ['localhost', '127.0.0.1', '.loca.lt']
if (publicHost && !allowedHosts.includes(publicHost)) {
  allowedHosts.push(publicHost)
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts,
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
})
