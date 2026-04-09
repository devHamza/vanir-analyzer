import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/vanir-analyzer/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chart': ['chart.js', 'react-chartjs-2'],
          'pdf': ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
})
