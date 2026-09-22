import type { IncomingMessage } from "node:http";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { isRetrievalRelevant, passesMinWordRule } from "../../packages/discovery-core/src/normalize";
import { LIBRARY } from "./src/data/library";
import { TASKS } from "./src/data/tasks";
import { classifyCollectText } from "./src/lib/discoveryEngine";
import { elicit } from "./src/lib/elicit";
import { FEATURES } from "./src/lib/features";
import { converseWithLlm, llmLabel } from "./src/lib/groqConverse";
import { emptyQuery, groundQueryToClue, mergeQuery, parseMemoryClue, queryFromSimilar, type MemoryQuery } from "./src/lib/memoryQuery";
import { retrieve } from "./src/lib/retrieve";
import { LOCKED_SEGMENT } from "./src/lib/segment";
import { transcribeWithGroq } from "./src/lib/transcribe";
import { loadEnvFiles } from "../../tools/discovery-pipeline/src/load-env";

loadEnvFiles();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const discovery = path.join(root, "data", "discovery");
const collectInbox = path.join(root, "data", "collect", "inbox.json");
const phase2Dir = path.join(root, "..", "phase-2", "data");
const phase3Dir = path.join(root, "..", "phase-3", "data");
const phase4Dir = path.join(root, "..", "phase-4", "data");
const phase6Dir = path.join(root, "..", "phase-6", "data");
const phase5Dir = path.join(root, "..", "phase-5", "data");
const mvpTestInbox = path.join(root, "data", "mvp-test", "inbox.json");
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public");
const COLLECT_SOURCES = new Set(["collect", "reddit", "play_store", "app_store", "youtube", "forum"]);

async function readInbox(): Promise<Array<Record<string, unknown>>> {
  try {
    const rows = JSON.parse(await readFile(collectInbox, "utf8")) as unknown;
    return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

async function syncPublicData(): Promise<void> {
  const files = [
    "themes.json",
    "opportunity-ranking.json",
    "pipeline-stats.json",
    "normalized-reviews.json",
    "raw-reviews.json",
    "validation-results.json"
  ];
  await mkdir(path.join(publicDir, "discovery"), { recursive: true });
  for (const name of files) {
    try {
      await copyFile(path.join(discovery, name), path.join(publicDir, "discovery", name));
    } catch {
      /* artefact may not exist yet */
    }
  }
  await mkdir(path.join(publicDir, "phase2"), { recursive: true });
  for (const name of ["filled-matrix.json", "nomination.json"]) {
    try {
      await copyFile(path.join(phase2Dir, name), path.join(publicDir, "phase2", name));
    } catch {
      /* run npm run phase2:rank */
    }
  }
  await mkdir(path.join(publicDir, "phase3"), { recursive: true });
  try {
    await copyFile(path.join(phase3Dir, "phase3.json"), path.join(publicDir, "phase3", "phase3.json"));
  } catch {
    /* run npm run phase3:synthesize */
  }
  await mkdir(path.join(publicDir, "phase4"), { recursive: true });
  for (const name of ["problem-definition.json", "decision-tree.json", "segment-contract.json"]) {
    try {
      await copyFile(path.join(phase4Dir, name), path.join(publicDir, "phase4", name));
    } catch {
      /* run npm run phase4:lock */
    }
  }
  await mkdir(path.join(publicDir, "phase5"), { recursive: true });
  try {
    await copyFile(path.join(phase5Dir, "mvp.json"), path.join(publicDir, "phase5", "mvp.json"));
  } catch {
    /* run npm run phase5:setup */
  }
  await mkdir(path.join(publicDir, "phase6"), { recursive: true });
  try {
    await copyFile(path.join(phase6Dir, "phase6.json"), path.join(publicDir, "phase6", "phase6.json"));
  } catch {
    /* run npm run phase6:synthesize */
  }
}

function copyArtefacts(): Plugin {
  return {
    name: "copy-discovery-artefacts",
    async buildStart() {
      await syncPublicData();
    }
  };
}

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function sendJson(res: { setHeader: (k: string, v: string) => void; end: (b: string) => void }, body: unknown): void {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function asMemoryQuery(value: unknown): MemoryQuery {
  if (!value || typeof value !== "object") return emptyQuery();
  const raw = value as Partial<MemoryQuery>;
  return mergeQuery(emptyQuery(), {
    people: Array.isArray(raw.people) ? raw.people.filter((item) => typeof item === "string") : [],
    objects: Array.isArray(raw.objects) ? raw.objects.filter((item) => typeof item === "string") : [],
    exclusions: Array.isArray(raw.exclusions) ? raw.exclusions.filter((item) => typeof item === "string") : [],
    expansions: Array.isArray(raw.expansions) ? raw.expansions.filter((item) => typeof item === "string") : [],
    placeVibe: typeof raw.placeVibe === "string" ? raw.placeVibe : undefined,
    placeName: typeof raw.placeName === "string" ? raw.placeName : undefined,
    event: typeof raw.event === "string" ? raw.event : undefined,
    timeFuzzy: typeof raw.timeFuzzy === "string" ? raw.timeFuzzy : undefined,
    activity: typeof raw.activity === "string" ? raw.activity : undefined,
    photoKind: raw.photoKind === "screenshot" || raw.photoKind === "document" || raw.photoKind === "memory" ? raw.photoKind : undefined,
    similarPhotoId: typeof raw.similarPhotoId === "string" ? raw.similarPhotoId : undefined,
    raw: typeof raw.raw === "string" ? raw.raw : ""
  });
}

const apiEvents: Array<{ name: string; at: string; taskId?: string }> = [];
const retrieveSessions: Array<{
  at: string;
  clue: string;
  photoIds: string[];
  provider: string;
  generationMeta?: {
    provider: string;
    model?: string;
    latencyMs: number;
    resultPhotoIds: string[];
    memoryQuery?: MemoryQuery;
  };
}> = [];

function isMvpSpaPath(url: string): boolean {
  const pathName = url.split("?")[0];
  return (
    pathName === "/mvp" ||
    pathName === "/find" ||
    pathName === "/playground" ||
    pathName === "/dashboard" ||
    pathName === "/test" ||
    pathName.startsWith("/demo/task/")
  );
}

function spaMvpPaths(): Plugin {
  const rewrite = (req: IncomingMessage) => {
    const url = req.url ?? "";
    if (isMvpSpaPath(url.split("?")[0])) req.url = "/index.html";
  };
  return {
    name: "spa-mvp-paths",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    }
  };
}

function countsTowardN(session: {
  inSegment?: boolean;
  baselineAttempted?: boolean;
  mvpAttempted?: boolean;
  nextIteration?: string;
  hinted?: boolean;
  mvpOutcome?: string;
}): boolean {
  if (!session.inSegment || !session.baselineAttempted || !session.mvpAttempted) return false;
  if (!String(session.nextIteration ?? "").trim()) return false;
  if (session.hinted && session.mvpOutcome === "success") return false;
  return true;
}

async function readMvpInbox(): Promise<Array<Record<string, unknown>>> {
  try {
    const rows = JSON.parse(await readFile(mvpTestInbox, "utf8")) as unknown;
    return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

function discoveryApi(): Plugin {
  return {
    name: "discovery-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        const method = req.method ?? "GET";

        if (url === "/api/health") {
          let phase4 = { locked: false, verdict: "blocked" };
          try {
            const tree = JSON.parse(await readFile(path.join(phase4Dir, "decision-tree.json"), "utf8")) as {
              locked?: boolean;
              verdict?: string;
            };
            phase4 = { locked: Boolean(tree.locked), verdict: tree.verdict ?? "blocked" };
          } catch {
            /* run npm run phase4:lock */
          }
          sendJson(res, {
            ok: true,
            mvp: true,
            job: LOCKED_SEGMENT.job,
            node: LOCKED_SEGMENT.node,
            features: FEATURES,
            llm: llmLabel(),
            phase4,
            librarySize: LIBRARY.length
          });
          return;
        }
        if (url === "/api/phase5") {
          try {
            sendJson(res, JSON.parse(await readFile(path.join(phase5Dir, "mvp.json"), "utf8")));
          } catch {
            res.statusCode = 404;
            sendJson(res, { error: "Run npm run phase5:setup first." });
          }
          return;
        }
        if (url === "/api/segment") {
          sendJson(res, LOCKED_SEGMENT);
          return;
        }
        if (url === "/api/phase2") {
          try {
            const [matrix, nomination] = await Promise.all([
              readFile(path.join(phase2Dir, "filled-matrix.json"), "utf8"),
              readFile(path.join(phase2Dir, "nomination.json"), "utf8")
            ]);
            sendJson(res, { matrix: JSON.parse(matrix), nomination: JSON.parse(nomination) });
          } catch {
            res.statusCode = 404;
            sendJson(res, { error: "Run npm run phase2:rank first." });
          }
          return;
        }
        if (url === "/api/phase3") {
          try {
            sendJson(res, JSON.parse(await readFile(path.join(phase3Dir, "phase3.json"), "utf8")));
          } catch {
            res.statusCode = 404;
            sendJson(res, { error: "Run npm run phase3:synthesize first." });
          }
          return;
        }
        if (url === "/api/features") {
          sendJson(res, FEATURES);
          return;
        }
        if (url === "/api/tasks") {
          sendJson(res, TASKS);
          return;
        }
        if (url === "/api/library") {
          sendJson(
            res,
            LIBRARY.map((photo) => ({
              id: photo.id,
              album: photo.album,
              caption: photo.caption,
              kind: photo.kind,
              dateLabel: photo.dateLabel,
              tags: photo.tags,
              src: photo.src
            }))
          );
          return;
        }
        if (url === "/api/phase4") {
          try {
            const [definition, tree] = await Promise.all([
              readFile(path.join(phase4Dir, "problem-definition.json"), "utf8"),
              readFile(path.join(phase4Dir, "decision-tree.json"), "utf8")
            ]);
            sendJson(res, { definition: JSON.parse(definition), tree: JSON.parse(tree) });
          } catch {
            res.statusCode = 404;
            sendJson(res, { error: "Run npm run phase4:lock first." });
          }
          return;
        }
        if (url === "/api/problem-definition") {
          try {
            sendJson(res, JSON.parse(await readFile(path.join(phase4Dir, "problem-definition.json"), "utf8")));
          } catch {
            sendJson(res, {
              locked: false,
              job: "Increase successful retrieval of photos users remember but cannot precisely describe",
              hypothesis: "Memory Cue Retrieval",
              note: "Run npm run phase4:lock. In-segment n must be ≥ 5 before a lock (A-P07)."
            });
          }
          return;
        }
        if (url === "/api/discovery/status") {
          try {
            sendJson(res, JSON.parse(await readFile(path.join(discovery, "pipeline-stats.json"), "utf8")));
          } catch {
            res.statusCode = 404;
            sendJson(res, { error: "Run npm run 1d first." });
          }
          return;
        }
        if (url === "/api/dashboard") {
          const started = apiEvents.filter((event) => event.name === "task_started").length;
          const formulated = apiEvents.filter((event) => event.name === "clue_submitted").length;
          const targetInView = apiEvents.filter((event) => event.name === "target_shown").length;
          const recognized = apiEvents.filter((event) => event.name === "task_success").length;
          const refined = apiEvents.filter((event) => event.name === "refine_used").length;
          const denom = Math.max(started, 1);
          sendJson(res, {
            source: "in-memory-api",
            instrumented: true,
            events: apiEvents.length,
            funnel: {
              eligibleTasks: started,
              formulated,
              targetInView,
              recognized,
              refined
            },
            rates: {
              formulateRate: formulated / denom,
              successRate: recognized / denom
            },
            note: "UI dashboard also reads localStorage photos-mvp-events. Seed-task coverage is instrumented, not Photos telemetry."
          });
          return;
        }
        if (url === "/api/events" && method === "POST") {
          const body = await readJson(req);
          apiEvents.push({
            name: String(body.name ?? "unknown"),
            at: new Date().toISOString(),
            taskId: typeof body.taskId === "string" ? body.taskId : undefined
          });
          sendJson(res, { ok: true, count: apiEvents.length });
          return;
        }
        if (url === "/api/research/questions") {
          sendJson(res, {
            questions: [
              "What kinds of old photos do users struggle to retrieve?",
              "What information do people actually remember?",
              "What information have they forgotten?",
              "How do they formulate searches with incomplete memory?",
              "Where do search / Memories / albums break?",
              "What workarounds do they use?",
              "How do people vs place-vibe vs object vs screenshot tasks differ?",
              "What makes a result set evaluable vs overwhelming?",
              "How do they refine after a miss?",
              "Which segments struggle most?"
            ]
          });
          return;
        }
        if (url === "/api/retrieve/search" && method === "POST") {
          const body = await readJson(req);
          const clue = String(body.clue ?? "");
          let query = parseMemoryClue(clue);
          const similarPhotoId = typeof body.similarPhotoId === "string" ? body.similarPhotoId : undefined;
          const seed = similarPhotoId ? LIBRARY.find((item) => item.id === similarPhotoId) : undefined;
          if (seed) query = queryFromSimilar(seed, query);
          const task = typeof body.taskId === "string" ? TASKS.find((item) => item.id === body.taskId) : undefined;
          const target = typeof body.targetPhotoId === "string" ? body.targetPhotoId : task?.targetPhotoId;
          sendJson(res, { query, ...retrieve(query, target) });
          return;
        }
        if (url === "/api/retrieve/transcribe" && method === "POST") {
          const body = await readJson(req);
          const text = await transcribeWithGroq(String(body.audio ?? ""), String(body.mime ?? "audio/webm"));
          if (!text) {
            res.statusCode = 422;
            sendJson(res, { error: "Could not hear that." });
            return;
          }
          sendJson(res, { text });
          return;
        }
        if (url === "/api/retrieve/converse" && method === "POST") {
          const body = await readJson(req);
          const started = Date.now();
          const asked = Number(body.questionsAsked ?? 0);
          const clue = String(body.clue ?? "");
          const previous = asMemoryQuery(body.previous);
          let query = parseMemoryClue(clue, previous);
          let turn = elicit(query, asked);
          let provider = llmLabel();
          let model: string | undefined;
          const llm = await converseWithLlm(clue, query, asked);
          if (llm) {
            query = llm.query;
            turn = llm.turn;
            provider = llm.provider;
            model = llm.model;
          } else {
            provider = "rule-based";
          }
          query = groundQueryToClue(clue, query);
          const task = typeof body.taskId === "string" ? TASKS.find((item) => item.id === body.taskId) : undefined;
          const retrieved = retrieve(query, task?.targetPhotoId);
          const generationMeta = {
            provider,
            model,
            latencyMs: Date.now() - started,
            memoryQuery: query,
            resultPhotoIds: retrieved.photoIds.slice(0, 24)
          };
          retrieveSessions.push({
            at: new Date().toISOString(),
            clue,
            photoIds: retrieved.photoIds.slice(0, 24),
            provider,
            generationMeta
          });
          sendJson(res, { query, turn, provider, generationMeta, ...retrieved });
          return;
        }
        if (url === "/api/retrieve/sessions") {
          sendJson(res, { sessions: retrieveSessions.slice(-20).reverse() });
          return;
        }
        if (url === "/api/phase6" || url === "/api/metrics" || url === "/api/risks" || url === "/api/deck") {
          try {
            const payload = JSON.parse(await readFile(path.join(phase6Dir, "phase6.json"), "utf8")) as {
              report: { census: { inboxCount: number; counted: number } };
            };
            const inbox = await readMvpInbox();
            payload.report.census.inboxCount = inbox.length;
            if (url === "/api/metrics") {
              sendJson(res, { ...(payload as object), view: "metrics" });
              return;
            }
            sendJson(res, payload);
          } catch {
            res.statusCode = 404;
            sendJson(res, { error: "Run npm run phase6:synthesize first." });
          }
          return;
        }
        if (url === "/api/mvp-test" && method === "POST") {
          const body = await readJson(req);
          const session = {
            id: `t-${Date.now()}`,
            inSegment: Boolean(body.inSegment),
            taskId: String(body.taskId ?? ""),
            representative: Boolean(body.representative ?? true),
            baselineAttempted: Boolean(body.baselineAttempted),
            baselineOutcome: String(body.baselineOutcome ?? "not-attempted"),
            mvpAttempted: Boolean(body.mvpAttempted),
            mvpOutcome: String(body.mvpOutcome ?? "not-attempted"),
            unassisted: Boolean(body.unassisted),
            hinted: Boolean(body.hinted),
            nextIteration: String(body.nextIteration ?? "").trim(),
            cuesUsed: String(body.cuesUsed ?? "").trim(),
            questionsHelped: String(body.questionsHelped ?? "").trim(),
            questionsAnnoyed: String(body.questionsAnnoyed ?? "").trim(),
            timeToTarget: String(body.timeToTarget ?? "").trim(),
            source: "inbox",
            at: new Date().toISOString()
          };
          if (!session.taskId.startsWith("task-")) {
            res.statusCode = 422;
            sendJson(res, { error: "Pick a retrieval task. Preference tests do not count (A-T03)." });
            return;
          }
          const inbox = await readMvpInbox();
          inbox.unshift(session);
          await mkdir(path.dirname(mvpTestInbox), { recursive: true });
          await writeFile(mvpTestInbox, `${JSON.stringify(inbox, null, 2)}\n`, "utf8");
          sendJson(res, { ok: true, counted: countsTowardN(session), item: session, inboxCount: inbox.length });
          return;
        }
        if (url === "/api/discovery/collect" && method === "POST") {
          const body = await readJson(req);
          const text = String(body.text ?? "").replace(/\s+/g, " ").trim();
          const source = String(body.source ?? "collect");
          const urlValue = typeof body.url === "string" ? body.url.trim() : "";
          const draft = {
            id: `col-${Date.now()}`,
            text,
            source: source as "collect",
            scrapedAt: new Date().toISOString()
          };
          if (!COLLECT_SOURCES.has(source)) {
            res.statusCode = 400;
            sendJson(res, { error: "Use a public source. Interviews stay out of Phase 1 frequency." });
            return;
          }
          if (!passesMinWordRule(draft) || !isRetrievalRelevant(text)) {
            res.statusCode = 422;
            sendJson(res, { error: "Need a retrieval complaint — a remembered photo they could not find." });
            return;
          }
          const item = {
            ...draft,
            source,
            url: urlValue || undefined
          };
          const inbox = await readInbox();
          inbox.unshift(item);
          await mkdir(path.dirname(collectInbox), { recursive: true });
          await writeFile(collectInbox, `${JSON.stringify(inbox, null, 2)}\n`, "utf8");
          sendJson(res, { item, matches: classifyCollectText(text), inboxCount: inbox.length });
          return;
        }
        if (url !== "/api/discovery") return next();
        try {
          const [themes, ranking, stats, normalized, inbox] = await Promise.all([
            readFile(path.join(discovery, "themes.json"), "utf8"),
            readFile(path.join(discovery, "opportunity-ranking.json"), "utf8"),
            readFile(path.join(discovery, "pipeline-stats.json"), "utf8"),
            readFile(path.join(discovery, "normalized-reviews.json"), "utf8"),
            readInbox()
          ]);
          sendJson(res, {
            themes: JSON.parse(themes),
            ranking: JSON.parse(ranking),
            stats: JSON.parse(stats),
            voices: JSON.parse(normalized),
            inbox
          });
        } catch {
          res.statusCode = 404;
          sendJson(res, { error: "Run npm run 1d first." });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [spaMvpPaths(), react(), copyArtefacts(), discoveryApi()],
  envDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
  server: { port: 3000, host: true }
});
