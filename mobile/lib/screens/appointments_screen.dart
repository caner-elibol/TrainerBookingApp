import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import '../models/appointment_dtos.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/signalr_service.dart';
import '../services/trainer_api.dart';

const List<String?> _statusFilters = [null, 'Locked', 'Confirmed', 'Cancelled', 'Completed'];

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  final _trainerApi = TrainerApi();
  final _hub = AvailabilityHubService();

  List<AppointmentSummary> _appointments = [];
  bool _loading = true;
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _load();
    _connectLiveUpdates();
  }

  @override
  void dispose() {
    final trainerId = AuthService.instance.currentUser.value?.id;
    if (trainerId != null) _hub.leaveTrainerGroup(trainerId);
    _hub.disconnect();
    super.dispose();
  }

  Future<void> _connectLiveUpdates() async {
    final trainerId = AuthService.instance.currentUser.value?.id;
    if (trainerId == null) return;

    try {
      await _hub.connect(
        onSlotStatusChanged: (message) {
          final msgTrainerId = message['trainerId'] ?? message['TrainerId'];
          final status = message['status'] ?? message['Status'];
          if (msgTrainerId == trainerId && status == 2 && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('New booking!')));
            _load();
          }
        },
      );
      await _hub.joinTrainerGroup(trainerId);
    } catch (_) {
    }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final appointments = await _trainerApi.getMyAppointments(status: _statusFilter);
      if (mounted) setState(() => _appointments = appointments);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cancel(AppointmentSummary appointment) async {
    try {
      await _trainerApi.cancelAppointment(appointment.id);
      _load();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('MMM d, HH:mm');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointments'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: DropdownButton<String?>(
              value: _statusFilter,
              isExpanded: true,
              items: _statusFilters
                  .map((s) => DropdownMenuItem(value: s, child: Text(s ?? 'All statuses')))
                  .toList(),
              onChanged: (value) {
                setState(() => _statusFilter = value);
                _load();
              },
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _appointments.isEmpty
                ? ListView(children: const [Padding(padding: EdgeInsets.all(24), child: Text('No appointments.'))])
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _appointments.length,
                    itemBuilder: (context, index) {
                      final appt = _appointments[index];
                      return Card(
                        child: ListTile(
                          title: Text(appt.clientName),
                          subtitle: Text('${formatter.format(appt.startTimeUtc.toLocal())} · ${appt.status}'),
                          trailing: appt.status == 'Confirmed'
                              ? IconButton(icon: const Icon(Icons.cancel_outlined), onPressed: () => _cancel(appt))
                              : null,
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
