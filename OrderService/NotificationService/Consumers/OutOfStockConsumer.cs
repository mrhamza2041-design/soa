using MassTransit;
using NotificationService.DTOs;
using NotificationService.Services.Interfaces;


namespace NotificationService.Consumers;


public class OutOfStockConsumer : IConsumer<OutOfStockEvent>
{
    private readonly INotificationSender _sender;


    public OutOfStockConsumer(INotificationSender sender)
    {
        _sender = sender;
    }


    public async Task Consume(ConsumeContext<OutOfStockEvent> context)
    {
        var evt = context.Message;


        var adminMessage = $"Order {evt.OrderId} could not be fulfilled for Product {evt.ProductId}: {evt.Reason}";


        // Notify customer and admin (mock)
        await _sender.SendAsync(new NotificationMessage
        {
            Subject = "Order failed - out of stock",
            Body = $"We're sorry — your order {evt.OrderId} could not be fulfilled.",
            To = "customer@example.com",
            Timestamp = evt.Timestamp
        });


        await _sender.SendAsync(new NotificationMessage
        {
            Subject = "Out of stock alert",
            Body = adminMessage,
            To = "admin@example.com",
            Timestamp = evt.Timestamp
        });
    }
}