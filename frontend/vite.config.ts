// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   build: {
//     outDir: 'dist',
//     sourcemap: false,
//     minify: 'terser',
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           vendor: ['react', 'react-dom', 'react-router-dom'],
//           lucide: ['lucide-react']
//         }
//       }
//     }
//   },
//   server: {
//     proxy: {
//       '/api': {
//         target: 'https://figma-clone-app-gnsu.vercel.app/api',
//         changeOrigin: true,
//         secure: false
//       }
//     }
//   }
// })

