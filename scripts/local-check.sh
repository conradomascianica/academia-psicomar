#!/usr/bin/env bash
set -euo pipefail
node --import tsx -e 'import("./db/load-env.ts").then(()=>{const u=new URL(process.env.DATABASE_URL||"postgres://invalid");if(process.env.PSICOMAR_LOCAL_TEST!=="1"||!["localhost","127.0.0.1"].includes(u.hostname))throw new Error("Este script requiere una base local aislada");})'
npm run db:migrate
node --import tsx db/seed.ts
npx next typegen
npx tsc --noEmit
