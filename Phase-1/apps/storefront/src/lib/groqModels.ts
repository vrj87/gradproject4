export const GROQ_CHAT_TIMEOUT_MS = 12_000;

export function groqChatModels(): string[] {
  return [process.env.GROQ_MODEL, "openai/gpt-oss-120b", "openai/gpt-oss-20b"].filter(
    (id, index, all): id is string => Boolean(id) && all.indexOf(id) === index
  );
}

export function groqWhisperModel(): string {
  return process.env.GROQ_WHISPER_MODEL ?? "whisper-large-v3-turbo";
}
