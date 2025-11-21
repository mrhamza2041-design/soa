using InventoryService.Data;
using InventoryService.Data.Entities;
using InventoryService.Services.Interfaces;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Shared.Events;

namespace InventoryService.Services.Implementation
{
    public class InventoryService : IInventoryService
    {
        private readonly InventoryDbContext _db;
        private readonly IPublishEndpoint _publishEndpoint;

        public InventoryService(InventoryDbContext db, IPublishEndpoint publishEndpoint)
        {
            _db = db;
            _publishEndpoint = publishEndpoint;
        }


        public async Task<IEnumerable<Product>> GetAllProductsAsync()
        {
            return await _db.Products.AsNoTracking().ToListAsync();
        }


        public async Task<Product?> GetProductAsync(int productId)
        {
            return await _db.Products.FindAsync(productId);
        }


        // Reserve product (decrement if possible) — single-item processing
        public async Task<(bool Success, int QuantityRemaining)> TryReserveProductAsync(int productId, int quantity, Guid orderId)
        {
            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId);
            if (product == null) return (false, 0);

            if (product.QuantityAvailable >= quantity)
            {
                product.QuantityAvailable -= quantity;
                product.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                // Publish InventoryReserved event
                await _publishEndpoint.Publish(new InventoryReserved
                {
                    ProductId = productId,
                    QuantityReserved = quantity,
                    OrderId = orderId,
                    Message = "Inventory has been reserved for Order# "+ orderId,
                    ReservedAt = DateTime.UtcNow
                });

                // Optional: Publish InventoryUpdated event
                await _publishEndpoint.Publish(new InventoryUpdated
                {
                    ProductId = productId,
                    Message = "Inventory has been Updated For Product# "+ product.Name,
                    QuantityAvailable = product.QuantityAvailable,
                    UpdatedAt = DateTime.UtcNow
                });

                return (true, product.QuantityAvailable);
            }

            return (false, product.QuantityAvailable);
        }


        public async Task<bool> AdjustStockAsync(int productId, int delta)
        {
            var p = await _db.Products.FindAsync(productId);
            if (p == null) return false;

            p.QuantityAvailable += delta;
            p.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // Publish InventoryUpdated event
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await _publishEndpoint.Publish(new InventoryUpdated
                {
                    ProductId = productId,
                    QuantityAvailable = p.QuantityAvailable,
                    UpdatedAt = DateTime.UtcNow
                }, cts.Token);
            }
            catch (Exception ex)
            {
                // Log the error but don't block the response
                Console.WriteLine($"Failed to publish event: {ex.Message}");
            }

            return true;
        }
    }
}
