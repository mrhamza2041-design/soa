namespace Shared.Events
{
    public record OutOfStockEvent(
        Guid OrderId,
        int ProductId,
        int RequestedQuantity
    );
}
