export type MicState = "idle" | "listening" | "transcribing";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const comma = raw.indexOf(",");
      resolve(comma >= 0 ? raw.slice(comma + 1) : raw);
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

export async function recordMemoryClip(ms = 8000): Promise<{ audio: string; mime: string } | null> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return null;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: BlobPart[] = [];
  return new Promise((resolve) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || mime });
      if (blob.size < 400) {
        resolve(null);
        return;
      }
      void blobToBase64(blob).then((audio) => resolve({ audio, mime: blob.type || mime }));
    };
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, ms);
  });
}

export async function transcribeClip(clip: { audio: string; mime: string }): Promise<string | null> {
  try {
    const res = await fetch("/api/retrieve/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clip),
      signal: AbortSignal.timeout(16_000)
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch {
    return null;
  }
}

type BrowserSpeech = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

export function listenInBrowser(): Promise<string | null> {
  const Ctor = (
    window as Window & {
      SpeechRecognition?: new () => BrowserSpeech;
      webkitSpeechRecognition?: new () => BrowserSpeech;
    }
  ).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: new () => BrowserSpeech }).webkitSpeechRecognition;
  if (!Ctor) return Promise.resolve(null);
  const rec = new Ctor();
  rec.lang = "en-IN";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    rec.onresult = (event) => {
      finish(event.results[0]?.[0]?.transcript?.trim() || null);
    };
    rec.onerror = () => finish(null);
    rec.onend = () => finish(null);
    try {
      rec.start();
    } catch {
      finish(null);
    }
  });
}
