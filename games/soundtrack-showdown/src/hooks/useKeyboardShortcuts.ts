import { useEffect, useRef } from 'react';

export interface KeyboardHandlers {
  onSelectOption: (index: number) => void;
  onConfirmOrAdvance: () => void;
  onRestart: () => void;
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
        if (digit >= 1 && digit <= 4) {
          current.onSelectOption(digit - 1);
          return;
        }
      }

      switch (event.key.toLowerCase()) {
        case 'enter':
          current.onConfirmOrAdvance();
          break;
        case 'r':
          current.onRestart();
          break;
        case 'm':
          current.onToggleMute();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
