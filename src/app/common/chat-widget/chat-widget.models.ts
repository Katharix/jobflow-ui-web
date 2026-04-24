// ---------------------------------------------------------------------------
// Chat Widget Models
// ---------------------------------------------------------------------------

export type ChatWidgetPhase =
  | 'collapsed'   // FAB button only
  | 'bot'         // Pre-chat bot conversation
  | 'validate'    // User info form before queueing
  | 'waiting'     // In queue — showing position
  | 'live'        // Connected to a live rep
  | 'ended';      // Session was terminated

export interface ChatWidgetMessage {
  id: string;
  content: string;
  sender: 'bot' | 'user' | 'rep';
  senderName: string;
  timestamp: Date;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export interface ChatWidgetUserInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ChatWidgetState {
  phase: ChatWidgetPhase;
  messages: ChatWidgetMessage[];
  sessionId: string | null;
  queuePosition: number | null;
  estimatedWait: number | null;
  repName: string | null;
  userInfo: ChatWidgetUserInfo | null;
  isRepTyping: boolean;
  hasUnread: boolean;
  isUploading: boolean;
  error: string | null;
}
