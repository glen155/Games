import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameShell } from '@games/platform'
import '@games/platform/theme.css'
import '@games/platform/styles.css'
import './styles/index.css'
import './styles/board.css'
import './styles/voting.css'
import './styles/final.css'
import './styles/gameover.css'
import './styles/player.css'
import { weakestLink } from './game'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameShell game={weakestLink} />
  </StrictMode>,
)
