import 'package:flutter/material.dart';
import '../models/trainer_dtos.dart';
import '../services/api_client.dart';
import '../services/trainer_api.dart';

const List<Map<String, dynamic>> _days = [
  {'value': 1, 'label': 'Monday'},
  {'value': 2, 'label': 'Tuesday'},
  {'value': 3, 'label': 'Wednesday'},
  {'value': 4, 'label': 'Thursday'},
  {'value': 5, 'label': 'Friday'},
  {'value': 6, 'label': 'Saturday'},
  {'value': 0, 'label': 'Sunday'},
];

class _DayState {
  bool enabled;
  TimeOfDay start;
  TimeOfDay end;
  bool hasBreak;
  TimeOfDay breakStart;
  TimeOfDay breakEnd;

  _DayState({
    required this.enabled,
    required this.start,
    required this.end,
    required this.hasBreak,
    required this.breakStart,
    required this.breakEnd,
  });
}

String _formatTimeOfDay(TimeOfDay t) =>
    '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}:00';

TimeOfDay _parseTimeSpan(String value) {
  final parts = value.split(':');
  return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
}

class OnboardingScreen extends StatefulWidget {
  final TrainerSettings? initialSettings;
  const OnboardingScreen({super.key, this.initialSettings});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _trainerApi = TrainerApi();

  int _step = 0;
  bool _isBusy = false;
  List<String> _errors = [];

  late final TextEditingController _expertiseController;
  late final TextEditingController _sessionMinutesController;
  late final TextEditingController _bufferMinutesController;
  late final Map<int, _DayState> _dayStates;

  @override
  void initState() {
    super.initState();
    final initial = widget.initialSettings;

    _expertiseController = TextEditingController(text: initial?.expertiseArea ?? '');
    _sessionMinutesController = TextEditingController(text: (initial?.sessionDurationMinutes ?? 50).toString());
    _bufferMinutesController = TextEditingController(text: (initial?.bufferDurationMinutes ?? 10).toString());

    _dayStates = {
      for (final d in _days)
        d['value'] as int: _DayState(
          enabled: initial == null && [1, 2, 3, 4, 5].contains(d['value']),
          start: const TimeOfDay(hour: 9, minute: 0),
          end: const TimeOfDay(hour: 20, minute: 0),
          hasBreak: false,
          breakStart: const TimeOfDay(hour: 13, minute: 0),
          breakEnd: const TimeOfDay(hour: 14, minute: 0),
        ),
    };

    if (initial != null) {
      for (final wh in initial.workingHours) {
        _dayStates[wh.dayOfWeek] = _DayState(
          enabled: true,
          start: _parseTimeSpan(wh.startTime),
          end: _parseTimeSpan(wh.endTime),
          hasBreak: wh.breakStartTime != null && wh.breakEndTime != null,
          breakStart: wh.breakStartTime != null ? _parseTimeSpan(wh.breakStartTime!) : const TimeOfDay(hour: 13, minute: 0),
          breakEnd: wh.breakEndTime != null ? _parseTimeSpan(wh.breakEndTime!) : const TimeOfDay(hour: 14, minute: 0),
        );
      }
    }
  }

  @override
  void dispose() {
    _expertiseController.dispose();
    _sessionMinutesController.dispose();
    _bufferMinutesController.dispose();
    super.dispose();
  }

  Future<void> _pickTime(TimeOfDay initial, ValueChanged<TimeOfDay> onPicked) async {
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked != null) onPicked(picked);
  }

  Future<void> _submit() async {
    setState(() {
      _errors = [];
      _isBusy = true;
    });

    final workingHours = _days
        .where((d) => _dayStates[d['value'] as int]!.enabled)
        .map((d) {
          final state = _dayStates[d['value'] as int]!;
          return WorkingHour(
            dayOfWeek: d['value'] as int,
            startTime: _formatTimeOfDay(state.start),
            endTime: _formatTimeOfDay(state.end),
            breakStartTime: state.hasBreak ? _formatTimeOfDay(state.breakStart) : null,
            breakEndTime: state.hasBreak ? _formatTimeOfDay(state.breakEnd) : null,
          );
        })
        .toList();

    final request = OnboardingRequest(
      expertiseArea: _expertiseController.text.trim(),
      sessionDurationMinutes: int.tryParse(_sessionMinutesController.text) ?? 0,
      bufferDurationMinutes: int.tryParse(_bufferMinutesController.text) ?? 0,
      workingHours: workingHours,
    );

    try {
      await _trainerApi.completeOnboarding(request);
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (e) {
      setState(() => _errors = [e.message]);
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Set up your calendar')),
      body: Stepper(
        currentStep: _step,
        onStepContinue: () {
          if (_step < 2) {
            setState(() => _step += 1);
          } else {
            _submit();
          }
        },
        onStepCancel: _step > 0 ? () => setState(() => _step -= 1) : null,
        controlsBuilder: (context, details) => Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Row(
            children: [
              FilledButton(
                onPressed: _isBusy ? null : details.onStepContinue,
                child: Text(_step == 2 ? 'Finish' : 'Next'),
              ),
              if (details.onStepCancel != null) ...[
                const SizedBox(width: 8),
                OutlinedButton(onPressed: details.onStepCancel, child: const Text('Back')),
              ],
            ],
          ),
        ),
        steps: [
          Step(
            title: const Text('Expertise'),
            isActive: _step >= 0,
            content: TextField(
              controller: _expertiseController,
              decoration: const InputDecoration(labelText: 'What do you teach?', border: OutlineInputBorder()),
            ),
          ),
          Step(
            title: const Text('Working hours'),
            isActive: _step >= 1,
            content: Column(
              children: _days.map((d) {
                final value = d['value'] as int;
                final state = _dayStates[value]!;
                return StatefulBuilder(
                  builder: (context, setDayState) => Card(
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CheckboxListTile(
                            value: state.enabled,
                            title: Text(d['label'] as String),
                            controlAffinity: ListTileControlAffinity.leading,
                            onChanged: (v) => setDayState(() => state.enabled = v ?? false),
                          ),
                          if (state.enabled) ...[
                            Row(
                              children: [
                                TextButton(
                                  onPressed: () => _pickTime(state.start, (t) => setDayState(() => state.start = t)),
                                  child: Text('From ${state.start.format(context)}'),
                                ),
                                TextButton(
                                  onPressed: () => _pickTime(state.end, (t) => setDayState(() => state.end = t)),
                                  child: Text('To ${state.end.format(context)}'),
                                ),
                              ],
                            ),
                            CheckboxListTile(
                              value: state.hasBreak,
                              title: const Text('Break'),
                              controlAffinity: ListTileControlAffinity.leading,
                              onChanged: (v) => setDayState(() => state.hasBreak = v ?? false),
                            ),
                            if (state.hasBreak)
                              Row(
                                children: [
                                  TextButton(
                                    onPressed: () =>
                                        _pickTime(state.breakStart, (t) => setDayState(() => state.breakStart = t)),
                                    child: Text('From ${state.breakStart.format(context)}'),
                                  ),
                                  TextButton(
                                    onPressed: () => _pickTime(state.breakEnd, (t) => setDayState(() => state.breakEnd = t)),
                                    child: Text('To ${state.breakEnd.format(context)}'),
                                  ),
                                ],
                              ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          Step(
            title: const Text('Session length'),
            isActive: _step >= 2,
            content: Column(
              children: [
                TextField(
                  controller: _sessionMinutesController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Session length (minutes)', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _bufferMinutesController,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Buffer after each session (minutes)', border: OutlineInputBorder()),
                ),
                if (_errors.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ..._errors.map((e) => Text(e, style: const TextStyle(color: Colors.red))),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
