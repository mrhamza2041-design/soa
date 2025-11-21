using Microsoft.AspNetCore.Mvc;
using OrderService.DTOs;
using OrderService.Services.Interfaces;

namespace OrderService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly IOrdersService _service;

        public OrdersController(IOrdersService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderRequestDTO request)
        {
            var id = await _service.CreateOrderAsync(request);
            return Accepted(new { orderId = id });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var order = await _service.GetOrderAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var order = await _service.GetOrdersAsync();
            if (order == null) return NotFound();
            return Ok(order);
        }
    }
}
