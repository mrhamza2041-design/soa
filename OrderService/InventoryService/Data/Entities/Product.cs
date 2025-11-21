namespace InventoryService.Data.Entities
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public int QuantityAvailable { get; set; }
        public decimal Price { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
