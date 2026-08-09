import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameShell } from '@games/platform'
import '@games/platform/theme.css'
import '@games/platform/styles.css'
import './styles/index.css'
import './styles/board.css'
import './styles/letters.css'
import './styles/modal.css'
import './styles/player.css'
import { wheelOfFortune } from './game'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameShell game={wheelOfFortune} />
  </StrictMode>,
)
