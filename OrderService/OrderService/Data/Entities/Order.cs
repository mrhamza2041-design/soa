namespace OrderService.Data.Entities
{
    public class Order
    {
        public Guid Id { get; set; }
        public string CustomerId { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public string CustomerEmail { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending";
        public string FailureReason { get; set; } = "";
        public DateTime UpdatedAt { get; set; }

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
