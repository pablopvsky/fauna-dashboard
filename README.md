# fauna-dashboard

Fauna DB dashboard — run the UI, then configure your Fauna endpoint and secret in the app. This UI connects to [FaunaDB](https://github.com/fauna/faunadb) (or a compatible fork) via the Fauna API.

## Credits

- **FaunaDB** — The database this dashboard visualizes is [FaunaDB](https://github.com/fauna/faunadb), licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0). FaunaDB is copyright FaunaDB Foundation.
- This dashboard is a separate client application and is not derived from the FaunaDB server code.

## Run with Docker (one command)

The image is published on [Docker Hub](https://hub.docker.com/r/pablopvsky/fauna-dashboard) as `pablopvsky/fauna-dashboard:latest` (public). Pull and run in the background; the container keeps running and restarts on crash or reboot:

```bash
docker run -d \
  --name fauna-dashboard \
  --restart unless-stopped \
  -p 8445:3000 \
  pablopvsky/fauna-dashboard:latest
```

Then open **http://localhost:8445** (dashboard listens on 3000 inside the container; host port 8445 avoids conflicts with other services). Fauna credentials are set in the dashboard UI (Home / connection), not via environment variables.

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

## License

This project (fauna-dashboard) is provided under the terms of its LICENSE file in this repository. The FaunaDB database it connects to is licensed separately (see [Credits](#credits)).
