export type {
  GameDefinition,
  HostViewProps,
  PlayerViewProps,
  PlayerAction,
  PlayerPresence,
  Role,
  Room,
} from './types';

export { isMultiplayerConfigured, getSupabase, ensureSignedIn } from './supabase';
export { generateRoomCode, normalizeRoomCode, isValidRoomCode } from './roomCode';
export { useHostRoom, usePlayerRoom, type ConnectionPhase } from './useRoom';
export { useLocalGame } from './useLocalGame';
export { callEdgeFunction } from './edgeFunctions';
export { recordGameResult, fetchRecentResults, type GameResult } from './leaderboard';
export { reportIssue, fetchIssueReports, setIssueReportReviewed, type IssueReport } from './issueReports';

export { GameShell } from './components/GameShell';
export { RoomCode } from './components/RoomCode';
export { PlayerList } from './components/PlayerList';
export { QRCode } from './components/QRCode';
export { ErrorBoundary } from './components/ErrorBoundary';
export { ReportIssueButton } from './components/ReportIssueButton';
