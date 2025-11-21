using MassTransit;
using Shared.Events;

namespace OrderService.Consumers
{
    public class InventoryUpdatedConsumer : IConsumer<InventoryUpdated>
    {
        public Task Consume(ConsumeContext<InventoryUpdated> context)
        {
            var msg = context.Message;

            // Optional: Update internal stock view, analytics, etc.
            Console.WriteLine($"Product {msg.ProductId} stock updated: {msg.QuantityAvailable}");
            return Task.CompletedTask;
        }
    }
}
