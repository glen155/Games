import { useEffect, useRef } from 'react';
import type { TeamId } from '../types';

export interface KeyboardHandlers {
  onReveal: (index: number) => void;
  onStrike: () => void;
  onAward: () => void;
  onSetActiveTeam: (team: TeamId) => void;
  onResetRound: () => void;
  onNextRound: () => void;
  onPrevRound: () => void;
  onToggleMute: () => void;
}

function isTypingIntoField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export function useKeyboardShortcuts(handlers: KeyboardHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingIntoField(event.target)) return;
      const current = handlersRef.current;

      if (event.code.startsWith('Digit')) {
        const digit = Number(event.code.replace('Digit', ''));
        if (digit >= 1 && digit <= 8) {
          current.onReveal(digit - 1);
          return;
        }
      }

      switch (event.key.toLowerCase()) {
        case 'x':
          current.onStrike();
          break;
        case 'a':
          current.onAward();
          break;
        case 'r':
          current.onResetRound();
          break;
        case 'n':
          current.onNextRound();
          break;
        case 'p':
          current.onPrevRound();
          break;
        case 'm':
          current.onToggleMute();
          break;
        case 'arrowleft':
          current.onSetActiveTeam(0);
          break;
        case 'arrowright':
          current.onSetActiveTeam(1);
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
