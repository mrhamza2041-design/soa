using MassTransit;
using OrderService.Data;
using Shared.Events;

namespace OrderService.Consumers
{
    public class InventoryReservedConsumer : IConsumer<InventoryReserved>
    {
        private readonly OrderDbContext _db;

        public InventoryReservedConsumer(OrderDbContext db)
        {
            _db = db;
        }

        public async Task Consume(ConsumeContext<InventoryReserved> context)
        {
            var msg = context.Message;

            // Update order status for this product / order
            var order = await _db.Orders.FindAsync(msg.OrderId);
            if (order != null)
            {
                order.Status = "InventoryReserved"; // or more complex logic if partial reservation
                await _db.SaveChangesAsync();
            }
            // 2. Publish notification event
            await context.Publish(new OrderStatusChanged
            {
                OrderId = msg.OrderId,
                Status = "InventoryReserved",
                Message = $"Order {msg.OrderId} inventory successfully reserved",
                UpdatedAt = DateTime.UtcNow
            });
        }
    }
}
