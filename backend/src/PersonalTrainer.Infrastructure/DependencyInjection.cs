using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PersonalTrainer.Application.Account;
using PersonalTrainer.Application.Auth;
using PersonalTrainer.Application.Booking;
using PersonalTrainer.Application.Clients;
using PersonalTrainer.Application.Email;
using PersonalTrainer.Application.Locking;
using PersonalTrainer.Application.Notifications;
using PersonalTrainer.Application.Packages;
using PersonalTrainer.Application.Payments;
using PersonalTrainer.Application.Realtime;
using PersonalTrainer.Application.Reports;
using PersonalTrainer.Application.Trainers;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Infrastructure.Account;
using PersonalTrainer.Infrastructure.Auth;
using PersonalTrainer.Infrastructure.Booking;
using PersonalTrainer.Infrastructure.Clients;
using PersonalTrainer.Infrastructure.Data;
using PersonalTrainer.Infrastructure.Email;
using PersonalTrainer.Infrastructure.Locking;
using PersonalTrainer.Infrastructure.Notifications;
using PersonalTrainer.Infrastructure.Packages;
using PersonalTrainer.Infrastructure.Payments;
using PersonalTrainer.Infrastructure.Realtime;
using PersonalTrainer.Infrastructure.Reports;
using PersonalTrainer.Infrastructure.Trainers;
using StackExchange.Redis;

namespace PersonalTrainer.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default")));

        services.AddIdentityCore<User>(options =>
            {
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<GoogleOptions>(configuration.GetSection(GoogleOptions.SectionName));

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IOtpAuthService, OtpAuthService>();
        services.AddScoped<IExternalAuthVerifier, GoogleAuthVerifier>();
        services.AddScoped<IExternalAuthVerifier, AppleAuthVerifier>();

        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(configuration.GetConnectionString("Redis")!));
        services.AddScoped<IReservationLockService, ReservationLockService>();

        services.AddScoped<ITrainerOnboardingService, TrainerOnboardingService>();
        services.AddScoped<IAvailabilityService, AvailabilityService>();
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<IAccountService, AccountService>();

        services.AddScoped<IAvailabilityNotifier, AvailabilityNotifier>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddHostedService<LockExpirySweepService>();
        services.AddHostedService<AppointmentCompletionSweepService>();

        services.AddScoped<IPackageService, PackageService>();
        services.AddScoped<IReportsService, ReportsService>();

        var emailSection = configuration.GetSection(EmailOptions.SectionName);
        services.Configure<EmailOptions>(emailSection);

        var useFakeSender = emailSection.GetValue<bool>("UseFakeSender");
        if (useFakeSender && environment.IsProduction())
        {
            throw new InvalidOperationException(
                "Email:UseFakeSender is enabled while ASPNETCORE_ENVIRONMENT=Production. Refusing to start — " +
                "this flag would let OTPs and notifications silently vanish into a log line instead of " +
                "reaching real inboxes.");
        }

        if (useFakeSender)
            services.AddScoped<IEmailSender, FakeEmailSender>();
        else
            services.AddScoped<IEmailSender, SmtpEmailSender>();

        services.AddSingleton<IEmailTemplateRenderer, EmailTemplateRenderer>();
        services.AddSingleton<EmailDispatchSignal>();
        services.AddScoped<IEmailOutbox, EmailOutbox>();
        services.AddHostedService<EmailDispatchSweepService>();

        services.AddScoped<INotificationService, NotificationService>();

        services.AddScoped<IClientOnboardingService, ClientOnboardingService>();

        var paytrSection = configuration.GetSection(PaytrOptions.SectionName);
        services.Configure<PaytrOptions>(paytrSection);

        var useFakeGateway = paytrSection.GetValue<bool>("UseFakeGateway");
        if (useFakeGateway && environment.IsProduction())
        {
            throw new InvalidOperationException(
                "Paytr:UseFakeGateway is enabled while ASPNETCORE_ENVIRONMENT=Production. Refusing to start — " +
                "this flag would let purchases succeed without a real payment ever occurring.");
        }

        if (useFakeGateway)
            services.AddScoped<IPaytrGateway, FakePaytrGateway>();
        else
            services.AddHttpClient<IPaytrGateway, PaytrGateway>();

        services.AddScoped<IPaymentService, PaymentService>();

        return services;
    }
}
