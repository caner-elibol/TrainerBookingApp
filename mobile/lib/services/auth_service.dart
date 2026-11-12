import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/auth_dtos.dart';
import '../models/user.dart';
import '../utils/jwt_decoder.dart';
import 'api_client.dart';

class AuthService {
  AuthService._internal();
  static final AuthService instance = AuthService._internal();

  final ApiClient _api = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const _accessTokenKey = 'pt_access_token';
  static const _refreshTokenKey = 'pt_refresh_token';

  final ValueNotifier<SessionUser?> currentUser = ValueNotifier<SessionUser?>(null);

  String? _accessToken;

  Future<void> restoreSession() async {
    final token = await _storage.read(key: _accessTokenKey);
    if (token == null) return;

    try {
      if (_isExpired(token)) {
        await _tryRefresh();
        return;
      }
      _accessToken = token;
      currentUser.value = SessionUser.fromJwtClaims(decodeJwtPayload(token));
    } catch (_) {
      await logout();
    }
  }

  Future<SessionUser> login(String email, String password) async {
    final json = await _api.post('/api/auth/login', body: {'email': email, 'password': password});
    final auth = AuthResponse.fromJson(json as Map<String, dynamic>);
    await _persist(auth);
    final user = SessionUser.fromJwtClaims(decodeJwtPayload(auth.accessToken));
    currentUser.value = user;
    return user;
  }

  Future<void> logout() async {
    final refreshToken = await _storage.read(key: _refreshTokenKey);
    if (refreshToken != null) {
      try {
        await _api.post('/api/auth/logout', body: {'refreshToken': refreshToken});
      } catch (_) {
      }
    }
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    _accessToken = null;
    currentUser.value = null;
  }

  Future<String?> getValidAccessToken() async {
    if (_accessToken != null && !_isExpired(_accessToken!)) {
      return _accessToken;
    }
    return _tryRefresh();
  }

  Future<String?> _tryRefresh() async {
    final refreshToken = await _storage.read(key: _refreshTokenKey);
    if (refreshToken == null) {
      currentUser.value = null;
      return null;
    }

    try {
      final json = await _api.post('/api/auth/refresh', body: {'refreshToken': refreshToken});
      final auth = AuthResponse.fromJson(json as Map<String, dynamic>);
      await _persist(auth);
      currentUser.value = SessionUser.fromJwtClaims(decodeJwtPayload(auth.accessToken));
      return auth.accessToken;
    } catch (_) {
      await logout();
      return null;
    }
  }

  bool _isExpired(String token) {
    final claims = decodeJwtPayload(token);
    final exp = claims['exp'] as int;
    return DateTime.now().millisecondsSinceEpoch ~/ 1000 >= exp;
  }

  Future<void> _persist(AuthResponse auth) async {
    await _storage.write(key: _accessTokenKey, value: auth.accessToken);
    await _storage.write(key: _refreshTokenKey, value: auth.refreshToken);
    _accessToken = auth.accessToken;
  }
}
