namespace PersonalTrainer.Infrastructure.Email;

public class EmailDispatchSignal
{
    private readonly SemaphoreSlim _semaphore = new(0, 1);

    public void Release()
    {
        if (_semaphore.CurrentCount == 0)
            _semaphore.Release();
    }

    public Task WaitAsync(CancellationToken ct) => _semaphore.WaitAsync(ct);
}
