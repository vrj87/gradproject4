import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildMvp } from "./build";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const outDir = path.join(repo, "phase-5", "data");
const publicDir = path.join(repo, "Phase-1", "apps", "storefront", "public", "phase5");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

async function main(): Promise<void> {
  const tree = await readJson<{ verdict: string; locked: boolean; jobStatement?: string; lockedNode?: string }>(
    path.join(repo, "phase-4", "data", "decision-tree.json")
  );
  const definition = await readJson<{
    jobStatement: string;
    productOutcome: { node: string };
    locked: boolean;
    verdict: string;
  }>(path.join(repo, "phase-4", "data", "problem-definition.json"));
  const library = `${await readFile(path.join(repo, "Phase-1", "apps", "storefront", "src", "data", "library.ts"), "utf8")}
${await readFile(path.join(repo, "Phase-1", "apps", "storefront", "src", "data", "libraryMore.ts"), "utf8")}`;
  const librarySize = [...library.matchAll(/(?:id:\s*"p-|extra\("p-)/g)].length;
  const report = buildMvp({
    verdict: tree.verdict ?? definition.verdict,
    locked: Boolean(tree.locked && definition.locked),
    node: tree.lockedNode ?? definition.productOutcome.node,
    jobStatement: tree.jobStatement ?? definition.jobStatement,
    librarySize
  });
  await mkdir(outDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(path.join(outDir, "mvp.json"), json);
  await writeFile(path.join(publicDir, "mvp.json"), json);
  if (!report.complete) {
    console.error(
      `Phase 5 incomplete · ${report.gates
        .filter((gate) => !gate.pass)
        .map((gate) => gate.id)
        .join(", ")}`
    );
    process.exit(1);
  }
  console.log(
    `Phase 5 complete · ${report.verdict} · ${report.node} · library=${report.librarySize} · job locked`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
