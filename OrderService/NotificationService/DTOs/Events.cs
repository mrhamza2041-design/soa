namespace NotificationService.DTOs
{
    public record InventoryUpdatedEvent
    (
    Guid OrderId,
    int ProductId,
    int QuantityChanged,
    int RemainingQuantity,
    DateTime Timestamp
    );


    public record OutOfStockEvent
    (
    Guid OrderId,
    int ProductId,
    int RequestedQuantity,
    string Reason,
    DateTime Timestamp
    );


    public record NotificationMessage
    {
        public string Subject { get; init; } = string.Empty;
        public string Body { get; init; } = string.Empty;
        public string To { get; init; } = string.Empty;
        public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    }

    public record StoredNotification
    {
        public string Id { get; init; }
        public string To { get; init; } = string.Empty;
        public string Subject { get; init; } = string.Empty;
        public string Body { get; init; } = string.Empty;
        public DateTime SentAt { get; init; }
    }
}
