#!/usr/bin/env bash
set -euo pipefail

# Helper to generate trusted localhost certs using mkcert
# Usage: (from repo root) cd client && ./scripts/mkcert.sh

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${HERE}/.."
CERTDIR="${ROOT}/certs"

mkdir -p "$CERTDIR"

echo "Generating certs in $CERTDIR using mkcert..."

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. Install it first: https://github.com/FiloSottile/mkcert" >&2
  exit 1
fi

mkcert -cert-file "$CERTDIR/localhost.pem" -key-file "$CERTDIR/localhost-key.pem" localhost 127.0.0.1 ::1

echo "Done. Certificates written to $CERTDIR"
echo "Start the client: cd client && npm run dev (server will serve HTTPS when certs exist)"
