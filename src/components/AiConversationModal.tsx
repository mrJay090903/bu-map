import { Bot, Radio, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ConversationMessage } from "../types/conversation";

type AiConversationModalProps = {
  show: boolean;
  messages: ConversationMessage[];
  isListening: boolean;
  isProcessing: boolean;
  voiceSupported: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  onClose: () => void;
  onSendMessage: (message: string) => void;
};

export function AiConversationModal({
  show,
  messages,
  isListening,
  isProcessing,
  voiceSupported,
  isSpeaking,
  volumeLevel,
  onClose,
}: AiConversationModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, show]);

  if (!show) {
    return null;
  }

  // Calculate volume indicator size based on audio level
  const volumeScale = Math.min(volumeLevel / 50, 1.5);
  const volumeOpacity = Math.min(volumeLevel / 100, 0.8);

  return (
    <section className="pointer-events-none absolute inset-0 z-1000 flex items-end justify-center bg-slate-950/70 p-4 md:items-center">
      <div className="pointer-events-auto relative flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-cyan-100/70 bg-white shadow-[0_38px_120px_-45px_rgba(15,23,42,0.95)] md:h-150">
        {/* Header */}
        <div className="relative border-b border-slate-200 bg-linear-to-r from-cyan-500 to-sky-600 px-5 py-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">AI Assistant</p>
                <p className="text-xs text-cyan-50">
                  {!voiceSupported
                    ? "⚠️ Voice not available"
                    : isSpeaking
                      ? "🎤 Recording your voice..."
                      : isProcessing
                        ? "💭 Processing..."
                        : isListening
                          ? "👂 Listening... Just speak!"
                          : "Starting..."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="relative flex flex-1 flex-col overflow-y-auto bg-slate-50 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              {/* Animated Voice Indicator */}
              <div className="relative mb-6">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                    isSpeaking
                      ? "bg-red-500 shadow-lg shadow-red-500/50"
                      : isListening
                        ? "bg-cyan-500 shadow-lg shadow-cyan-500/50"
                        : "bg-cyan-100"
                  }`}
                  style={{
                    transform: isSpeaking ? `scale(${volumeScale})` : "scale(1)",
                  }}
                >
                  <Radio
                    className={`h-10 w-10 ${
                      isSpeaking || isListening ? "text-white" : "text-cyan-600"
                    }`}
                  />
                </div>
                
                {/* Pulse rings when listening */}
                {isListening && !isSpeaking && (
                  <>
                    <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-20" />
                    <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-400 opacity-10" style={{ animationDelay: "0.5s" }} />
                  </>
                )}

                {/* Volume indicator when speaking */}
                {isSpeaking && (
                  <div
                    className="absolute inset-0 rounded-full bg-red-400 opacity-30 transition-all duration-100"
                    style={{
                      transform: `scale(${1 + volumeScale * 0.3})`,
                      opacity: volumeOpacity,
                    }}
                  />
                )}
              </div>

              <p className="mb-2 text-lg font-semibold text-slate-900">
                {!voiceSupported
                  ? "Voice unavailable"
                  : isSpeaking
                    ? "Speak now..."
                    : isListening
                      ? "Listening for your voice"
                      : "Starting voice detection..."}
              </p>
              <p className="max-w-sm text-sm text-slate-600">
                {!voiceSupported
                  ? "Enable microphone permissions to use voice commands"
                  : isSpeaking
                    ? "Keep talking, I'm recording..."
                    : isListening
                      ? "Just start speaking - no button needed!"
                      : "Initializing microphone..."}
              </p>

              {isListening && !isSpeaking && (
                <div className="mt-6 w-full max-w-md space-y-2 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">
                    💡 Voice Tips
                  </p>
                  <ul className="space-y-1 text-left text-xs text-cyan-900">
                    <li>• Speak naturally and clearly</li>
                    <li>• Say "Take me to [building name]"</li>
                    <li>• Ask "Where is the library?"</li>
                    <li>• Questions like "How far is the gym?"</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-linear-to-br from-cyan-500 to-sky-600 text-white"
                        : "border border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={`mt-1 text-[10px] ${message.role === "user" ? "text-cyan-100" : "text-slate-400"}`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500"></span>
                      </div>
                      <span className="text-xs text-slate-500">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Voice Status Bar */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Status indicator */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  isSpeaking
                    ? "bg-red-100"
                    : isListening
                      ? "bg-cyan-100"
                      : "bg-slate-100"
                }`}
              >
                <Radio
                  className={`h-5 w-5 transition-colors ${
                    isSpeaking
                      ? "text-red-600 animate-pulse"
                      : isListening
                        ? "text-cyan-600"
                        : "text-slate-400"
                  }`}
                />
              </div>

              {/* Status text */}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {!voiceSupported
                    ? "Voice Disabled"
                    : isSpeaking
                      ? "Recording..."
                      : isProcessing
                        ? "Processing..."
                        : isListening
                          ? "Listening Continuously"
                          : "Voice Inactive"}
                </p>
                <p className="text-xs text-slate-600">
                  {!voiceSupported
                    ? "Enable microphone permissions"
                    : isSpeaking
                      ? "Keep speaking, auto-stops on silence"
                      : isListening
                        ? "Speak anytime - hands-free mode"
                        : "Starting..."}
                </p>
              </div>
            </div>

            {/* Volume level indicator */}
            {isListening && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-100 ${
                        volumeLevel > i * 15
                          ? isSpeaking
                            ? "bg-red-500"
                            : "bg-cyan-500"
                          : "bg-slate-300"
                      }`}
                      style={{
                        height: volumeLevel > i * 15 ? `${12 + i * 4}px` : "4px",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
