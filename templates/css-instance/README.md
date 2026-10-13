# CSS instance — identity pages over a stock Community Solid Server

The overlay that gives a CSS instance its own look and words without forking the
server: CSS stays a stock image, and these files are bind-mounted over its
templates. The method that uses it is [`skills/css-instance/`](../../skills/css-instance/SKILL.md);
the decision behind it, [ADR 009](../../docs/adr/009-css-instance-is-a-skin-over-stock.md).

Instance 1 is pod.nicolasdb.eu (pocpod0, `infra/css/`), where this was built.

## What is generic and what is the instance's

| | File | Who changes it |
|---|---|---|
| Structure | `css/main.css` | nobody per instance — reads only the skin's slots |
| Behaviour | `css/pod-ui.js` | nobody — theme stamp and switch, load-failure message |
| Chrome | `css/main.html.ejs` | the `INSTANCE:` lines: mark, name, footer, theme switch |
| Pages | `css/templates/identity/**` | copy only, freely; ids, names and scripts stay stock |
| Welcome | `css/welcome/index.html` | all of its words (`INSTANCE:`) |
| Look | `skins/<name>/skin.css` + `fonts/` | the instance, entirely |
| Upstream guard | `css/upstream-baseline.sha256`, `scripts/check-css-overrides.sh` | re-baselined on an image change |

`grep -rn "INSTANCE:" infra/css` in an instance lists what is left to fill in.

## Layout in an instance

```
infra/css/            ← css/ from here, plus:
  skin.css            ← skins/<name>/skin.css
  fonts/              ← skins/<name>/fonts/
  SOURCE              ← "solid-kit templates/css-instance @ <commit>"
scripts/
  check-css-overrides.sh
```

## Mounts (docker-compose.yml, under the CSS service's `volumes:`)

Everything lands under CSS's stock `templates/` folder, which CSS already serves
at `/.well-known/css/`: no `config.json` entry is needed for the skin, the
script or the fonts. A top-level path such as `/fonts/` would hide any pod
named `fonts`.

```yaml
      - ./infra/css/main.html.ejs:/community-server/templates/main.html.ejs:ro
      - ./infra/css/main.css:/community-server/templates/styles/main.css:ro
      - ./infra/css/skin.css:/community-server/templates/styles/skin.css:ro
      - ./infra/css/pod-ui.js:/community-server/templates/scripts/pod-ui.js:ro
      - ./infra/css/fonts:/community-server/templates/fonts/skin:ro
      - ./infra/css/templates/identity/oidc/consent.html.ejs:/community-server/templates/identity/oidc/consent.html.ejs:ro
      - ./infra/css/templates/identity/account/create-pod.html.ejs:/community-server/templates/identity/account/create-pod.html.ejs:ro
      - ./infra/css/templates/identity/account/resource.html.ejs:/community-server/templates/identity/account/resource.html.ejs:ro
      - ./infra/css/templates/identity/password/login.html.ejs:/community-server/templates/identity/password/login.html.ejs:ro
      - ./infra/css/templates/identity/password/register.html.ejs:/community-server/templates/identity/password/register.html.ejs:ro
      - ./infra/css/templates/identity/password/forgot.html.ejs:/community-server/templates/identity/password/forgot.html.ejs:ro
      - ./infra/css/templates/identity/password/reset.html.ejs:/community-server/templates/identity/password/reset.html.ejs:ro
```

The public `.md` page (solid-kit's doc-view, `scripts/export-doc-view.sh`) is
the one part that needs `config.json`: two `StaticAssetEntry` items for
`/doc-view.js` and `/doc-view.css` — see pocpod0's `infra/css/config.json`.

## The welcome page

It is not a template. A server set up with `initialize-intro.json` copies its
stock intro page into the root container once; from then on it is an ordinary
resource, `/data/index.html` in the data volume. Deploy ours by copying it
into the running container (pocpod0: `make vps-welcome`):

```sh
docker compose cp infra/css/welcome/index.html <css-service>:/data/index.html
```

A server set up with `static-root.json` instead serves
`templates/root/static/index.html`: mount the file there.

## Before a deploy

```sh
# in solid-kit
npm run audit -- --skin <instance>/infra/css/skin.css
templates/css-instance/test/try-local.sh <instance>/infra/css 3123
TRY_CSS_DIR=<printed dir> node templates/css-instance/test/smoke.mjs http://localhost:3123 /tmp/shots
```

`try-local.sh` runs the instance's CSS version under node with the overlay
where the mounts put it; `smoke.mjs` signs up, creates pods, goes through a
real OIDC consent, the three themes, a wrong password, an unreachable server
and 360px, and exits 1 on any failure. Then look at the screenshots: a check
passes on a page that is still ugly.

After the deploy: `scripts/check-css-overrides.sh '' https://<instance>` and the
"identity pages" section of `docs/manual-tests.md`.
