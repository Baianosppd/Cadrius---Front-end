import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonte hospedada localmente (sem requisição ao Google: LGPD + CSP restrito)
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import './index.css'
import App from './App.jsx'
import { initMonitoring } from './services/monitoring'

initMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
