import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameShell } from '@games/platform'
import '@games/platform/styles.css'
import './styles/index.css'
import './styles/board.css'
import './styles/scoreboard.css'
import './styles/strike.css'
import './styles/player.css'
import { familyFeud } from './game'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameShell game={familyFeud} />
  </StrictMode>,
)
