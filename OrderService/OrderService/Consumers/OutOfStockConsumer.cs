using MassTransit;
using OrderService.Services.Interfaces;
using Shared.Events;

namespace OrderService.Consumers
{
    public class OutOfStockConsumer : IConsumer<OutOfStockEvent>
    {
        private readonly IOrdersService _orderService;

        public OutOfStockConsumer(IOrdersService orderService)
        {
            _orderService = orderService;
        }

        public async Task Consume(ConsumeContext<OutOfStockEvent> context)
        {
            var msg = context.Message;

            // ❗ Mark order as failed
            await _orderService.MarkOrderAsFailedAsync(
                msg.OrderId,
                $"Product {msg.ProductId} is out of stock for quantity {msg.RequestedQuantity}"
            );

            Console.WriteLine($"OUT OF STOCK — Order {msg.OrderId}, Product {msg.ProductId}");
        }
    }
}
