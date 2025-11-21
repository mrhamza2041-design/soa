namespace Shared.Events
{
    public class InventoryUpdated
    {
        public int ProductId { get; set; }
        public int QuantityAvailable { get; set; }
        public string Message  { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}
