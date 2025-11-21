import Head from "next/head";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import {
  api,
  type NotificationMessage,
  type Order,
  type OrderStatus,
  type Product,
} from "@/lib/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const INVENTORY_REFRESH_MS = 15_000;
const ORDER_REFRESH_MS = 12_000;
const NOTIFICATIONS_REFRESH_MS = 5_000;

const statusClassMap: Record<OrderStatus, string> = {
  Created: styles.statusCreated,
  PendingInventory: styles.statusPendingInventory,
  InventoryUpdated: styles.statusInventoryUpdated,
  OutOfStock: styles.statusOutOfStock,
  Completed: styles.statusCompleted,
  Cancelled: styles.statusCancelled,
  Failed: styles.statusFailed,
};

type DraftOrderItem = {
  id: string;
  productId: number;
  quantity: number;
};

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const createCustomerId = () =>
  `CUST-${Math.floor(100 + Math.random() * 900)}`;

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${date.toLocaleDateString()}`;
};

const toMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error. Please try again.";
};

export default function Home() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryUpdatedAt, setInventoryUpdatedAt] = useState<string | null>(
    null,
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersUpdatedAt, setOrdersUpdatedAt] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(
    () => new Set(),
  );

  const [customerId, setCustomerId] = useState<string>(createCustomerId);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);
  const [lineProductId, setLineProductId] = useState<string>("");
  const [lineQuantity, setLineQuantity] = useState(1);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const [notifications, setNotifications] = useState<NotificationMessage[]>(
    [],
  );
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );
  const [notificationsUpdatedAt, setNotificationsUpdatedAt] = useState<
    string | null
  >(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(1);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const loadInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const response = await api.getInventory();
      setInventory(response);
      setInventoryError(null);
      setInventoryUpdatedAt(new Date().toISOString());
      setLineProductId(
        (prev) => prev || (response[0] ? String(response[0].id) : ""),
      );
    } catch (error) {
      setInventoryError(toMessage(error));
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const response = await api.getOrders();
      const normalized = response
        .map((order) => ({
          ...order,
          items: order.items ?? [],
        }))
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      setOrders(normalized);
      setOrdersError(null);
      setOrdersUpdatedAt(new Date().toISOString());
    } catch (error) {
      setOrdersError(toMessage(error));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const result = await api.getNotifications();
      // Sort latest first
      result.sort(
        (a, b) =>
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      );
      setNotifications(result);
      setNotificationsError(null);
      setNotificationsUpdatedAt(new Date().toISOString());
    } catch (error) {
      setNotificationsError(toMessage(error));
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
    const intervalId = setInterval(loadInventory, INVENTORY_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [loadInventory]);

  useEffect(() => {
    loadOrders();
    const intervalId = setInterval(loadOrders, ORDER_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [loadOrders]);

  useEffect(() => {
    loadNotifications();
    const intervalId = setInterval(
      loadNotifications,
      NOTIFICATIONS_REFRESH_MS,
    );
    return () => clearInterval(intervalId);
  }, [loadNotifications]);

  const metrics = useMemo(() => {
    const totalStock = inventory.reduce(
      (acc, item) => acc + item.quantityAvailable,
      0,
    );
    const pending = orders.filter((order) =>
      ["Created", "PendingInventory"].includes(order.status),
    ).length;
    const fulfilled = orders.filter((order) =>
      ["InventoryUpdated", "Completed"].includes(order.status),
    ).length;
    const outOfStock = orders.filter(
      (order) => order.status === "OutOfStock",
    ).length;

    return [
      {
        label: "Available Units",
        value: totalStock,
        subtext: "Across all products",
      },
      {
        label: "Orders In Flight",
        value: pending,
        subtext: "Awaiting inventory",
      },
      {
        label: "Fulfilled Today",
        value: fulfilled,
        subtext: "Cleared by inventory",
      },
      {
        label: "Out of Stock",
        value: outOfStock,
        subtext: "Need attention",
      },
    ];
  }, [inventory, orders]);

  const productLookup = useMemo(() => {
    const map = new Map<number, Product>();
    inventory.forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [inventory]);

  const selectedLineProduct = useMemo(
    () => inventory.find((product) => String(product.id) === lineProductId),
    [inventory, lineProductId],
  );

  const maxQuantity = selectedLineProduct?.quantityAvailable ?? 0;

  const regenerateCustomerId = () => {
    setCustomerId(createCustomerId());
  };

  const handleAddItem = () => {
    if (!lineProductId) {
      setOrderError("Select a product before adding it to the order.");
      return;
    }

    if (!selectedLineProduct) {
      setOrderError("Selected product is no longer available.");
      return;
    }

    if (lineQuantity <= 0) {
      setOrderError("Quantity must be at least 1.");
      return;
    }

    if (lineQuantity > selectedLineProduct.quantityAvailable) {
      setOrderError(
        `Only ${selectedLineProduct.quantityAvailable} units available for ${selectedLineProduct.name}.`,
      );
      return;
    }

    setOrderError(null);
    setDraftItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === selectedLineProduct.id,
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const nextQuantity = Math.min(
          selectedLineProduct.quantityAvailable,
          existing.quantity + lineQuantity,
        );
        updated[existingIndex] = { ...existing, quantity: nextQuantity };
        return updated;
      }

      return [
        ...prev,
        {
          id: `${selectedLineProduct.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          productId: selectedLineProduct.id,
          quantity: lineQuantity,
        },
      ];
    });
    setLineQuantity(1);
  };

  const handleRemoveItem = (draftId: string) => {
    setDraftItems((prev) => prev.filter((item) => item.id !== draftId));
  };

  const openAdjustModal = (product: Product) => {
    setAdjustProduct(product);
    setAdjustDelta(1);
    setAdjustError(null);
  };

  const handleInventoryKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    product: Product,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAdjustModal(product);
    }
  };

  const closeAdjustModal = () => {
    if (adjustSubmitting) {
      return;
    }
    setAdjustProduct(null);
    setAdjustDelta(1);
    setAdjustError(null);
  };

  const handleAdjustSave = async () => {
    if (!adjustProduct) {
      return;
    }

    if (!Number.isFinite(adjustDelta) || adjustDelta === 0) {
      setAdjustError("Enter a non-zero quantity delta.");
      return;
    }

    setAdjustSubmitting(true);
    setAdjustError(null);
    try {
      await api.adjustInventory(adjustProduct.id, adjustDelta);
      await loadInventory();

      setAdjustProduct(null);
      setAdjustDelta(1);
    } catch (error) {
      setAdjustError(toMessage(error));
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customerName.trim()) {
      setOrderError("Customer name is required.");
      return;
    }

    if (!customerEmail.trim() || !isValidEmail(customerEmail)) {
      setOrderError("A valid customer email is required.");
      return;
    }

    if (draftItems.length === 0) {
      setOrderError("Add at least one product to the order.");
      return;
    }

    setOrderSubmitting(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      const payload = {
        items: draftItems.map((item) => ({
          productId: String(item.productId),
          quantity: item.quantity,
        })),
        customer: {
          id: customerId,
          name: customerName.trim(),
          email: customerEmail.trim(),
        },
      };

      const order = await api.createOrder(payload);

      const normalizedOrder = {
        ...order,
        items: order.items ?? [],
      };
      setOrders((prev) => [normalizedOrder, ...prev]);
      setOrderSuccess(`Order ${order.id} created for ${customerName.trim()}`);
      setDraftItems([]);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerId(createCustomerId());
      setLineQuantity(1);
      setLineProductId(
        inventory[0] ? String(inventory[0].id) : lineProductId || "",
      );
    } catch (error) {
      setOrderError(toMessage(error));
    } finally {
      setOrderSubmitting(false);
    }
  };

  const isSaveDisabled =
    orderSubmitting ||
    !customerName.trim() ||
    !isValidEmail(customerEmail) ||
    draftItems.length === 0;

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  return (
    <>
      <Head>
        <title>Order Control Center</title>
        <meta
          name="description"
          content="SOA commerce console for inventory, orders, and notifications"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <div className={styles.shell}>
          <header className={styles.header}>
            <div>
              <p>Service-Oriented Commerce Console</p>
              <small>
                Tracking orders, inventory, and notifications across services
              </small>
            </div>
            <span className={styles.pill}>
              {process.env.NEXT_PUBLIC_ENVIRONMENT ?? "Local environment"}
            </span>
          </header>

          <section className={`${styles.grid} ${styles.gridThree}`}>
            {metrics.map((metric) => (
              <article key={metric.label} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong>{metric.label}</strong>
                  <span>{metric.subtext}</span>
                </div>
                <h2>{metric.value}</h2>
              </article>
            ))}
          </section>

          <section className={`${styles.grid} ${styles.gridTwo}`}>
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <strong>Inventory</strong>
                  <span>Live stock levels</span>
                </div>
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={loadInventory}
                    disabled={inventoryLoading}
                  >
                    Refresh
                  </button>
                  <p className={styles.lastUpdated}>
                    {inventoryUpdatedAt ? `Updated ${formatTimestamp(inventoryUpdatedAt)}` : "Pending update"}
                  </p>
                </div>
              </div>
              {inventoryError && (
                <p className={styles.error}>{inventoryError}</p>
              )}
              <div className={styles.inventoryGrid}>
                {inventoryLoading && (
                  <div className={styles.emptyState}>Loading inventory…</div>
                )}
                {!inventoryLoading && inventory.length === 0 && (
                  <div className={styles.emptyState}>
                    No products available yet.
                  </div>
                )}
                {inventory.map((product) => (
                  <div
                    key={product.id}
                    className={styles.inventoryItem}
                    role="button"
                    tabIndex={0}
                    onClick={() => openAdjustModal(product)}
                    onKeyDown={(event) =>
                      handleInventoryKeyDown(event, product)
                    }
                  >
                    <header>{product.name}</header>
                    <div className={styles.stockRow}>
                      <span>SKU</span>
                      <strong>{product.sku}</strong>
                    </div>
                    <div className={styles.stockRow}>
                      <span>Available</span>
                      <strong>{product.quantityAvailable}</strong>
                    </div>
                    <div className={styles.stockRow}>
                      <span>Price</span>
                      <strong>{currencyFormatter.format(product.price)}</strong>
                    </div>
                    <div className={styles.stockRow}>
                      <span>Updated</span>
                      <strong>{formatTimestamp(product.updatedAt)}</strong>
                    </div>
                    <p className={styles.inventoryHint}>Click to adjust stock</p>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <strong>Notifications</strong>
                  <span>Inventory + order events</span>
                </div>
                <p className={styles.lastUpdated}>
                  {notificationsUpdatedAt
                    ? `Updated ${formatTimestamp(notificationsUpdatedAt)}`
                    : "Polling every 5s"}
                </p>
              </div>
              <div className={styles.notifications}>
                {notificationsError && (
                  <p className={styles.error}>{notificationsError}</p>
                )}
                {notificationsLoading && (
                  <div className={styles.emptyState}>
                    Loading notifications…
                  </div>
                )}
                {!notificationsLoading && notifications.length === 0 && (
                  <div className={styles.emptyState}>
                    No notifications have been sent yet.
                  </div>
                )}
                {notifications.map((notification, index) => (
                  <div
                    key={`${notification.id}-${notification.sentAt ?? index}`}
                    className={styles.notificationItem}
                  >
                    <strong>{notification.subject}</strong>
                    <p>
                      {notification.body || "Order updated notification"}
                    </p>
                    <span>{formatTimestamp(notification.sentAt)}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className={`${styles.grid} ${styles.gridTwo}`}>
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <strong>Create Order</strong>
                  <span>Send request to Order Service</span>
                </div>
              </div>
              <form className={styles.form} onSubmit={handleCreateOrder}>
                <div className={styles.formRow}>
                  <div className={styles.formControl}>
                    <label htmlFor="customerId">Customer ID</label>
                    <div className={styles.customerIdRow}>
                      <input
                        id="customerId"
                        className={styles.input}
                        value={customerId}
                        readOnly
                      />
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={regenerateCustomerId}
                      >
                        Shuffle
                      </button>
                    </div>
                    <p className={styles.helper}>
                      Auto-generated CUST-XXX identifier.
                    </p>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formControl}>
                    <label htmlFor="customerName">Customer Name</label>
                    <input
                      id="customerName"
                      className={styles.input}
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="John Doe"
                    />
                    <p className={styles.helper}>
                      Required for Notification + Order Services
                    </p>
                  </div>
                  <div className={styles.formControl}>
                    <label htmlFor="customerEmail">Customer Email</label>
                    <input
                      id="customerEmail"
                      type="email"
                      className={styles.input}
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      placeholder="john.doe@example.com"
                    />
                    <p className={styles.helper}>
                      Used for status notifications
                    </p>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formControl}>
                    <label htmlFor="lineProduct">Product</label>
                    <select
                      id="lineProduct"
                      className={styles.select}
                      value={lineProductId}
                      onChange={(event) => setLineProductId(event.target.value)}
                      disabled={inventory.length === 0}
                    >
                      <option value="" disabled>
                        {inventoryLoading
                          ? "Loading products…"
                          : "Select a product"}
                      </option>
                      {inventory.map((product) => (
                        <option key={product.id} value={String(product.id)}>
                          {product.name} ({product.quantityAvailable} available)
                        </option>
                      ))}
                    </select>
                    <p className={styles.helper}>
                      Live data from Inventory Service
                    </p>
                  </div>
                  <div className={styles.formControl}>
                    <label htmlFor="lineQuantity">Quantity</label>
                    <input
                      id="lineQuantity"
                      type="number"
                      min={1}
                      max={maxQuantity || undefined}
                      className={styles.input}
                      value={lineQuantity}
                      onChange={(event) =>
                        setLineQuantity(
                          Math.max(1, Number(event.target.value) || 1),
                        )
                      }
                      disabled={!lineProductId}
                    />
                    <p className={styles.helper}>
                      {maxQuantity
                        ? `Up to ${maxQuantity} units available`
                        : "Awaiting availability"}
                    </p>
                  </div>
                  <div className={`${styles.formControl} ${styles.formControlCompact}`}>
                    <label className={styles.visuallyHidden}>Add item</label>
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={handleAddItem}
                      disabled={!lineProductId || lineQuantity <= 0}
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                <div className={styles.lineItemsPanel}>
                  <div className={styles.lineItemsHeader}>
                    <strong>Order Items</strong>
                    <span>{draftItems.length} selected</span>
                  </div>
                  {draftItems.length === 0 && (
                    <p className={styles.helper}>
                      Add at least one product to enable saving.
                    </p>
                  )}
                  {draftItems.map((item) => {
                    const product = productLookup.get(item.productId);
                    return (
                      <div key={item.id} className={styles.lineItem}>
                        <div className={styles.lineItemMeta}>
                          <strong>
                            {product
                              ? `${product.name} (${product.sku})`
                              : `Product ${item.productId}`}
                          </strong>
                          {product && (
                            <span>
                              In stock: {product.quantityAvailable} • Price:{" "}
                              {currencyFormatter.format(product.price)}
                            </span>
                          )}
                        </div>
                        <div className={styles.lineItemActions}>
                          <span>× {item.quantity}</span>
                          <button
                            type="button"
                            className={styles.removeLineItem}
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label="Remove item"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {orderError && <div className={styles.error}>{orderError}</div>}
                {orderSuccess && (
                  <div className={styles.success}>{orderSuccess}</div>
                )}

                <div className={styles.inlineActions}>
                  <button
                    type="submit"
                    className={styles.btn}
                    disabled={isSaveDisabled}
                  >
                    {orderSubmitting ? "Saving…" : "Save Order"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={loadOrders}
                    disabled={ordersLoading}
                  >
                    Sync Orders
                  </button>
                </div>
              </form>
            </article>

            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <strong>Orders</strong>
                  <span>Latest status per service</span>
                </div>
                <p className={styles.lastUpdated}>
                  {ordersUpdatedAt ? `Updated ${formatTimestamp(ordersUpdatedAt)}` : "Waiting for data"}
                </p>
              </div>
              {ordersError && <p className={styles.error}>{ordersError}</p>}
              <div className={styles.ordersList}>
                {ordersLoading && (
                  <div className={styles.emptyState}>Loading orders…</div>
                )}
                {!ordersLoading && orders.length === 0 && (
                  <div className={styles.emptyState}>
                    No orders have been submitted yet.
                  </div>
                )}
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const statusClass =
                    statusClassMap[order.status] ?? styles.statusCreated;
                  return (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderMeta}>
                        <div className={styles.orderCustomer}>
                          <strong>{order.customerName}</strong>
                          <a href={`mailto:${order.customerEmail}`}>
                            {order.customerEmail}
                          </a>
                        </div>
                        <span className={`${styles.statusBadge} ${statusClass}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className={styles.timeline}>
                        <p>Order ID: {order.id}</p>
                        <p>Created: {formatTimestamp(order.createdAt)}</p>
                        <p>Updated: {formatTimestamp(order.updatedAt)}</p>
                      </div>
                      {order.failureReason && (
                        <p className={styles.orderFailure}>
                          {order.failureReason}
                        </p>
                      )}
                      {order.items.length > 0 && (
                        <button
                          type="button"
                          className={styles.orderAction}
                          onClick={() => toggleOrderDetails(order.id)}
                        >
                          {isExpanded ? "Hide order details" : "View order details"}
                        </button>
                      )}
                      {isExpanded && order.items.length > 0 && (
                        <div className={styles.orderDetails}>
                          <div className={styles.orderDetailsHeader}>
                            <span>Product</span>
                            <span>Qty</span>
                          </div>
                          <div className={styles.orderItemsList}>
                            {order.items.map((item) => {
                              const product =
                                productLookup.get(item.productId) ?? null;
                              return (
                                <div key={item.id} className={styles.orderItem}>
                                  <span>
                                    {product
                                      ? `${product.name} (${product.sku})`
                                      : `Product ${item.productId}`}
                                  </span>
                                  <strong>× {item.quantity}</strong>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          {adjustProduct && (
            <div
              className={styles.modalOverlay}
              role="dialog"
              aria-modal="true"
              aria-labelledby="adjustModalTitle"
            >
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <div>
                    <p className={styles.modalEyebrow}>Adjust Inventory</p>
                    <strong id="adjustModalTitle">{adjustProduct.name}</strong>
                    <span>SKU {adjustProduct.sku}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={closeAdjustModal}
                    disabled={adjustSubmitting}
                    aria-label="Close adjust inventory dialog"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p className={styles.helper}>
                    Enter a positive value to add stock or negative to deduct.
                  </p>
                  <div className={styles.stockRow}>
                    <span>Currently available</span>
                    <strong>{adjustProduct.quantityAvailable}</strong>
                  </div>
                  <label htmlFor="delta" className={styles.modalLabel}>
                    Quantity delta
                  </label>
                  <input
                    id="delta"
                    type="number"
                    className={styles.input}
                    value={adjustDelta}
                    onChange={(event) => setAdjustDelta(Number(event.target.value))}
                    disabled={adjustSubmitting}
                  />
                  {adjustError && (
                    <p className={styles.error}>{adjustError}</p>
                  )}
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={closeAdjustModal}
                    disabled={adjustSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={handleAdjustSave}
                    disabled={adjustSubmitting}
                  >
                    {adjustSubmitting ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
