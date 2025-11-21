using NotificationService.DTOs;

namespace NotificationService.Services.Interfaces
{
    public interface INotificationStore
    {
        void Add(StoredNotification n);
        IReadOnlyList<StoredNotification> GetAll();
    }
}
