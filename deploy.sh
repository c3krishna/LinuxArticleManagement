#!/usr/bin/env bash
# Deploys the current main branch. Run on the server, as root, from anywhere:
#   /var/www/LinuxArticleManagement/deploy.sh
# The site is served straight from this checkout: nginx serves linux-frontend/build and
# pm2 runs linux-api (see ecosystem.config.js). Secrets stay in linux-api/.env (not in git).
set -euo pipefail

cd "$(dirname "$(readlink -f "$0")")"

if [ ! -f linux-api/.env ]; then
    echo "linux-api/.env is missing; copy linux-api/.env.example and fill it in first." >&2
    exit 1
fi

echo "==> Updating code"
git pull --ff-only

echo "==> API dependencies"
(cd linux-api && npm ci --omit=dev --no-audit --no-fund)

echo "==> Building the site"
# Build next to the live folder and swap it in, so visitors never hit a half-written build.
(cd linux-frontend && npm ci --no-audit --no-fund && BUILD_PATH=build.new npm run build)
rm -rf linux-frontend/build.old
[ -d linux-frontend/build ] && mv linux-frontend/build linux-frontend/build.old
mv linux-frontend/build.new linux-frontend/build
rm -rf linux-frontend/build.old

echo "==> Restarting the API"
pm2 startOrReload ecosystem.config.js --update-env >/dev/null
pm2 save >/dev/null
pm2 describe linux | grep -E "status|exec cwd"

echo "==> Done: $(git log --oneline -1)"
