using MassTransit;
using NotificationService.DTOs;
using NotificationService.Services.Interfaces;
using Shared.Events;

namespace OrderService.Consumers
{
    public class InventoryReservedConsumer : IConsumer<InventoryReserved>
    {
        private readonly INotificationStore _store;


        public InventoryReservedConsumer(INotificationStore store)
        {
            _store = store;
        }

        public Task Consume(ConsumeContext<InventoryReserved> context)
        {
            var evt = context.Message;

            _store.Add(new StoredNotification  // now uses DTO version
            {
                Id = evt.ProductId.ToString(),
                Body = "Product#" + evt.ProductId + " Reserved for OrderId# " + evt.OrderId ,
                Subject = "Inventory Reserved",
                SentAt = DateTime.Now,
            });

            return Task.CompletedTask;
        }
    }
}
