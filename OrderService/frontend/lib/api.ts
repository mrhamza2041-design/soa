const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

const PRODUCTS_URL =
  process.env.NEXT_PUBLIC_PRODUCTS_URL ??
  "http://localhost:5001/api/Inventory/products";

const NOTIFICATIONS_URL =
  process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ??
  "http://localhost:5002/notifications";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

type RequestOptions = RequestInit & { retries?: number; retryDelayMs?: number };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const isRetriable = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: number }).status ?? 0;
    return status >= 500 || status === 429;
  }

  return true;
};

async function fetchJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    retries = 2,
    retryDelayMs = 600,
    headers,
    signal,
    ...rest
  } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
      const response = await fetch(url, {
        ...rest,
        headers: { ...JSON_HEADERS, ...headers },
        signal: signal ?? controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.text().catch(() => null);
        throw new ApiError(
          `Request failed with ${response.status}`,
          response.status,
          body,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (attempt === retries || !isRetriable(error)) {
        throw error;
      }

      await wait(retryDelayMs * (attempt + 1));
      attempt += 1;
    }
  }

  throw lastError;
}

export type Product = {
  id: number;
  name: string;
  sku: string;
  quantityAvailable: number;
  price: number;
  updatedAt: string;
};

export type OrderStatus =
  | "Created"
  | "PendingInventory"
  | "InventoryUpdated"
  | "OutOfStock"
  | "Completed"
  | "Cancelled"
  | "Failed";

export type OrderItem = {
  id: number;
  orderId: string;
  productId: number;
  quantity: number;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  failureReason?: string | null;
  items: OrderItem[];
};

export type CreateOrderPayload = {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  customer: {
    id: string;
    name: string;
    email: string;
  };
};

export type NotificationMessage = {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
};

export const api = {
  getInventory: () => fetchJson<Product[]>(PRODUCTS_URL),
  getOrders: () => fetchJson<Order[]>("/orders"),
  createOrder: (payload: CreateOrderPayload) =>
    fetchJson<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adjustInventory: (productId: number, delta: number) =>
    fetchJson<Product>(`${PRODUCTS_URL}/${productId}/adjust`, {
      method: "POST",
      body: JSON.stringify({ delta }),
    }),
  getNotifications: () =>
    fetchJson<NotificationMessage[]>(NOTIFICATIONS_URL),
};

export type { ApiError };

