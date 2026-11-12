class WorkingHour {
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final String? breakStartTime;
  final String? breakEndTime;

  const WorkingHour({
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.breakStartTime,
    this.breakEndTime,
  });

  factory WorkingHour.fromJson(Map<String, dynamic> json) {
    return WorkingHour(
      dayOfWeek: json['dayOfWeek'] as int,
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      breakStartTime: json['breakStartTime'] as String?,
      breakEndTime: json['breakEndTime'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'dayOfWeek': dayOfWeek,
        'startTime': startTime,
        'endTime': endTime,
        'breakStartTime': breakStartTime,
        'breakEndTime': breakEndTime,
      };
}

class OnboardingRequest {
  final String expertiseArea;
  final int sessionDurationMinutes;
  final int bufferDurationMinutes;
  final List<WorkingHour> workingHours;

  const OnboardingRequest({
    required this.expertiseArea,
    required this.sessionDurationMinutes,
    required this.bufferDurationMinutes,
    required this.workingHours,
  });

  Map<String, dynamic> toJson() => {
        'expertiseArea': expertiseArea,
        'sessionDurationMinutes': sessionDurationMinutes,
        'bufferDurationMinutes': bufferDurationMinutes,
        'workingHours': workingHours.map((w) => w.toJson()).toList(),
      };
}

class TrainerSettings {
  final String expertiseArea;
  final int sessionDurationMinutes;
  final int bufferDurationMinutes;
  final List<WorkingHour> workingHours;
  final String? calendarSlug;

  const TrainerSettings({
    required this.expertiseArea,
    required this.sessionDurationMinutes,
    required this.bufferDurationMinutes,
    required this.workingHours,
    required this.calendarSlug,
  });

  factory TrainerSettings.fromJson(Map<String, dynamic> json) {
    return TrainerSettings(
      expertiseArea: json['expertiseArea'] as String,
      sessionDurationMinutes: json['sessionDurationMinutes'] as int,
      bufferDurationMinutes: json['bufferDurationMinutes'] as int,
      workingHours: (json['workingHours'] as List<dynamic>)
          .map((w) => WorkingHour.fromJson(w as Map<String, dynamic>))
          .toList(),
      calendarSlug: json['calendarSlug'] as String?,
    );
  }
}
