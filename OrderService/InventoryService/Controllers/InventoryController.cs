using InventoryService.Models;
using InventoryService.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace InventoryService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventory;


        public InventoryController(IInventoryService inventory)
        {
            _inventory = inventory;
        }


        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _inventory.GetAllProductsAsync();
            return Ok(products);
        }


        [HttpGet("products/{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _inventory.GetProductAsync(id);
            if (p == null) return NotFound();
            return Ok(p);
        }


        [HttpPost("products/{id:int}/adjust")]
        public async Task<IActionResult> Adjust(int id, [FromBody] AdjustStockRequest req)
        {
            if (req == null) return BadRequest();
            var ok = await _inventory.AdjustStockAsync(id, req.Delta);
            if (!ok) return NotFound();
            return Ok(new { success = true });
        }
    }
}
