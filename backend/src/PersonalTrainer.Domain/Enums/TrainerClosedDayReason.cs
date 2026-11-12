using System.Text.Json.Serialization;

namespace PersonalTrainer.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TrainerClosedDayReason
{
    Manual = 1,
    BulkCancelled = 2
}
