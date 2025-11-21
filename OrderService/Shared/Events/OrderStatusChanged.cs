namespace Shared.Events
{
    public class OrderStatusChanged
    {
        public Guid OrderId { get; set; }
        public string Status { get; set; } = "";
        public string Message { get; set; } = "";
        public DateTime UpdatedAt { get; set; }
    }
}
