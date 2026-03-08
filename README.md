# fauna-dashboard

Fauna DB dashboard — run the UI, then configure your Fauna endpoint and secret in the app.

## Run with Docker (one command)

The image is published on [Docker Hub](https://hub.docker.com/r/pablopvsky/fauna-dashboard) as `pablopvsky/fauna-dashboard:latest` (public). Pull and run in the background; the container keeps running and restarts on crash or reboot:

```bash
docker run -d -p 3000:3000 --restart unless-stopped pablopvsky/fauna-dashboard:latest
```

Then open **http://localhost:3000**. Fauna credentials are set in the dashboard UI (Home / connection), not via environment variables.

- **`-d`** — run detached (background); you can close the terminal.
- **`--restart unless-stopped`** — restart the container if it exits or after a server reboot.
- To stop: `docker stop $(docker ps -q --filter ancestor=pablopvsky/fauna-dashboard:latest)`
- To view logs: `docker logs -f $(docker ps -q --filter ancestor=pablopvsky/fauna-dashboard:latest)`

## Build from source

```bash
pnpm i
pnpm build
pnpm start
```

Or build the image locally:

```bash
docker build -t fauna-dashboard .
docker run -p 3000:3000 fauna-dashboard
```
