import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}

class ApiClient {
  final http.Client _client = http.Client();

  Future<dynamic> get(String path, {String? token}) async {
    final response = await _client.get(Uri.parse('${AppConfig.apiBaseUrl}$path'), headers: _headers(token));
    return _handle(response);
  }

  Future<dynamic> post(String path, {Object? body, String? token}) async {
    final response = await _client.post(
      Uri.parse('${AppConfig.apiBaseUrl}$path'),
      headers: _headers(token),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handle(response);
  }

  Future<dynamic> put(String path, {Object? body, String? token}) async {
    final response = await _client.put(
      Uri.parse('${AppConfig.apiBaseUrl}$path'),
      headers: _headers(token),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handle(response);
  }

  Future<dynamic> patch(String path, {Object? body, String? token}) async {
    final response = await _client.patch(
      Uri.parse('${AppConfig.apiBaseUrl}$path'),
      headers: _headers(token),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handle(response);
  }

  Map<String, String> _headers(String? token) => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  dynamic _handle(http.Response response) {
    final hasBody = response.body.isNotEmpty;
    final decoded = hasBody ? jsonDecode(response.body) : null;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    final message = _extractErrorMessage(decoded) ?? 'Request failed (${response.statusCode}).';
    throw ApiException(response.statusCode, message);
  }

  String? _extractErrorMessage(dynamic decoded) {
    if (decoded is! Map<String, dynamic>) return null;
    if (decoded['error'] is String) return decoded['error'] as String;
    if (decoded['errors'] is List) {
      final list = (decoded['errors'] as List);
      if (list.isNotEmpty) return list.first.toString();
    }
    if (decoded['title'] is String) return decoded['title'] as String;
    return null;
  }
}
