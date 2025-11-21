namespace Shared.Messages
{
    public class OrderCreatedEvent
    {
        public Guid OrderId { get; set; }
        public DateTime CreatedAt { get; set; }
        public CustomerEvent Customer { get; set; }
        public List<OrderItemEvent> Items { get; set; }
    }
    public class CustomerEvent
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }

    public class OrderItemEvent
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
