## Frontend Control Center

This Next.js (Pages Router) frontend exposes a responsive dashboard for the SOA e-commerce assignment. It visualizes inventory levels, creates orders, and surfaces notification updates from the backend services.

### Features

- Live inventory tiles with auto-refresh plus manual refresh and inline adjust modal for stock corrections.
- Order creation workspace that captures customer info, builds multi-line orders, and validates inputs before sending to the Order Service.
- Orders timeline based on REST polling.
- Notification inbox polling the Notification Service for sent messages.
- Built-in retry, backoff, and graceful fallbacks for transient failures.

### Prerequisites

- Node.js 18+ (Next.js 16 requires minimum Node 18.17).
- Backend services (Order, Inventory, Notification) reachable via REST.

### Environment Variables

Create `.env.local` (or configure via Docker Compose):

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5101/api` | Base URL for the REST gateway exposing `/orders`. |
| `NEXT_PUBLIC_PRODUCTS_URL` | `http://localhost:5001/api/Inventory/products` | Absolute URL for the Inventory Service product listing. |
| `NEXT_PUBLIC_NOTIFICATIONS_URL` | `http://localhost:5002/notifications` | Absolute URL for the Notification Service endpoint returning notifications. |
| `NEXT_PUBLIC_ENVIRONMENT` | `Local environment` | Label rendered in the UI header for quick context. |

### Expected Backend Endpoints

The UI calls the following routes; align your gateway/BFF accordingly (see `lib/api.ts` for exact shapes):

- `GET http://localhost:5001/api/Inventory/products` → `Product[]`
- `POST http://localhost:5001/api/Inventory/products/{productId}/adjust` (`{ "delta": number }`) → Updated `Product`
- `GET /orders` → `Order[]`
- `POST /orders { items: [{ productId, quantity }], customer: { id, name, email } }` → `Order`
- `GET http://localhost:5002/notifications` → `NotificationMessage[]`

### Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the dashboard. The page hot-reloads whenever you edit files under `pages/`, `styles/`, or `lib/`.

### Docker

```bash
docker build -t soa-frontend .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://host.docker.internal:5101/api \
  -e NEXT_PUBLIC_PRODUCTS_URL=http://host.docker.internal:5001/api/Inventory/products \
  -e NEXT_PUBLIC_NOTIFICATIONS_URL=http://host.docker.internal:5002/notifications \
  soa-frontend
```

Adjust the host/port values (or mount an env file) to match your backend services.

### Production Build

```bash
npm run build
npm start
```

Deploy via Docker Compose alongside the backend services to fulfill the assignment requirements. Document any service URLs or credentials you change so reviewers can reproduce the setup.
