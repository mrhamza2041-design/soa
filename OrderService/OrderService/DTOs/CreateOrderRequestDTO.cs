namespace OrderService.DTOs
{
    public class CreateOrderRequestDTO
    {
        public List<OrderItemRequestDTO> Items { get; set; } = new();
        public CustomerDto Customer { get; set; } = new();
    }
    public class CustomerDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }
}
