const String roleClaimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

class SessionUser {
  final String id;
  final String email;
  final String fullName;
  final String role;

  const SessionUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
  });

  bool get isTrainer => role == 'Trainer';

  factory SessionUser.fromJwtClaims(Map<String, dynamic> claims) {
    return SessionUser(
      id: claims['sub'] as String,
      email: claims['email'] as String? ?? '',
      fullName: claims['name'] as String? ?? '',
      role: claims[roleClaimKey] as String? ?? '',
    );
  }
}
