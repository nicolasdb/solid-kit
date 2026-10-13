// Drives a CSS instance's identity pages in a real browser and checks what a
// mockup cannot: that the server's own scripts still work on our markup.
//
//   node smoke.mjs http://localhost:3123 <screenshots dir>
//
// Run it against try-local.sh (a fresh data folder: it creates an account and
// pods) — never against a live server. Exits 1 with the list of what failed;
// the screenshots are for a person to look at either way.
//
// `playwright` is resolved from the try-local.sh install folder (TRY_CSS_DIR),
// which installs it next to CSS. A browser comes from PLAYWRIGHT_BROWSERS_PATH,
// or CHROMIUM_PATH if set.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import crypto from "node:crypto";

const base = (process.argv[2] || "http://localhost:3123").replace(/\/$/, "");
const out = process.argv[3] || "smoke-shots";
mkdirSync(out, { recursive: true });
const require = createRequire(`${process.env.TRY_CSS_DIR || process.cwd()}/`);
const { chromium } = require("playwright");

const failures = [];
const check = (ok, what) => { if (!ok) failures.push(what); console.log(`${ok ? "  ok  " : "  FAIL"} ${what}`); };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await desk.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
const shot = (p, name) => p.screenshot({ path: `${out}/${name}.png`, fullPage: true });
const submitReady = (p) => p.waitForFunction(() => { const b = document.querySelector("button[type=submit]"); return b && !b.disabled; });
const email = `smoke-${Date.now()}@example.org`;
const password = "smoke-pass-123";

// Sign up -> account
await page.goto(`${base}/.account/login/password/register/`);
await submitReady(page);
await shot(page, "01-register");
await page.fill("#email", email);
await page.fill("#password", password);
await page.fill("#confirmPassword", password);
await page.click("button[type=submit]");
await page.waitForURL(/\/\.account\/account\//);

// Two pods, so consent has a choice to make. The address preview on the way.
for (const name of ["Atelier", "nicolas"]) {
  await page.waitForFunction(() => document.getElementById("createPod")?.getAttribute("href"));
  await page.click("#createPod");
  await submitReady(page);
  await page.fill("#name", name);
  const preview = await page.textContent("#podUrlPreview");
  check(preview?.endsWith(`/${name.toLowerCase()}/`), `create pod: the address preview reads …/${name.toLowerCase()}/ (got "${preview}")`);
  if (name === "Atelier") await shot(page, "02-create-pod");
  await page.click("button[type=submit]");
  await page.waitForSelector("#response:not(.hidden)");
  await page.click("#response-account-link");
}
await page.waitForFunction(() => document.querySelectorAll("#podEntries li").length >= 2);
await shot(page, "03-account");

// Theme: chosen, stamped, kept across a reload
await page.click("[data-theme-set=dark]");
await page.reload();
await page.waitForLoadState("domcontentloaded");
check((await page.evaluate(() => document.documentElement.dataset.theme)) === "dark", "theme: Dark survives a reload");
check((await page.getAttribute("[data-theme-set=dark]", "aria-pressed")) === "true", "theme: the switch shows Dark pressed");
await shot(page, "04-account-dark");
await page.click("[data-theme-set=contrast]");
await shot(page, "05-account-contrast");
await page.click("[data-theme-set=light]");

// Consent through a real OIDC flow
const reg = await (await fetch(`${base}/.oidc/reg`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ client_name: "Smoke test app", redirect_uris: ["http://localhost:9/cb"], grant_types: ["authorization_code"], response_types: ["code"], token_endpoint_auth_method: "none" }),
})).json();
const challenge = crypto.createHash("sha256").update(crypto.randomBytes(32).toString("base64url")).digest("base64url");
const auth = `${base}/.oidc/auth?client_id=${encodeURIComponent(reg.client_id)}&redirect_uri=${encodeURIComponent("http://localhost:9/cb")}` +
  `&response_type=code&scope=openid%20webid&code_challenge=${challenge}&code_challenge_method=S256&state=s&prompt=consent`;
const toConsent = async (p) => {
  await p.goto(auth);
  await p.waitForURL(/consent/, { timeout: 15000 });
  await p.waitForFunction(() => document.querySelectorAll("#webIdList input").length > 0);
};
await toConsent(page);
await page.waitForTimeout(300);
await shot(page, "06-consent");
const rows = await page.$$eval("#webIdList label", (ls) => ls.map((l) => ({ key: l.querySelectorAll(".webid-key").length, value: l.querySelector("input").value })));
check(rows.length >= 2, `consent: lists the account's WebIDs (${rows.length})`);
check(rows.every((r) => r.key >= 2), "consent: every WebID shows its pod and document as key parts");
check((await page.evaluate(() => document.activeElement?.tagName)) === "H1", "consent: focus starts on the heading");
check(!(await page.$eval("#client", (dl) => dl.innerHTML.includes("<script"))), "consent: client info is text");
const chosen = rows[rows.length - 1].value;
await page.check(`#webIdList input[value="${chosen}"]`);
await Promise.all([page.waitForURL(/localhost:9\//, { timeout: 15000 }).catch(() => {}), page.click("#authorize")]);
const again = await desk.newPage();
await toConsent(again);
check((await again.$eval("#webIdList input:checked", (i) => i.value).catch(() => null)) === chosen, "consent: the last WebID chosen is pre-selected");

// Log in: a wrong password, then a server that never answers
const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const login = await fresh.newPage();
login.on("pageerror", (e) => pageErrors.push(e.message));
await login.goto(`${base}/.account/login/password/`);
await submitReady(login);
await login.fill("#email", email);
await login.fill("#password", "not-the-password");
await login.click("button[type=submit]");
await login.waitForFunction(() => document.getElementById("error")?.textContent.trim());
check(true, "log in: a wrong password shows the server's message");
await shot(login, "07-login-error");
const cut = await fresh.newPage();
await cut.route("**/.account/", (r) => r.abort());
await cut.goto(`${base}/.account/login/password/`);
const reached = await cut.waitForFunction(() => document.getElementById("error")?.textContent.trim(), null, { timeout: 15000 }).then(() => true, () => false);
check(reached, "log in: when the server never answers, #error says so");
await shot(cut, "08-login-unreachable");

// 360px: no sideways scroll on the two densest pages
const phone = await browser.newContext({ viewport: { width: 360, height: 780 }, storageState: await desk.storageState() });
const p360 = await phone.newPage();
await p360.goto(`${base}/.account/login/password/`);
await p360.waitForLoadState("networkidle");
check(!(await p360.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "360px: log in has no sideways scroll");
await shot(p360, "09-login-360");
await toConsent(p360);
check(!(await p360.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "360px: consent has no sideways scroll");
await shot(p360, "10-consent-360");

// Welcome page and forgot password
const w = await fresh.newPage();
await w.goto(`${base}/`);
check(/skin\.css/.test(await w.content()), "welcome: the root page is ours (links skin.css)");
await shot(w, "11-welcome");
await w.goto(`${base}/.account/login/password/forgot/`);
await submitReady(w);
await shot(w, "12-forgot");

check(pageErrors.length === 0, `no script errors in the pages${pageErrors.length ? `: ${pageErrors.join(" | ")}` : ""}`);
await browser.close();

console.log(failures.length ? `\n${failures.length} check(s) failed. Screenshots: ${out}/` : `\nsmoke: all checks passed. Screenshots: ${out}/`);
process.exit(failures.length ? 1 : 0);
