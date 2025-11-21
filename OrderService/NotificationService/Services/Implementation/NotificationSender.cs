using NotificationService.DTOs;
using NotificationService.Services.Interfaces;

namespace NotificationService.Services.Implementation
{
    public class NotificationSender : INotificationSender
    {
        private readonly INotificationStore _store;
        private readonly ILogger<NotificationSender> _logger;


        public NotificationSender(INotificationStore store, ILogger<NotificationSender> logger)
        {
            _store = store;
            _logger = logger;
        }


        public Task SendAsync(NotificationMessage message)
        {
            // Mock sending — log + store in-memory
            _logger.LogInformation("[Notification] To={To} Subject={Sub} Body={Body}", message.To, message.Subject, message.Body);
            _store.Add(new StoredNotification
            {
                To = message.To,
                Subject = message.Subject,
                Body = message.Body,
                SentAt = message.Timestamp
            });


            return Task.CompletedTask;
        }
    }
}