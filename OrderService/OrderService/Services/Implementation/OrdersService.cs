using MassTransit;
using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using OrderService.Data.Entities;
using OrderService.DTOs;
using OrderService.Services.Interfaces;
using Shared.Events;
using Shared.Messages;
using OrderItemEvent = Shared.Messages.OrderItemEvent;

namespace OrderService.Services.Implementation
{
    public class OrdersService : IOrdersService
    {
        private readonly OrderDbContext _db;
        private readonly IPublishEndpoint _publisher;

        public OrdersService(OrderDbContext db, IPublishEndpoint publisher)
        {
            _db = db;
            _publisher = publisher;
        }
        public async Task MarkOrderAsFailedAsync(Guid orderId, string reason)
        {
            var order = await _db.Orders.FindAsync(orderId);

            if (order == null)
                return;

            order.Status = "Failed";
            order.FailureReason = reason;
            order.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        public async Task<Guid> CreateOrderAsync(CreateOrderRequestDTO request)
        {
            var order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = request.Customer.Id,
                CustomerName = request.Customer.Name,
                CustomerEmail = request.Customer.Email,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var item in request.Items)
            {
                order.Items.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity
                });
            }

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();
            try
            {

                // 1️⃣ Publish OrderCreated event
                await _publisher.Publish(new OrderCreatedEvent
                {
                    OrderId = order.Id,
                    CreatedAt = order.CreatedAt,
                    Customer = new CustomerEvent
                    {
                        Id = request.Customer.Id,
                        Name = request.Customer.Name,
                        Email = request.Customer.Email
                    },
                    Items = request.Items.Select(i => new OrderItemEvent
                    {
                        ProductId = i.ProductId,
                        Quantity = i.Quantity
                    }).ToList()
                });


                // 2️⃣ Send ReserveInventoryCommand for each item
                foreach (var item in request.Items)
                {
                    await _publisher.Publish(new ReserveInventoryCommand
                    {
                        OrderId = order.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity
                    });
                }
            }
            catch (Exception ex)
            {

                throw;
            }

            return order.Id;
        }

        public Task<Order?> GetOrderAsync(Guid id)
        {
            return _db.Orders.FindAsync(id).AsTask();
        }

        public Task<List<Order>> GetOrdersAsync()
        {
            return _db.Orders.Include(o => o.Items).ToListAsync();
        }
    }
}
