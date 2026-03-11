import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

// Read .env file to get favicon path
function getEnvVariable(name, defaultValue) {
  try {
    const envContent = readFileSync('../.env', 'utf-8')
    const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'))
    return match ? match[1] : defaultValue
  } catch {
    return defaultValue
  }
}

const faviconPath = getEnvVariable('VITE_FAVICON_PATH', '/favicon.ico')
const logoPath = getEnvVariable('VITE_LOGO_PATH', '/logo.png')

// Custom plugin to replace favicon path in HTML
const faviconPlugin = () => ({
  name: 'favicon-plugin',
  transformIndexHtml(html) {
    return html.replace('__FAVICON_PATH__', faviconPath)
  }
})

export default defineConfig({
  plugins: [faviconPlugin(), react()],
  define: {
    __VITE_LOGO_PATH__: JSON.stringify(logoPath)
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['projects.grovelab.net'],
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
