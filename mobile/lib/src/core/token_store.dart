import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStore {
  TokenStore(this._storage);

  final FlutterSecureStorage _storage;
  static const _key = 'student_auth_token';
  String? _cachedToken;

  Future<String?> read() async {
    _cachedToken ??= await _storage.read(key: _key);
    return _cachedToken;
  }

  Future<void> write(String token) async {
    _cachedToken = token;
    await _storage.write(key: _key, value: token);
  }

  Future<void> clear() async {
    _cachedToken = null;
    await _storage.delete(key: _key);
  }
}
