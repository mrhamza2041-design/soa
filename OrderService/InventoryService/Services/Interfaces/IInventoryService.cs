using InventoryService.Data.Entities;

namespace InventoryService.Services.Interfaces
{
    public interface IInventoryService
    {
        Task<(bool Success, int QuantityRemaining)> TryReserveProductAsync(int productId, int quantity, Guid orderId);
        Task<IEnumerable<Product>> GetAllProductsAsync();
        Task<Product?> GetProductAsync(int productId);
        Task<bool> AdjustStockAsync(int productId, int delta);
    }
}
