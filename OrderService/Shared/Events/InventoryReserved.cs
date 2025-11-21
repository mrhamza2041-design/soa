namespace Shared.Events
{
    public class InventoryReserved
    {
        public int ProductId { get; set; }
        public int QuantityReserved { get; set; }
        public Guid OrderId { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime ReservedAt { get; set; }
    }
}
