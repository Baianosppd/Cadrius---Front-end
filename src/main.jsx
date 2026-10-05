import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonte hospedada localmente (sem requisição ao Google: LGPD + CSP restrito)
// Inter (variável) no texto e nas telas; Poppins só na marca "Cadrius" (identidade)
import '@fontsource-variable/inter'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import './index.css'
import App from './App.jsx'
import { initMonitoring } from './services/monitoring'
import { initTheme } from './services/theme'

initTheme()
initMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
