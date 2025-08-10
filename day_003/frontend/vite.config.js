import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // setting up proxy in vite
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:3000', // your backend URL
  //       changeOrigin: true,
  //       secure: false
  //     }
  //   }
  // },
  plugins: [react()],
})
