class AppointmentSummary {
  final String id;
  final String clientId;
  final String clientName;
  final DateTime startTimeUtc;
  final DateTime endTimeUtc;
  final String status;

  const AppointmentSummary({
    required this.id,
    required this.clientId,
    required this.clientName,
    required this.startTimeUtc,
    required this.endTimeUtc,
    required this.status,
  });

  factory AppointmentSummary.fromJson(Map<String, dynamic> json) {
    return AppointmentSummary(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      clientName: json['clientName'] as String,
      startTimeUtc: DateTime.parse(json['startTimeUtc'] as String),
      endTimeUtc: DateTime.parse(json['endTimeUtc'] as String),
      status: json['status'] as String,
    );
  }
}
