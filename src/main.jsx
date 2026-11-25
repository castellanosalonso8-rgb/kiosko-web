import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { HoursProvider } from './context/HoursContext'
import { ToastProvider } from './context/ToastContext'
import { UIProvider } from './context/UIContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* reducedMotion="user": respeta prefers-reduced-motion en todas las animaciones de Framer Motion */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <UIProvider>
            <AuthProvider>
              <SettingsProvider>
                <ThemeProvider>
                  <HoursProvider>
                    <App />
                  </HoursProvider>
                </ThemeProvider>
              </SettingsProvider>
            </AuthProvider>
          </UIProvider>
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>
)
