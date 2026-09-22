import { groqWhisperModel } from "./groqModels";

export async function transcribeWithGroq(audioBase64: string, mime = "audio/webm"): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key || !audioBase64) return null;
  try {
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    if (bytes.length < 200 || bytes.length > 4_000_000) return null;
    const ext = mime.includes("mp4") || mime.includes("m4a") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
    const form = new FormData();
    form.append("file", new File([bytes], `memory.${ext}`, { type: mime || "audio/webm" }));
    form.append("model", groqWhisperModel());
    form.append("language", "en");
    form.append("prompt", "Photo memories: small cafe, trip, medicine, gig lights, horse, houseboat, fireworks, receipt");
    form.append("temperature", "0");
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
      body: form
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { text?: string };
    const text = payload.text?.trim();
    return text || null;
  } catch {
    return null;
  }
}
