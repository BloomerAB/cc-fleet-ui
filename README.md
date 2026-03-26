# CC Fleet UI

React frontend for [Claude Code Fleet](https://github.com/bloomerab/cc-fleet) -- a web interface for managing parallel Claude Code sessions across repositories.

## Prerequisites

- Node.js 22+
- [cc-fleet-manager](https://github.com/bloomerab/cc-fleet-manager) running (backend API)

## Quick Start

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` with hot module replacement.

## Backend Connection

- **Development:** Vite proxies `/api`, `/ws`, and `/auth` requests to `http://localhost:3000` (configurable in `vite.config.ts`).
- **Production:** The Docker image uses nginx to reverse-proxy these paths to the backend. The backend URL is configurable via the `BACKEND_URL` environment variable (defaults to `http://localhost:3000`).

## Build

```bash
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview the production build locally
```

## Docker

```bash
docker build -t cc-fleet-ui .
docker run -p 80:80 -e BACKEND_URL=http://fleet-manager:3000 cc-fleet-ui
```

## Related Repos

- [cc-fleet-manager](https://github.com/bloomerab/cc-fleet-manager) -- Backend API and session orchestrator
- [cc-fleet-chart](https://github.com/bloomerab/cc-fleet-chart) -- Helm chart for Kubernetes deployment

## License

[MIT](LICENSE)
