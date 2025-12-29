
// Vite code splitting configuration
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['@mui/material', '@emotion/react']
        }
      }
    }
  }
}
