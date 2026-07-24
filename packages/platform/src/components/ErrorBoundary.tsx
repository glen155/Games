import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort catch for render crashes anywhere in a game (a stale/partial
 * persisted state from an older build, a bad prop, etc). Without this, React
 * unmounts the whole tree on any uncaught error and the page shows nothing
 * but its background color — undiagnosable for a player. This explains what
 * happened, offers a way back, and logs the real error for debugging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Game crashed:', error, info.componentStack);
  }

  handleStartOver = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.error) {
      return (
        <div className="shell-status">
          <h1 className="shell-status-title">Something went wrong</h1>
          <p className="shell-status-detail">
            {this.state.error.message || 'The game hit an unexpected error.'}
          </p>
          <button type="button" className="shell-btn shell-btn--ghost" onClick={this.handleStartOver}>
            Start over
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
