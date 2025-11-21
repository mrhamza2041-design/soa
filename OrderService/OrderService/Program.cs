using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using OrderService.Consumers;
using OrderService.Data;
using OrderService.Services.Implementation;
using OrderService.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<OrderDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<InventoryReservedConsumer>();
    x.AddConsumer<InventoryUpdatedConsumer>();
    x.AddConsumer<OutOfStockConsumer>();
    x.UsingRabbitMq((context, cfg) =>
    {
        var host = builder.Configuration["RabbitMq:Host"];
        var virtualHost = builder.Configuration["RabbitMq:VirtualHost"] ?? "/";
        var username = builder.Configuration["RabbitMq:Username"] ?? "guest";
        var password = builder.Configuration["RabbitMq:Password"] ?? "guest";

        cfg.Host(host, virtualHost, h =>
        {
            h.Username(username);
            h.Password(password);
        });

        cfg.ReceiveEndpoint("order-inventory-events", e =>
        {
            e.ConfigureConsumer<InventoryReservedConsumer>(context);
            e.ConfigureConsumer<InventoryUpdatedConsumer>(context);
            e.ConfigureConsumer<OutOfStockConsumer>(context);
        });
    });
});


builder.Services.AddScoped<IOrdersService, OrdersService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Order Service", Version = "v1" });
});

// CORS CONFIG 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowAll");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    db.Database.Migrate();
}

app.MapControllers();
app.Run();
