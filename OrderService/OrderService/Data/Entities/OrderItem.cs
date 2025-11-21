namespace OrderService.Data.Entities
{
    public class OrderItem
    {
        public int Id { get; set; }
        public Guid OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
