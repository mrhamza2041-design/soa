using MassTransit;
using NotificationService.DTOs;
using NotificationService.Services.Interfaces;
using Shared.Events;


namespace NotificationService.Consumers
{
    public class InventoryUpdatedConsumer : IConsumer<InventoryUpdated>
    {
        private readonly INotificationStore _store;

        public InventoryUpdatedConsumer(INotificationStore store)
        {
            _store = store;
        }

        public Task Consume(ConsumeContext<InventoryUpdated> context)
        {
            var evt = context.Message;

            _store.Add(new StoredNotification  // now uses DTO version
            {
                Id = evt.ProductId.ToString(),
                Subject = "Product updated",
                Body = "Inventory updated for product# " + evt.ProductId,
                SentAt = DateTime.UtcNow,
            });

            return Task.CompletedTask;
        }
    }
}