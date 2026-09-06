# Database startup

The API probes `DATABASE_URL` first (normally Neon), then `LOCAL_DATABASE_URL`
only if the primary runtime or migration connection is unavailable. Missing
`DATABASE_URL` selects local PostgreSQL directly. Each connection has a ten-second
connection timeout. The selected database stays fixed until the API restarts;
local writes are not automatically synchronized to Neon.

`DIRECT_URL` (or `DATABASE_URL_UNPOOLED`) supplies the primary migration connection.
If omitted, startup derives the direct hostname from a Neon pooled URL, or reuses
`DATABASE_URL` for other PostgreSQL hosts. Local fallback always uses its own URL
for both queries and migrations, never the Neon direct URL.

Docker Compose provisions a persistent PostgreSQL fallback and sets
`LOCAL_DATABASE_URL=postgresql://sajag:simulation@postgres:5432/sajag_simulation`.
Within Docker, `postgres` is the local database service; `localhost` refers to the
API container itself. For `npm run dev:api` or `npm run start:api` on the host,
local fallback defaults to
`postgresql://sajag:simulation@localhost:5432/sajag_simulation`; start your host
PostgreSQL or set `LOCAL_DATABASE_URL` to your local instance's connection string.

Docker enables `DB_MIGRATE_ON_START=true` to apply versioned migrations before
starting the API. Enable it explicitly for host development when needed. Connection failures during migrations (including P1001 after a successful probe)
also select local fallback. Schema/migration errors still stop startup. Legacy local volumes without migration history (P3005) use `db push --skip-generate`
without accepting data loss. Neon schema errors still stop startup. Startup never
runs `db push --accept-data-loss` or seeds the database.

Run `./run-sajag.sh` from the parent workspace to rebuild and launch all services.
Startup prints the selected database label without printing credentials. Failed
Docker startup includes recent API and PostgreSQL logs.

Regression check: `npm run build:api && node --test tests/database-startup.cjs`.
