using MassTransit;
using NotificationService.DTOs;
using NotificationService.Services.Interfaces;
using Shared.Events;

namespace NotificationService.Consumers
{
    public class OrderStatusChangedConsumer : IConsumer<OrderStatusChanged>
    {
        private readonly INotificationStore _store;

        public OrderStatusChangedConsumer(INotificationStore store)
        {
            _store = store;
        }

        public Task Consume(ConsumeContext<OrderStatusChanged> context)
        {
            var evt = context.Message;

            _store.Add(new StoredNotification
            {
                Id = evt.OrderId.ToString(),
                Subject = "Order updated",
                Body = evt.Message,
                SentAt = DateTime.UtcNow,
            });

            return Task.CompletedTask;
        }
    }
}
