const vscode = require("vscode");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const execFileAsync = promisify(execFile);

let statusBar;

async function runDoctorJson() {
  try {
    const { stdout } = await execFileAsync("fuseguard", ["doctor", "--json"], { timeout: 15_000 });
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function readDeviceIdFallback() {
  try {
    const raw = fs.readFileSync(path.join(os.homedir(), ".fuseguard", "device.json"), "utf8");
    const data = JSON.parse(raw);
    return data.deviceId || null;
  } catch {
    return null;
  }
}

async function refreshStatusBar() {
  if (!statusBar) return;
  const report = await runDoctorJson();
  if (report?.enrolled) {
    statusBar.text = `$(shield) Fuse ${report.policyBundleVersion || "—"}`;
    statusBar.tooltip = `FuseGuard enrolled · kill switch ${report.killSwitchActive ? "ON" : "off"}`;
  } else if (report?.deviceId || readDeviceIdFallback()) {
    statusBar.text = "$(shield) Fuse local";
    statusBar.tooltip = "FuseGuard device present — enroll for cloud policy";
  } else {
    statusBar.text = "$(warning) Fuse";
    statusBar.tooltip = "FuseGuard not configured — run Enroll";
  }
}

function activate(context) {
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  statusBar.command = "fuseguard.showStatus";
  statusBar.show();
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.commands.registerCommand("fuseguard.showStatus", async () => {
      const term = vscode.window.createTerminal("FuseGuard");
      term.show();
      term.sendText("fuseguard doctor");
      await refreshStatusBar();
    }),
    vscode.commands.registerCommand("fuseguard.enroll", async () => {
      const token = await vscode.window.showInputBox({
        prompt: "Paste enrollment token from DriftGuard console",
        ignoreFocusOut: true,
      });
      if (!token?.trim()) return;
      const term = vscode.window.createTerminal("FuseGuard enroll");
      term.show();
      term.sendText(`fuseguard device enroll --token ${token.trim()}`);
      vscode.window.showInformationMessage("FuseGuard: enrollment started in terminal");
    }),
  );

  refreshStatusBar();
  const interval = setInterval(() => { refreshStatusBar(); }, 60_000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

function deactivate() {
  statusBar?.dispose();
}

module.exports = { activate, deactivate };
