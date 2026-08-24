#!/usr/bin/env node
/**
 * Send a cold networking email via Outlook (COM automation).
 *
 * Usage:
 *   node send_networking_email.js \
 *     --to "analyst@blackstone.com" \
 *     --name "Alain" \
 *     --firm "Warburg Pincus" \
 *     --hook "Their growth equity focus and global reach across emerging markets is exactly where I want to develop."
 *
 * Or interactive (no args):
 *   node send_networking_email.js
 */

const { execSync } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const os = require("os");

const FROM_EMAIL = "dkudryavtseva@crimson.ua.edu";

const DAN = {
  signoff: "Dan",
  school: "Alabama",
  year: "sophomore",
  camsLine: "selected as 1 of 3 freshman (out of 750 applicants) for our Asset Management Society",
  internship: "interning with Cresset Capital this summer",
};

function buildEmail(firstName, firmName, firmHook) {
  return (
    "Hi " + firstName + ",\n\n" +
    "I'll be direct. I've been building my recruiting list around a small group of firms and " +
    firmName + " is one of them. " + firmHook + "\n\n" +
    "I'm a " + DAN.year + " at " + DAN.school + ", " + DAN.camsLine + ", " +
    DAN.internship + ". I'd love 10 minutes. Happy to share my resume beforehand and keep the conversation focused.\n\n" +
    "Roll Tide,\n" +
    DAN.signoff + "."
  );
}

function sendViaOutlook(to, subject, body) {
  const esc = (s) => s.replace(/'/g, "''");

  // Build PS1 without template literals so $ signs are preserved exactly
  const lines = [
    "$ol = New-Object -ComObject Outlook.Application",
    "$mail = $ol.CreateItem(0)",
    "$mail.To = '" + esc(to) + "'",
    "$mail.Subject = '" + esc(subject) + "'",
    "$mail.Body = '" + esc(body) + "'",
    "$accounts = $ol.Session.Accounts",
    "foreach ($acc in $accounts) {",
    "  if ($acc.SmtpAddress -eq '" + FROM_EMAIL + "') {",
    "    $mail.SendUsingAccount = $acc",
    "    break",
    "  }",
    "}",
    "$mail.Send()",
    "Write-Host 'Sent.'",
  ];

  const ps1 = lines.join("\r\n");
  const tmpFile = os.tmpdir() + "\\send_email_" + Date.now() + ".ps1";
  fs.writeFileSync(tmpFile, ps1, "utf8");

  try {
    const out = execSync(
      'powershell.exe -NonInteractive -ExecutionPolicy Bypass -File "' + tmpFile + '"',
      { encoding: "utf8", timeout: 30000 }
    );
    console.log(out.trim());
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };

  let to = get("--to");
  let firstName = get("--name");
  let firm = get("--firm");
  let hook = get("--hook");

  if (!to || !firstName || !firm || !hook) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    to = to || (await prompt(rl, "To email: "));
    firstName = firstName || (await prompt(rl, "First name: "));
    firm = firm || (await prompt(rl, "Firm name: "));
    hook = hook || (await prompt(rl, "Firm-specific hook: "));
    rl.close();
  }

  const body = buildEmail(firstName, firm, hook);
  const subject = DAN.school + " Student — 10 Minutes";

  console.log("\n--- PREVIEW ---");
  console.log("From:", FROM_EMAIL);
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("");
  console.log(body);
  console.log("---------------\n");

  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await prompt(rl2, "Send? (y/n): ");
  rl2.close();

  if (confirm.trim().toLowerCase() === "y") {
    sendViaOutlook(to, subject, body);
    console.log("Sent to", firstName, "at", firm + ".");
  } else {
    console.log("Cancelled.");
  }
}

main().catch(console.error);
