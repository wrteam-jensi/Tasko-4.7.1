#!/bin/bash

# ==================================================
# 🚀 eDemand Custom Server VPS Deployment Script
# ==================================================

set -e

# --------------------------------------------------
# 🎨 Colors & Styles
# --------------------------------------------------
RESET="\033[0m"
BOLD="\033[1m"

RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"

CHECK="✅"
CROSS="❌"
INFO="ℹ️"
ROCKET="🚀"

# --------------------------------------------------
# 🧰 Helpers
# --------------------------------------------------
log() { echo -e "${BLUE}${INFO}${RESET} $1"; }
success() { echo -e "${GREEN}${CHECK}${RESET} $1"; }
warn() { echo -e "${YELLOW}⚠️${RESET} $1"; }
error() { echo -e "${RED}${CROSS}${RESET} $1"; exit 1; }

STEP=1
TOTAL=9
step() {
  echo ""
  echo -e "${BOLD}${CYAN}[$STEP/$TOTAL] $1${RESET}"
  STEP=$((STEP+1))
}

spinner() {
  local pid=$1
  local msg=$2
  local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local i=0

  while ps -p $pid >/dev/null 2>&1; do
    printf "\r${CYAN}%s${RESET} %s" "${spin:i++%${#spin}:1}" "$msg"
    sleep 0.1
  done
  printf "\r${GREEN}${CHECK}${RESET} %s\n" "$msg"
}

replace_in_file() {
  local pattern=$1
  local file=$2
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

# --------------------------------------------------
# 🚀 Start
# --------------------------------------------------
clear
echo "--------------------------------------------------"
echo -e "${BOLD}${ROCKET} eDemand VPS Deployment${RESET}"
echo "--------------------------------------------------"

# --------------------------------------------------
# 1. App Config
# --------------------------------------------------
step "App Configuration"

read -p "➜ Enter App Name (default: edemand-web): " INPUT_APP
APP_NAME=${INPUT_APP:-edemand-web}

echo ""
echo "Select Deployment Type:"
echo "1) Fresh Install"
echo "2) Update Existing"
read -p "➜ Enter choice (1 or 2): " DEPLOY_TYPE

SELECTED_PM2_APP=""

if [[ "$DEPLOY_TYPE" == "2" ]]; then
  echo ""
  echo -e "${CYAN}📋 Available PM2 Processes:${RESET}"
  pm2 ls

  echo ""
  read -p "➜ Enter PM2 App Name or ID to update: " SELECTED_PM2_APP

  if [[ -z "$SELECTED_PM2_APP" ]]; then
    error "No PM2 app selected"
  fi

  if [[ "$SELECTED_PM2_APP" =~ ^[0-9]+$ ]]; then
    APP_NAME=$(pm2 jlist | jq -r ".[$SELECTED_PM2_APP].name")
  else
    APP_NAME=$SELECTED_PM2_APP
  fi

  success "Updating app: $APP_NAME"
fi

# --------------------------------------------------
# 2. Port Config
# --------------------------------------------------
step "Port Configuration"

if [[ "$DEPLOY_TYPE" == "2" ]]; then
  CURRENT_PORT=$(pm2 env "$APP_NAME" 2>/dev/null | grep -w "PORT=" | cut -d= -f2)
  [ -z "$CURRENT_PORT" ] && CURRENT_PORT=8001
else
  CURRENT_PORT=$(grep -o "PORT: [0-9]*" ecosystem.config.cjs 2>/dev/null | grep -o "[0-9]*" | head -1)
  [ -z "$CURRENT_PORT" ] && CURRENT_PORT=8001
fi

echo -e "Current Port: ${GREEN}$CURRENT_PORT${RESET}"
read -p "➜ Enter Port (Press Enter to keep $CURRENT_PORT): " INPUT_PORT
PORT=${INPUT_PORT:-$CURRENT_PORT}

# --------------------------------------------------
# 3. Clean
# --------------------------------------------------
step "Cleaning old builds"
rm -rf .next out dist
mkdir -p logs .well-known
success "Clean complete"

# --------------------------------------------------
# 4. Install deps
# --------------------------------------------------
step "Installing dependencies"
npm install >/dev/null 2>&1 &
spinner $! "Dependencies installed"

# --------------------------------------------------
# 5. Generate assets
# --------------------------------------------------
step "Generating sitemap & service worker"

[ -f "scripts/setup-sitemap.js" ] && node scripts/setup-sitemap.js
[ -f "scripts/generate-sw.js" ] && node scripts/generate-sw.js

success "Assets generated"

# --------------------------------------------------
# 6. Build
# --------------------------------------------------
step "Building Next.js"

export NEXT_PUBLIC_ENABLE_SEO="true"
export NODE_ENV="production"

replace_in_file "s/PORT: [0-9]*/PORT: $PORT/g" ecosystem.config.cjs

npm run build >/dev/null 2>&1 &
spinner $! "Build complete"

[ ! -d ".next/standalone" ] && error "Build failed"

# --------------------------------------------------
# 7. Apache config
# --------------------------------------------------
step "Generating Apache config"

npm run generate-htaccess -- $PORT
success ".htaccess generated"

# --------------------------------------------------
# 8. PM2
# --------------------------------------------------
step "Managing PM2"

if [[ "$DEPLOY_TYPE" == "2" ]]; then
  log "Restarting existing app..."
  pm2 restart "$APP_NAME" --update-env

else
  log "Starting new app..."
  pm2 start ecosystem.config.cjs --name "$APP_NAME"
fi

pm2 save
success "PM2 done"

# --------------------------------------------------
# 9. Apache reload
# --------------------------------------------------
step "Reloading Apache"

if command -v systemctl >/dev/null; then
  sudo systemctl reload apache2 || sudo systemctl reload httpd || warn "Apache reload failed"
else
  sudo service apache2 reload || sudo service httpd reload || warn "Apache reload failed"
fi

success "Apache reloaded"

# --------------------------------------------------
# DONE
# --------------------------------------------------
echo ""
echo "=================================================="
echo -e "${GREEN}${ROCKET} DEPLOYMENT SUCCESSFUL${RESET}"
echo "=================================================="
echo -e "App Name : ${BOLD}$APP_NAME${RESET}"
echo -e "Port     : ${CYAN}$PORT${RESET}"
echo -e "URL      : ${CYAN}http://localhost:$PORT${RESET}"
echo "=================================================="

pm2 ls