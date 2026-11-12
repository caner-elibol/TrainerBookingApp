namespace PersonalTrainer.Application.Reports;

public interface IReportsService
{
    Task<TrainerReportsResponse> GetTrainerReportsAsync(Guid trainerId, CancellationToken ct = default);
}
