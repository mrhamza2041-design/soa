using NotificationService.DTOs;
using NotificationService.Services.Interfaces;

namespace NotificationService.Services.Implementation
{
    public class InMemoryNotificationStore : INotificationStore
    {
        private readonly List<StoredNotification> _list = new();


        public void Add(StoredNotification n)
        {
            // keep last 100
            _list.Insert(0, n);
            if (_list.Count > 100) _list.RemoveRange(100, _list.Count - 100);
        }


        public IReadOnlyList<StoredNotification> GetAll() => _list.AsReadOnly();
    }
}