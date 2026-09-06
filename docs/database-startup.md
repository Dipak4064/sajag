# Database startup

The API probes `DATABASE_URL` first (normally Neon), then `LOCAL_DATABASE_URL`
only if the primary runtime or migration connection is unavailable. Set
`DB_PRIMARY=local` or `USE_LOCAL_DB=true` to skip Neon entirely and use local
PostgreSQL. Missing `DATABASE_URL` selects local PostgreSQL directly. Each
connection has a ten-second connection timeout. During simulation, runtime
connection errors (including P2024) also switch subsequent
telemetry to local PostgreSQL. Failed readings are not replayed. Restarting tries
Neon first again; local writes are not automatically synchronized to Neon.

`DIRECT_URL` (or `DATABASE_URL_UNPOOLED`) supplies the primary migration connection.
If omitted, startup derives the direct hostname from a Neon pooled URL, or reuses
`DATABASE_URL` for other PostgreSQL hosts. Local fallback always uses its own URL
for both queries and migrations, never the Neon direct URL.

Docker Compose provisions a persistent PostgreSQL fallback and sets
`DB_PRIMARY=local`, `DATABASE_URL`, `DIRECT_URL`, and `LOCAL_DATABASE_URL` to
`postgresql://sajag:simulation@postgres:5432/sajag_simulation`.
Within Docker, `postgres` is the local database service; `localhost` refers to the
API container itself. For `npm run dev:api` or `npm run start:api` on the host,
local fallback defaults to
`postgresql://sajag:simulation@localhost:5432/sajag_simulation`; start your host
PostgreSQL or set `LOCAL_DATABASE_URL` to your local instance's connection string.
The default host URL uses `127.0.0.1` instead of `localhost` so Prisma connects
over TCP consistently in local development.

Docker enables `DB_MIGRATE_ON_START=true` to apply versioned migrations before
starting the API. Enable it explicitly for host development when needed. Connection failures during migrations (including P1001 after a successful probe)
also select local fallback. Schema/migration errors still stop startup. Legacy local volumes without migration history (P3005) use `db push --skip-generate`
without accepting data loss. Neon schema errors still stop startup. Startup never
runs `db push --accept-data-loss` or seeds the database.

For host development, start local Postgres with `docker compose up -d postgres`
and run `npm run dev:api:local`. To synchronize the local schema without starting
the API, run `npm run db:local:migrate` for versioned migrations or
`npm run db:local:push` for a development schema push.

Run `./run-sajag.sh` from the workspace to rebuild and launch all services.
Startup prints the selected database label without printing credentials. Failed
Docker startup includes recent API and PostgreSQL logs.

Regression check: `npm run build:api && node --test tests/database-startup.cjs`.

MQTT ingestion processes one reading at a time, retaining the latest pending
reading per device (up to 128 devices). Intermediate readings can be coalesced
under load. Shared ingestion allows two concurrent workflows; excess HTTP
telemetry receives 503. Municipality lookup is shared and cached for 60 seconds.
Default Prisma pool settings are connection_limit=5 and pool_timeout=15;
explicit URL values remain respected.
