import '../models/appointment_dtos.dart';
import '../models/package_dtos.dart';
import '../models/trainer_dtos.dart';
import 'api_client.dart';
import 'auth_service.dart';

class TrainerApi {
  final ApiClient _api = ApiClient();

  Future<String?> _token() => AuthService.instance.getValidAccessToken();

  Future<TrainerSettings?> getMySettings() async {
    try {
      final json = await _api.get('/api/trainers/me/settings', token: await _token());
      return TrainerSettings.fromJson(json as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<void> completeOnboarding(OnboardingRequest request) async {
    await _api.post('/api/trainers/me/onboarding', body: request.toJson(), token: await _token());
  }

  Future<String> updateCalendarSlug(String slug) async {
    final json = await _api.patch('/api/trainers/me/calendar-slug', body: {'slug': slug}, token: await _token());
    return (json as Map<String, dynamic>)['slug'] as String;
  }

  Future<List<PackageItem>> getMyPackages() async {
    final json = await _api.get('/api/packages/mine', token: await _token());
    return (json as List<dynamic>).map((p) => PackageItem.fromJson(p as Map<String, dynamic>)).toList();
  }

  Future<PackageItem> createPackage(UpsertPackageRequest request) async {
    final json = await _api.post('/api/packages', body: request.toJson(), token: await _token());
    return PackageItem.fromJson(json as Map<String, dynamic>);
  }

  Future<PackageItem> updatePackage(String id, UpsertPackageRequest request) async {
    final json = await _api.put('/api/packages/$id', body: request.toJson(), token: await _token());
    return PackageItem.fromJson(json as Map<String, dynamic>);
  }

  Future<void> deactivatePackage(String id) async {
    await _api.patch('/api/packages/$id/deactivate', token: await _token());
  }

  Future<List<AppointmentSummary>> getMyAppointments({DateTime? from, DateTime? to, String? status}) async {
    final params = <String, String>{};
    if (from != null) params['from'] = _dateOnly(from);
    if (to != null) params['to'] = _dateOnly(to);
    if (status != null) params['status'] = status;
    final query = params.isEmpty ? '' : '?${Uri(queryParameters: params).query}';

    final json = await _api.get('/api/trainers/me/appointments$query', token: await _token());
    return (json as List<dynamic>).map((a) => AppointmentSummary.fromJson(a as Map<String, dynamic>)).toList();
  }

  Future<void> cancelAppointment(String appointmentId) async {
    await _api.post('/api/appointments/$appointmentId/cancel', token: await _token());
  }

  String _dateOnly(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
