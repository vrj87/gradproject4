import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(here, "NL_GooglePhotos.html");
const pdf = path.join(here, "NL_GooglePhotos.pdf");
const chrome = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
];

function toFileUrl(filePath) {
  return `file:///${filePath.replace(/\\/g, "/")}`;
}

async function findBrowser() {
  for (const candidate of chrome) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      /* next */
    }
  }
  throw new Error("Chrome or Edge is required to print the PDF.");
}

const browser = await findBrowser();
await new Promise((resolve, reject) => {
  const child = spawn(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdf}`,
      toFileUrl(html)
    ],
    { stdio: "ignore" }
  );
  child.on("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`Browser exited ${code}`));
  });
  child.on("error", reject);
});
console.log(pdf);
