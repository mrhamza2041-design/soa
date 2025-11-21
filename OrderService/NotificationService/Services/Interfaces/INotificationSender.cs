using NotificationService.DTOs;

namespace NotificationService.Services.Interfaces
{
    public interface INotificationSender
    {
        Task SendAsync(NotificationMessage message);
    }
}
