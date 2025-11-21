using InventoryService.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Data
{
    public class InventoryDbContext : DbContext
    {
        public InventoryDbContext(DbContextOptions<InventoryDbContext> options) : base(options) { }


        public DbSet<Product> Products { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Product>().HasKey(p => p.Id);
            modelBuilder.Entity<Product>().Property(p => p.Name).IsRequired().HasMaxLength(200);


            // Seed initial products using EF Core HasData
            modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, Name = "Widget A", Sku = "W-A-001", QuantityAvailable = 100, Price = 9.99M },
            new Product { Id = 2, Name = "Widget B", Sku = "W-B-001", QuantityAvailable = 50, Price = 19.99M },
            new Product { Id = 3, Name = "Widget C", Sku = "W-C-001", QuantityAvailable = 0, Price = 29.99M }
            );
        }
    }
}