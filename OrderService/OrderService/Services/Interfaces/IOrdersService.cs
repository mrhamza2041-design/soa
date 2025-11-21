using OrderService.Data.Entities;
using OrderService.DTOs;

namespace OrderService.Services.Interfaces
{
    public interface IOrdersService
    {
        Task<Guid> CreateOrderAsync(CreateOrderRequestDTO request);
        Task<Order?> GetOrderAsync(Guid id);
        Task<List<Order>> GetOrdersAsync();
        Task MarkOrderAsFailedAsync(Guid orderId, string reason);

    }
}
