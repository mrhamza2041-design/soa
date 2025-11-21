
## Overview
This project is a simplified e-commerce system demonstrating **service-oriented architecture (SOA)**, **event-driven communication**, and **fault-tolerant backend** design with a clean, responsive frontend built in **React + Next.js**.  

The system consists of the following components:

- Order Service** – Handles order creation and validation. Publishes `OrderCreated` events.
- Inventory Service** – Monitors stock levels, updates inventory, and publishes `InventoryUpdated` or `OutOfStock` events.
- Notification Service** – Sends user notifications on order status changes based on backend events.
- Frontend App** – Provides a UI for viewing products, placing orders, and tracking order status in real time.
- Message Broker** – RabbitMQ is used for asynchronous communication between backend services.

### Service Responsibilities:

1. **Order Service**
   - Receives new order requests from the frontend.
   - Validates product and quantity.
   - Publishes `OrderCreated` event to RabbitMQ.
   - API endpoints:
     - `POST /orders` – Create a new order.
     - `GET /orders/{id}` – Get order status.

2. **Inventory Service**
   - Listens for `OrderCreated` events from RabbitMQ.
   - Checks product stock availability.
   - Updates inventory if in stock.
   - Publishes either:
     - `InventoryUpdated` (if stock reduced successfully)
     - `OutOfStock` (if stock insufficient)

3. **Notification Service**
   - Listens for `InventoryUpdated` and `OutOfStock` events.
   - Sends notifications (mocked via console logs).

4. **Frontend App**
   - Built using React + Next.js.
   - Features:
     - View available products and inventory levels.
     - Place new orders.
     - Track order status in real time.
     - Handles loading, errors, and retries gracefully.
   - Communicates with backend via REST APIs.

5. **Message Broker (RabbitMQ)**
   - Manages asynchronous communication between services.
   - Supports retries and message acknowledgments for fault tolerance.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)


##Running with Docker Compose
docker-compose up --build -d
