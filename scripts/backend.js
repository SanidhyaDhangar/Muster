const { spawn } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

const backendDir = path.join(__dirname, "..", "backend");
const isWindows = process.platform === "win32";
const venvPython = path.join(
  backendDir,
  ".venv",
  isWindows ? "Scripts" : "bin",
  isWindows ? "python.exe" : "python",
);

const python = existsSync(venvPython) ? venvPython : isWindows ? "python" : "python3";

const child = spawn(python, ["-m", "uvicorn", "app.main:app", "--reload"], {
  cwd: backendDir,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
