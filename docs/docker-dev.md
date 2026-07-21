# QuillaMap Docker Development

This development compose file runs the local frontend and sibling backend in containers while reusing the OSRM containers already running on the Windows host.

## Services

- Backend API: `http://192.168.1.26:3000/api`
- Frontend web: `http://192.168.1.26:8082`
- OSRM driving from backend container: `http://host.docker.internal:5000`
- OSRM walking from backend container: `http://host.docker.internal:5001`

## Requirements

- Docker Desktop running.
- Existing OSRM driving container listening on host port `5000`.
- Existing OSRM walking container listening on host port `5001`.
- Backend env file at `C:\dev\quillamap-backend\.env`.
- Frontend env file may keep `EXPO_PUBLIC_API_URL=http://192.168.1.26:3000/api`.

Do not put provider API keys in frontend env files. The backend reads its own `.env` through `env_file`.

## Commands

From `C:\dev\quillamap-frontend`:

```powershell
npm.cmd run docker:dev
```

Start in the background:

```powershell
npm.cmd run docker:dev:up
```

Stop containers:

```powershell
npm.cmd run docker:dev:down
```

Follow logs:

```powershell
npm.cmd run docker:dev:logs
```

Run only one service when needed:

```powershell
docker compose --env-file docker-compose.dev.env -f docker-compose.dev.yml up backend
docker compose --env-file docker-compose.dev.env -f docker-compose.dev.yml up frontend
```

If you run Docker Compose directly, include the Compose env file so Docker does not try to parse the Expo `.env` file:

```powershell
docker compose --env-file docker-compose.dev.env -f docker-compose.dev.yml up
```

## Notes

The compose file uses named Docker volumes for `node_modules`, so Linux container dependencies do not overwrite Windows host dependencies. The first run installs dependencies inside those volumes and can take a few minutes.
