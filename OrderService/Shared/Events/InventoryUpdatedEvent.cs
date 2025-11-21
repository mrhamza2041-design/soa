namespace Shared.Events
{
    public record InventoryUpdatedEvent(
        Guid OrderId,
        string CustomerName,
        int ProductId,
        int QuantityRemaining
    );
}
