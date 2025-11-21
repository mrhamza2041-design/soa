using MassTransit;
using NotificationService.Consumers;
using NotificationService.Services.Implementation;
using NotificationService.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// RabbitMQ config
var rabbitHost = builder.Configuration.GetValue<string>("RABBITMQ:HOST") ?? "rabbitmq";
var rabbitUser = builder.Configuration.GetValue<string>("RABBITMQ:USER") ?? "guest";
var rabbitPass = builder.Configuration.GetValue<string>("RABBITMQ:PASSWORD") ?? "guest";

builder.Services.AddControllers();

// In-memory notification store
builder.Services.AddSingleton<INotificationStore, InMemoryNotificationStore>();
builder.Services.AddScoped<INotificationSender, NotificationSender>();

// MassTransit setup
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<InventoryUpdatedConsumer>();
    x.AddConsumer<OutOfStockConsumer>();
    x.AddConsumer<OrderStatusChangedConsumer>();
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(rabbitUser);
            h.Password(rabbitPass);
        });

        cfg.ReceiveEndpoint("notification-service-queue", e =>
        {
            e.ConfigureConsumer<InventoryUpdatedConsumer>(context);
            e.ConfigureConsumer<OutOfStockConsumer>(context);
            e.ConfigureConsumer<OrderStatusChangedConsumer>(context);

            e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
            e.UseInMemoryOutbox();
        });
    });
});

builder.Services.AddMassTransitHostedService();

// Health checks
builder.Services.AddHealthChecks();

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

app.UseCors("AllowAll");

app.MapGet("/health/ready", () => Results.Ok("ready"));
app.MapGet("/health/live", () => Results.Ok("live"));

// Minimal API endpoint (GET /notifications)
app.MapGet("/notifications", (INotificationStore store) =>
    Results.Ok(store.GetAll()))
   .RequireCors("AllowAll");  

app.MapControllers();

app.Run();
