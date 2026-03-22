export type VoiceRecognitionResult = {
  transcript: string;
};

export type VoiceRecognitionResultListItem = {
  isFinal: boolean;
  [index: number]: VoiceRecognitionResult;
};

export type VoiceRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<VoiceRecognitionResultListItem>;
};

export type VoiceRecognitionErrorEvent = {
  error: string;
};

export type VoiceRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: VoiceRecognitionEvent) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export type VoiceRecognitionConstructor = new () => VoiceRecognitionInstance;

export function getVoiceRecognitionConstructor(): VoiceRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const voiceWindow = window as Window & {
    SpeechRecognition?: VoiceRecognitionConstructor;
    webkitSpeechRecognition?: VoiceRecognitionConstructor;
  };

  return (
    voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition ?? null
  );
}
