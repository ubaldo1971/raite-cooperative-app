import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/admin/',
    server: {
        port: 4000,
        open: true,
        proxy: {
            '/api': {
                target: 'https://raitecoop.org',
                changeOrigin: true,
                secure: false
            }
        }
    }
})
