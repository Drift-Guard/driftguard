const vscode = require("vscode");

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("fuseguard.showStatus", () => {
      vscode.window.showInformationMessage("FuseGuard: run fuseguard doctor in terminal for local status.");
    }),
    vscode.commands.registerCommand("fuseguard.enroll", () => {
      vscode.window.showInformationMessage("FuseGuard: fuseguard device enroll --token <from-console>");
    }),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
