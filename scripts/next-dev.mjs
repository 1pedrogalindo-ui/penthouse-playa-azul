import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const incoming = process.argv.slice(2);
const args = ["dev"];

for (let index = 0; index < incoming.length; index += 1) {
  const argument = incoming[index];
  if (argument === "--host") {
    args.push("--hostname", incoming[index + 1]);
    index += 1;
  } else if (argument !== "--strictPort") {
    args.push(argument);
  }
}

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const child = spawn(process.execPath, [nextBin, ...args], { stdio: "inherit" });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 1));
