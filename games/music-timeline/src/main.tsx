import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameShell } from '@games/platform'
import '@games/platform/styles.css'
import './styles/index.css'
import { musicTimeline } from './game'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameShell game={musicTimeline} />
  </StrictMode>,
)
