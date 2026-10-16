/**
 * The pod's own page for a Markdown file, rendered the way an app shows it.
 *
 * The server (Community Solid Server) turns `.md` into HTML itself when a
 * browser asks, with no notion of a YAML header: the header becomes a rule
 * and one large bold heading holding every field. Its page also wears the
 * identity pages' stylesheet, made for login forms. This script, loaded by
 * the server's page template, fetches the same file as Markdown and
 * re-renders it with the kit's renderMarkdown and `.prose` — so a file reads
 * the same in an app and on its public link.
 *
 * Without JavaScript, or if the fetch fails, the server's rendering stays:
 * this only ever replaces a page that already works.
 *
 * Built by `npm run build:doc-view` into dist-doc-view/, then copied into the
 * provider's repo by scripts/export-doc-view.sh. Never edit the copy.
 */
import { renderMarkdown } from "../ui/markdown";
// Styles are NOT imported here: they ship as doc-view.css, which this script
// links only on a document page. The kit's core/theme style bare elements
// (h1, a, button, input), so a stylesheet linked on every page would restyle
// the login and consent forms that share the server's template.

// Beside this script, wherever the server serves it. A string replace, not
// `new URL("doc-view.css", import.meta.url)`: Vite reads that form as a
// build-time asset reference and inlines whatever file it resolves to.
const STYLESHEET = import.meta.url.replace(/doc-view\.js(?:\?.*)?$/, "doc-view.css");

// The template is shared with login, consent and account pages; those are
// never documents and must not change.
const NOT_A_DOCUMENT = /^\/\.(?:oidc|account|well-known)\//;

async function upgrade(): Promise<void> {
  const main = document.querySelector("main");
  if (!main || NOT_A_DOCUMENT.test(location.pathname) || !/\.md$/i.test(location.pathname)) return;
  const res = await fetch(location.href, { headers: { Accept: "text/markdown" }, credentials: "include" });
  if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("text/markdown")) return;
  await linkStylesheet();
  main.innerHTML = `<article class="prose">${renderMarkdown(await res.text())}</article>`;
  document.body.classList.add("doc-view");
  const h1 = main.querySelector("h1");
  if (h1?.textContent) document.title = h1.textContent;
}

function linkStylesheet(): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: STYLESHEET });
    link.onload = () => resolve();
    link.onerror = () => reject(new Error("doc-view.css did not load"));
    document.head.append(link);
  });
}

upgrade().catch(() => { /* keep the server's rendering */ });
