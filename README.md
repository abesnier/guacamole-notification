# Guacamole Notifications Extension (Starter)

This project is a starter scaffold for an Apache Guacamole extension that lets administrators broadcast notification messages to connected users.

## Included in this starter

- Maven Java extension project structure
- `guac-manifest.json` extension manifest
- Frontend resources (`notify-admin.html`, `notify.js`, `notify.css`)
- Backend REST resource skeleton and in-memory store
- Admin page UI flow for:
  - send to all connected users
  - send to selected connected users

## Current status

This scaffold is intentionally minimal and safe to extend. It compiles as a starter, but production deployment requires wiring into your Guacamole authentication provider/session model and hardening auth checks.

## Build

```powershell
mvn -q -DskipTests package
```

## Deploy (manual)

Copy the generated JAR from `target/` into your `GUACAMOLE_HOME/extensions/` directory and restart Guacamole.

## Next implementation steps

1. Replace `AdminAuthorizer` with your real Guacamole permission checks.
2. Populate connected users from Guacamole active sessions.
3. Persist notifications and deliveries in shared storage for clustered nodes.
4. Add audit logging and rate limits for admin broadcasts.
