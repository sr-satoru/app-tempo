import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App'

// Inicializa o react-grab em modo de desenvolvimento
if (import.meta.env.DEV) {
  import('react-grab')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
