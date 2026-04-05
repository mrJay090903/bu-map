export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type ConversationContext = {
  currentLocation?: string;
  destination?: string;
  isNavigating: boolean;
};
