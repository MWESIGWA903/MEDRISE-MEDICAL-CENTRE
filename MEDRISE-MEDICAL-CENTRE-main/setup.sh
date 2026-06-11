#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   MedRise Medical Centre — Setup      ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org (v20+)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# 2. Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}⚠ pnpm not found. Installing...${NC}"
  npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# 3. Check Docker (for local database)
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠ Docker not found. Start PostgreSQL manually or use a cloud DB.${NC}"
  echo -e "  Download: https://www.docker.com/products/docker-desktop"
else
  echo -e "${GREEN}✓ Docker found${NC}"
  echo -e "${YELLOW}→ Starting local PostgreSQL...${NC}"
  docker compose up -d db
  echo -e "${GREEN}✓ PostgreSQL running on localhost:5432${NC}"
fi

# 4. Set up .env file
if [ ! -f artifacts/api-server/.env ]; then
  echo ""
  echo -e "${YELLOW}→ Creating artifacts/api-server/.env from template...${NC}"
  cp artifacts/api-server/.env.example artifacts/api-server/.env
  echo -e "${GREEN}✓ .env created${NC}"
  echo -e "${YELLOW}⚠ Edit artifacts/api-server/.env and fill in your values before starting.${NC}"
else
  echo -e "${GREEN}✓ .env already exists${NC}"
fi

# 5. Set up mobile .env
if [ ! -f artifacts/medrise-mobile/.env.local ]; then
  cp artifacts/medrise-mobile/.env.local.example artifacts/medrise-mobile/.env.local
  echo -e "${GREEN}✓ Mobile .env.local created${NC}"
fi

# 6. Install dependencies
echo ""
echo -e "${YELLOW}→ Installing dependencies (this takes ~1 min first time)...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# 7. Push database schema
echo ""
echo -e "${YELLOW}→ Pushing database schema...${NC}"
cd lib/db
DATABASE_URL=$(grep DATABASE_URL ../../artifacts/api-server/.env | cut -d= -f2-) pnpm push
cd ../..
echo -e "${GREEN}✓ Database schema ready${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   Setup complete!                     ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "  Start everything:   ${YELLOW}pnpm dev:all${NC}"
echo -e "  API only:           ${YELLOW}pnpm dev:api${NC}"
echo -e "  Web dashboard only: ${YELLOW}pnpm dev:web${NC}"
echo -e "  Mobile app:         ${YELLOW}pnpm dev:mobile${NC}"
echo -e "  DB browser:         ${YELLOW}pnpm db:studio${NC}"
echo ""
echo -e "  Web dashboard → ${GREEN}http://localhost:8081${NC}"
echo -e "  API           → ${GREEN}http://localhost:8080${NC}"
echo ""
