import { loadEnvFiles } from "./load-env.js";
import { runExtract, runNormalize, runRefresh, runScrape } from "./refresh.js";

const envFiles = loadEnvFiles();
if (process.env.GROQ_API_KEY) {
  console.log(`env: Groq key loaded (${envFiles.length} file(s))`);
} else {
  console.warn("env: no GROQ_API_KEY — rule-based extraction (allowed). Add Phase-1/.env to enable Groq.");
}

const command = process.argv[2] ?? "refresh";

async function main() {
  if (command === "1a" || command === "normalize") {
    await runNormalize();
    return;
  }
  if (command === "1b" || command === "scrape") {
    await runScrape();
    return;
  }
  if (command === "1c" || command === "extract") {
    await runExtract();
    return;
  }
  if (command === "1d" || command === "refresh") {
    await runRefresh();
    return;
  }
  console.error("Usage: tsx src/cli.ts [1a|1b|1c|1d|refresh|scrape]");
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
