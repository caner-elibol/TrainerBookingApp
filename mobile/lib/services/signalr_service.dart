import 'package:signalr_netcore/signalr_client.dart';
import '../config.dart';

class AvailabilityHubService {
  HubConnection? _connection;

  Future<void> connect({required void Function(Map<String, dynamic> message) onSlotStatusChanged}) async {
    final connection = HubConnectionBuilder()
        .withUrl(AppConfig.hubUrl)
        .withAutomaticReconnect(retryDelays: [2000, 5000, 10000, 20000])
        .build();

    connection.on('SlotStatusChanged', (parameters) {
      if (parameters == null || parameters.isEmpty) return;
      final raw = parameters[0];
      if (raw is Map) {
        onSlotStatusChanged(Map<String, dynamic>.from(raw));
      }
    });

    await connection.start();
    _connection = connection;
  }

  Future<void> joinTrainerGroup(String trainerId) async {
    await _connection?.invoke('JoinTrainerCalendar', args: [trainerId]);
  }

  Future<void> leaveTrainerGroup(String trainerId) async {
    try {
      await _connection?.invoke('LeaveTrainerCalendar', args: [trainerId]);
    } catch (_) {
    }
  }

  Future<void> disconnect() async {
    await _connection?.stop();
    _connection = null;
  }
}
