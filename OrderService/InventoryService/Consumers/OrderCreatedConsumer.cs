using InventoryService.Services.Interfaces;
using MassTransit;
using Shared.Events;
using Shared.Messages;

namespace InventoryService.Consumers
{
    public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
    {
        private readonly IInventoryService _inventoryService;
        private readonly IPublishEndpoint _publishEndpoint;


        public OrderCreatedConsumer(IInventoryService inventoryService, IPublishEndpoint publishEndpoint)
        {
            _inventoryService = inventoryService;
            _publishEndpoint = publishEndpoint;
        }


        public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
        {
            var msg = context.Message;

            foreach (var item in msg.Items)
            {
                var result = await _inventoryService.TryReserveProductAsync(
                    item.ProductId,
                    item.Quantity,
                    msg.OrderId
                );

                if (result.Success)
                {
                    await _publishEndpoint.Publish(new InventoryUpdatedEvent(
                        msg.OrderId,
                        msg.Customer.Name,
                        item.ProductId,
                        result.QuantityRemaining
                    ));
                }
                else
                {
                    await _publishEndpoint.Publish(new OutOfStockEvent(
                        msg.OrderId,
                        item.ProductId,
                        item.Quantity
                    ));
                }
            }
        }
    }
}
