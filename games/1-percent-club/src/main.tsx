import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameShell } from '@games/platform'
import '@games/platform/theme.css'
import '@games/platform/styles.css'
import './styles/index.css'
import './styles/question.css'
import './styles/status.css'
import './styles/multiplayer.css'
import { onePercentClub } from './game'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameShell game={onePercentClub} />
  </StrictMode>,
)
