#!/bin/bash
# ===========================================
# Generate Mosquitto password file from .env
# ===========================================
# Usage: ./mosquitto/config/generate-pwfile.sh
# This script reads MOSQUITTO_USERNAME and MOSQUITTO_PASSWORD
# from the root .env file and generates the pwfile for Mosquitto.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
PWFILE="$SCRIPT_DIR/pwfile"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Source the .env file
set -a
source "$ENV_FILE"
set +a

if [ -z "${MOSQUITTO_USERNAME:-}" ] || [ -z "${MOSQUITTO_PASSWORD:-}" ]; then
  echo "Error: MOSQUITTO_USERNAME and MOSQUITTO_PASSWORD must be set in .env"
  exit 1
fi

# Create password file using the mosquitto_passwd utility inside the container
echo "Generating Mosquitto password file..."
docker run --rm -v "$SCRIPT_DIR:/mosquitto/config" eclipse-mosquitto:latest \
  mosquitto_passwd -b -c /mosquitto/config/pwfile "$MOSQUITTO_USERNAME" "$MOSQUITTO_PASSWORD"

echo "Password file generated at $PWFILE"
echo "User: $MOSQUITTO_USERNAME"
