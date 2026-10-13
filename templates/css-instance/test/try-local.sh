#!/usr/bin/env bash
# Serve an instance's identity pages from a real Community Solid Server, locally,
# with the overlay placed exactly where the compose bind mounts put it. No
# container needed: CSS runs under node from a throwaway install.
#
#   templates/css-instance/test/try-local.sh <instance infra/css dir> [port]
#   then: node templates/css-instance/test/smoke.mjs http://localhost:<port> <shots dir>
#
# Why this exists: on instance 1 it caught a submit that stayed disabled, a
# missing gap and a double message before deploy. A mockup cannot show any of
# those; only the server's own scripts running on our markup can.
#
# The data folder is fresh each run (accounts and pods are throwaway). Stop the
# server with the PID it prints. CSS_VERSION defaults to the one the overrides
# were baselined against (upstream-baseline.sha256).
set -euo pipefail

src="$(cd "${1:?usage: $0 <instance infra/css dir> [port]}" && pwd)"
port="${2:-3123}"
baseline="$src/upstream-baseline.sha256"
version="${CSS_VERSION:-$(sed -n 's/^# image: .*community-server:\(.*\)$/\1/p' "$baseline")}"
version="${version:-7.2.0}"
work="${TRY_CSS_DIR:-${TMPDIR:-/tmp}/try-css-$version}"

if [ ! -d "$work/node_modules/@solid/community-server" ]; then
  echo "installing @solid/community-server@$version in $work (once)"
  mkdir -p "$work"
  (cd "$work" && npm init -y >/dev/null && npm install --silent --no-audit --no-fund "@solid/community-server@$version")
fi
# smoke.mjs drives a browser; it resolves playwright from this folder (TRY_CSS_DIR).
if [ ! -d "$work/node_modules/playwright" ]; then
  (cd "$work" && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="${PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:-1}" npm install --silent --no-audit --no-fund playwright@1)
fi

# Fresh stock templates every run, then the overlay on top — what the mounts do.
tpl="$work/node_modules/@solid/community-server/templates"
if [ ! -d "$work/stock-templates" ]; then cp -r "$tpl" "$work/stock-templates"; fi
rm -rf "$tpl" && cp -r "$work/stock-templates" "$tpl"

cp "$src/main.html.ejs" "$tpl/main.html.ejs"
cp "$src/main.css" "$tpl/styles/main.css"
cp "$src/skin.css" "$tpl/styles/skin.css"
cp "$src/pod-ui.js" "$tpl/scripts/pod-ui.js"
mkdir -p "$tpl/fonts/skin" && cp "$src"/fonts/*.woff2 "$tpl/fonts/skin/"
(cd "$src/templates" && find . -name '*.ejs' -o -name '*.hbs') | while read -r f; do
  mkdir -p "$tpl/$(dirname "$f")" && cp "$src/templates/$f" "$tpl/$f"
done

data="$work/data-$port"
rm -rf "$data" && mkdir -p "$data"
# The welcome page. On a server set up with initialize-intro.json (pocpod0) it is
# a stored resource, /data/index.html; the stock file.json used here serves
# templates/root/static/index.html instead. Put it in both places.
if [ -f "$src/welcome/index.html" ]; then
  cp "$src/welcome/index.html" "$data/index.html"
  cp "$src/welcome/index.html" "$tpl/root/static/index.html"
fi
log="$work/server-$port.log"
# node directly, not npx: the PID printed below is then the server itself.
node "$work/node_modules/@solid/community-server/bin/server.js" -p "$port" -f "$data" \
  -c @css:config/file.json -b "http://localhost:$port/" >"$log" 2>&1 &
pid=$!

for _ in $(seq 1 60); do
  curl -fs -o /dev/null "http://localhost:$port/.account/login/password/" && break
  sleep 1
done
curl -fs -o /dev/null "http://localhost:$port/.account/login/password/" \
  || { echo "server did not start; see $log"; kill "$pid" 2>/dev/null; exit 1; }


echo "CSS $version with $src on http://localhost:$port/ (pid $pid, log $log)"
echo "next: TRY_CSS_DIR=$work node $(cd "$(dirname "$0")" && pwd)/smoke.mjs http://localhost:$port <screenshots dir>"
