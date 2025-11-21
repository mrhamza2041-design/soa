namespace Shared.Events
{
    public class ReserveInventoryCommand
    {
        public Guid OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
