import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App'

// Inicializa o react-grab em modo de desenvolvimento
if (import.meta.env.DEV) {
  import('react-grab')
}

// Previne alteração acidental de valores numéricos via scroll do mouse
window.addEventListener(
  'wheel',
  () => {
    if (
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.type === 'number'
    ) {
      document.activeElement.blur()
    }
  },
  { passive: true }
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
