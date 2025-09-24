#!/bin/sh
set -e

if [ -z "${DATABASE_URL}" ]; then
  echo "Error: DATABASE_URL environment variable is not set."
  echo "  Please provide a valid database connection string."
  exit 1
fi

echo "Running Prisma migrations for @binglow/prisma-integration..."

pnpm --filter @binglow/prisma-integration prisma:deploy

echo "Migrations applied successfully."
