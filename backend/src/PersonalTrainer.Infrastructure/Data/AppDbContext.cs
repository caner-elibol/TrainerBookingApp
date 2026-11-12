using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PersonalTrainer.Domain.Entities;
using PersonalTrainer.Domain.Enums;

namespace PersonalTrainer.Infrastructure.Data;

public class AppDbContext : IdentityUserContext<User, Guid>
{
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<UserPackage> UserPackages => Set<UserPackage>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<TrainerSetting> TrainerSettings => Set<TrainerSetting>();
    public DbSet<TrainerWorkingHour> TrainerWorkingHours => Set<TrainerWorkingHour>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ClientGoal> ClientGoals => Set<ClientGoal>();
    public DbSet<ClientNote> ClientNotes => Set<ClientNote>();
    public DbSet<BodyMetric> BodyMetrics => Set<BodyMetric>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ClientInvite> ClientInvites => Set<ClientInvite>();
    public DbSet<FavoriteTrainer> FavoriteTrainers => Set<FavoriteTrainer>();
    public DbSet<TrainerClosedDay> TrainerClosedDays => Set<TrainerClosedDay>();
    public DbSet<EmailOutboxMessage> EmailOutboxMessages => Set<EmailOutboxMessage>();
    public DbSet<TrainerLocation> TrainerLocations => Set<TrainerLocation>();
    public DbSet<LocationTravelTime> LocationTravelTimes => Set<LocationTravelTime>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToTable("Users");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.CalendarSlug)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Phone)
            .IsUnique();
        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

        // 1. ÇAKIŞMA ÖNLEME INDEX'İ (Kritik)
        // Bir PT aynı saatte sadece 1 adet Confirmed/Locked randevuya sahip olabilir.
        // Cancelled randevular hariç tutulur ki iptal edilen bir saat tekrar rezerve edilebilsin.
        modelBuilder.Entity<Appointment>()
            .HasIndex(a => new { a.TrainerId, a.StartTime })
            .IsUnique()
            .HasFilter($"\"Status\" <> {(int)AppointmentStatus.Cancelled}");

        modelBuilder.Entity<Appointment>()
            .HasIndex(a => new { a.Status, a.LockExpirationTime })
            .HasFilter($"\"Status\" = {(int)AppointmentStatus.Locked}");

        modelBuilder.Entity<Appointment>()
            .HasIndex(a => new { a.Status, a.EndTime })
            .HasFilter($"\"Status\" = {(int)AppointmentStatus.Confirmed}");

        // 2. Müşteri - PT Randevu İlişkileri (Çift Yönlü User İlişkisi)
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Trainer)
            .WithMany(u => u.TrainerAppointments)
            .HasForeignKey(a => a.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Client)
            .WithMany(u => u.ClientAppointments)
            .HasForeignKey(a => a.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Location)
            .WithMany()
            .HasForeignKey(a => a.LocationId)
            .OnDelete(DeleteBehavior.Restrict);

        // 3. Paket / Ödeme ilişkileri
        modelBuilder.Entity<UserPackage>()
            .HasOne(up => up.Client)
            .WithMany(u => u.PurchasedPackages)
            .HasForeignKey(up => up.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Package>()
            .HasOne(p => p.Trainer)
            .WithMany(u => u.CreatedPackages)
            .HasForeignKey(p => p.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.UserPackage)
            .WithMany(up => up.Payments)
            .HasForeignKey(p => p.UserPackageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Client)
            .WithMany()
            .HasForeignKey(p => p.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Package)
            .WithMany()
            .HasForeignKey(p => p.PackageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.MerchantOid)
            .IsUnique();

        modelBuilder.Entity<Package>().Property(p => p.Price).HasPrecision(10, 2);
        modelBuilder.Entity<Payment>().Property(p => p.Amount).HasPrecision(10, 2);

        // 4. PT ayarları / çalışma saatleri
        modelBuilder.Entity<TrainerSetting>()
            .HasIndex(s => s.TrainerId)
            .IsUnique();

        modelBuilder.Entity<TrainerSetting>().Property(s => s.NotifyPushEnabled).HasDefaultValue(true);
        modelBuilder.Entity<TrainerSetting>().Property(s => s.NotifyEmailEnabled).HasDefaultValue(true);
        modelBuilder.Entity<TrainerSetting>().Property(s => s.NotifyPaymentEnabled).HasDefaultValue(true);

        modelBuilder.Entity<TrainerWorkingHour>()
            .HasIndex(w => new { w.TrainerId, w.DayOfWeek })
            .IsUnique();

        // 5. Refresh Token
        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientGoal>()
            .HasOne(g => g.Trainer)
            .WithMany()
            .HasForeignKey(g => g.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ClientGoal>()
            .HasOne(g => g.Client)
            .WithMany()
            .HasForeignKey(g => g.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ClientGoal>()
            .HasIndex(g => new { g.TrainerId, g.ClientId });

        modelBuilder.Entity<ClientNote>()
            .HasOne(n => n.Trainer)
            .WithMany()
            .HasForeignKey(n => n.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ClientNote>()
            .HasOne(n => n.Client)
            .WithMany()
            .HasForeignKey(n => n.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ClientNote>()
            .HasIndex(n => new { n.TrainerId, n.ClientId });

        modelBuilder.Entity<BodyMetric>()
            .HasOne(m => m.Trainer)
            .WithMany()
            .HasForeignKey(m => m.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BodyMetric>()
            .HasOne(m => m.Client)
            .WithMany()
            .HasForeignKey(m => m.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BodyMetric>()
            .HasIndex(m => new { m.TrainerId, m.ClientId, m.RecordedAt });

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Trainer)
            .WithMany()
            .HasForeignKey(r => r.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Client)
            .WithMany()
            .HasForeignKey(r => r.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Review>()
            .HasIndex(r => new { r.TrainerId, r.ClientId })
            .IsUnique();

        modelBuilder.Entity<ClientInvite>()
            .HasOne(i => i.Client)
            .WithMany()
            .HasForeignKey(i => i.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ClientInvite>()
            .HasOne(i => i.Trainer)
            .WithMany()
            .HasForeignKey(i => i.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ClientInvite>()
            .HasIndex(i => i.TokenHash)
            .IsUnique();

        modelBuilder.Entity<FavoriteTrainer>()
            .HasOne(f => f.Client)
            .WithMany()
            .HasForeignKey(f => f.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FavoriteTrainer>()
            .HasOne(f => f.Trainer)
            .WithMany()
            .HasForeignKey(f => f.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FavoriteTrainer>()
            .HasIndex(f => new { f.ClientId, f.TrainerId })
            .IsUnique();

        modelBuilder.Entity<TrainerClosedDay>()
            .HasOne(d => d.Trainer)
            .WithMany()
            .HasForeignKey(d => d.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TrainerClosedDay>()
            .HasIndex(d => new { d.TrainerId, d.Date })
            .IsUnique();

        modelBuilder.Entity<TrainerClosedDay>().Property(d => d.Reason).HasDefaultValue(TrainerClosedDayReason.Manual);

        modelBuilder.Entity<TrainerLocation>()
            .HasOne(l => l.Trainer)
            .WithMany()
            .HasForeignKey(l => l.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TrainerLocation>()
            .HasIndex(l => new { l.TrainerId, l.Name })
            .IsUnique();

        modelBuilder.Entity<LocationTravelTime>()
            .HasOne(t => t.Trainer)
            .WithMany()
            .HasForeignKey(t => t.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LocationTravelTime>()
            .HasOne(t => t.LocationA)
            .WithMany()
            .HasForeignKey(t => t.LocationAId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LocationTravelTime>()
            .HasOne(t => t.LocationB)
            .WithMany()
            .HasForeignKey(t => t.LocationBId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LocationTravelTime>()
            .HasIndex(t => new { t.TrainerId, t.LocationAId, t.LocationBId })
            .IsUnique();

        modelBuilder.Entity<EmailOutboxMessage>()
            .HasIndex(m => new { m.Status, m.NextAttemptAt })
            .HasFilter($"\"Status\" = {(int)EmailOutboxStatus.Pending}");

        modelBuilder.Entity<User>().Property(u => u.HeightCm).HasPrecision(5, 2);

        // 6. PostgreSQL UTC DateTime Ayarı
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var properties = entityType.ClrType.GetProperties()
                .Where(p => p.PropertyType == typeof(DateTime) || p.PropertyType == typeof(DateTime?));

            foreach (var property in properties)
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property(property.Name)
                    .HasColumnType("timestamp with time zone");
            }
        }
    }
}
