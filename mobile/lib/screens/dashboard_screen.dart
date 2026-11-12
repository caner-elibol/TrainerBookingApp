import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/trainer_dtos.dart';
import '../services/auth_service.dart';
import '../services/trainer_api.dart';
import 'appointments_screen.dart';
import 'onboarding_screen.dart';
import 'packages_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _trainerApi = TrainerApi();
  TrainerSettings? _settings;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() => _loading = true);
    try {
      final settings = await _trainerApi.getMySettings();
      if (mounted) setState(() => _settings = settings);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.instance.currentUser.value;
    final isOnboarded = _settings != null;

    return Scaffold(
      appBar: AppBar(
        title: Text('Welcome, ${user?.fullName ?? ''}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => AuthService.instance.logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadSettings,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (!isOnboarded)
                    Card(
                      color: Colors.amber.shade50,
                      child: ListTile(
                        title: const Text("You haven't set up your calendar yet."),
                        trailing: FilledButton(
                          onPressed: () => _openOnboarding(),
                          child: const Text('Finish onboarding'),
                        ),
                      ),
                    ),
                  if (isOnboarded && _settings?.calendarSlug != null) _ShareableLinkCard(slug: _settings!.calendarSlug!),
                  const SizedBox(height: 16),
                  _NavCard(
                    icon: Icons.calendar_today,
                    title: 'Calendar settings',
                    onTap: _openOnboarding,
                  ),
                  _NavCard(
                    icon: Icons.card_giftcard,
                    title: 'Packages',
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PackagesScreen())),
                  ),
                  _NavCard(
                    icon: Icons.event_note,
                    title: 'Appointments',
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AppointmentsScreen())),
                  ),
                ],
              ),
      ),
    );
  }

  Future<void> _openOnboarding() async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => OnboardingScreen(initialSettings: _settings)));
    _loadSettings();
  }
}

class _ShareableLinkCard extends StatelessWidget {
  final String slug;
  const _ShareableLinkCard({required this.slug});

  @override
  Widget build(BuildContext context) {
    final link = 'app.com/pt/$slug';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Your booking link', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(link, style: const TextStyle(fontFamily: 'monospace')),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.copy),
              onPressed: () {
                Clipboard.setData(ClipboardData(text: link));
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied')));
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _NavCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _NavCard({required this.icon, required this.title, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
