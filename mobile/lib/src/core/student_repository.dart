import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'api_client.dart';
import 'app_config.dart';
import 'models.dart';

class NonStudentAccountException implements Exception {
  const NonStudentAccountException(this.message);

  final String message;

  @override
  String toString() => message;
}

class StudentRepository {
  StudentRepository(this._client);

  final ApiClient _client;

  bool _looksLikeDeveloperError(String value) {
    final lower = value.toLowerCase();
    return lower.contains('apiexception: 10') ||
        lower.contains('apiexception: 12500') ||
        lower.contains('developer_error') ||
        lower.contains('statuscode=10');
  }

  void _ensureStudentAccess(UserSummary user) {
    if (user.role.toLowerCase() != 'student') {
      throw const NonStudentAccountException(
        'This mobile app is available only for student accounts.',
      );
    }
  }

  Future<void> _clearGoogleSelection(GoogleSignIn signIn) async {
    try {
      await signIn.signOut();
    } catch (_) {}
  }

  Future<AppSession> restoreSession(String token) async {
    final response = await _client.dio.get(
      '/auth/me',
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
      ),
    );
    final data = response.data['data'] as Map<String, dynamic>;
    final user = UserSummary.fromJson(data['user'] as Map<String, dynamic>);
    _ensureStudentAccess(user);
    return AppSession(
      token: token,
      user: user,
      profile: data['profile'] == null
          ? null
          : StudentProfileModel.fromJson(
              data['profile'] as Map<String, dynamic>),
    );
  }

  Future<AppSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.dio.post(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
        'expectedRole': 'student',
      },
    );
    final data = response.data['data'] as Map<String, dynamic>;
    final token = data['token'].toString();
    final session = await restoreSession(token);
    return AppSession(
        token: token, user: session.user, profile: session.profile);
  }

  Future<AppSession> signup({
    required String name,
    required String email,
    required String password,
    required String department,
    int? semester,
  }) async {
    final response = await _client.dio.post(
      '/auth/signup',
      data: {
        'name': name,
        'email': email,
        'password': password,
        'role': 'student',
        'department': department,
        'semester': semester,
      },
    );
    final data = response.data['data'] as Map<String, dynamic>;
    final token = data['token'].toString();
    final session = await restoreSession(token);
    return AppSession(
        token: token, user: session.user, profile: session.profile);
  }

  Future<AppSession> googleLogin() async {
    final signIn = GoogleSignIn(
      serverClientId: AppConfig.googleServerClientId.isEmpty
          ? null
          : AppConfig.googleServerClientId,
    );
    try {
      // Force account chooser every time instead of silently reusing
      // the previously selected Google account.
      await _clearGoogleSelection(signIn);
      final account = await signIn.signIn();
      if (account == null) {
        throw Exception('Google sign-in cancelled');
      }
      final auth = await account.authentication;
      if (auth.idToken == null || auth.idToken!.isEmpty) {
        throw Exception(
          'Missing Google ID token. Set GOOGLE_SERVER_CLIENT_ID to your Google OAuth Web client ID in env.local.json.',
        );
      }
      final response = await _client.dio.post(
        '/auth/google',
        data: {
          'idToken': auth.idToken,
          'expectedRole': 'student',
        },
      );
      final data = response.data['data'] as Map<String, dynamic>;
      final token = data['token'].toString();
      final session = await restoreSession(token);
      // Keep backend session token, but clear Google local selection so
      // next tap on "Continue with Google" shows account picker again.
      await _clearGoogleSelection(signIn);
      return AppSession(
          token: token, user: session.user, profile: session.profile);
    } on NonStudentAccountException {
      await _clearGoogleSelection(signIn);
      rethrow;
    } on DioException {
      await _clearGoogleSelection(signIn);
      rethrow;
    } on PlatformException catch (e) {
      final raw = '${e.code} ${e.message ?? ''} ${e.details ?? ''}'.trim();
      if (_looksLikeDeveloperError(raw)) {
        throw Exception(
          'Google Sign-In Android config mismatch (ApiException 10). Verify package name `mathi.acadintern.app`, register SHA-1/SHA-256 for the signing key, and use Web client ID in GOOGLE_SERVER_CLIENT_ID.',
        );
      }
      if (e.code == 'sign_in_canceled' || e.code == 'canceled') {
        throw Exception('Google sign-in cancelled');
      }
      await _clearGoogleSelection(signIn);
      throw Exception('Google Sign-In failed: $raw');
    } catch (_) {
      await _clearGoogleSelection(signIn);
      rethrow;
    }
  }

  Future<void> resendVerification(String email) async {
    await _client.dio.post('/auth/resend-verification', data: {'email': email});
  }

  Future<void> forgotPassword(String email) async {
    await _client.dio.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> verifyEmail(String token) async {
    await _client.dio
        .get('/auth/verify-email', queryParameters: {'token': token});
  }

  Future<void> verifyResetToken(String token) async {
    await _client.dio.get('/auth/reset-password/$token');
  }

  Future<void> resetPassword({
    required String token,
    required String password,
  }) async {
    await _client.dio
        .post('/auth/reset-password/$token', data: {'password': password});
  }

  Future<void> logout() async {
    await _client.dio.post('/auth/logout');
  }

  Future<void> deleteAccount() async {
    await _client.dio.delete('/auth/account');
  }

  Future<StudentProfileModel> getProfile() async {
    final response = await _client.dio.get('/students/profile/me');
    return StudentProfileModel.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<StudentProfileModel> updateProfile(StudentProfileModel profile) async {
    final response =
        await _client.dio.post('/students/profile', data: profile.toJson());
    return StudentProfileModel.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<String> uploadFile({
    required String path,
    required String type,
  }) async {
    final form = FormData.fromMap({
      'type': type,
      'file': await MultipartFile.fromFile(
        path,
        filename: path.split(Platform.pathSeparator).last,
      ),
    });
    final response = await _client.dio.post('/upload', data: form);
    return response.data['data']['url'].toString();
  }

  Future<List<InternshipModel>> fetchInternships({
    String? search,
    String? mode,
    String? minStipend,
    String? maxDuration,
    String? companyId,
    bool preferMatch = true,
    int? page,
    int? limit,
  }) async {
    final query = <String, dynamic>{};
    if (search != null && search.isNotEmpty) {
      query['search'] = search;
    }
    if (mode != null && mode.isNotEmpty) {
      query['mode'] = mode;
    }
    if (minStipend != null && minStipend.isNotEmpty) {
      query['minStipend'] = minStipend;
    }
    if (maxDuration != null && maxDuration.isNotEmpty) {
      query['duration'] = maxDuration;
    }
    if (companyId != null && companyId.isNotEmpty) {
      query['companyId'] = companyId;
    }
    if (page != null) {
      query['page'] = page;
    }
    if (limit != null) {
      query['limit'] = limit;
    }

    Response<dynamic> response;
    if (preferMatch) {
      try {
        response =
            await _client.dio.get('/internships/match', queryParameters: query);
      } on DioException {
        response =
            await _client.dio.get('/internships', queryParameters: query);
      }
    } else {
      response = await _client.dio.get('/internships', queryParameters: query);
    }

    final items = (response.data['data'] as List? ?? const []);
    return items
        .map((item) => InternshipModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<InternshipModel> getInternship(String id) async {
    final response = await _client.dio.get('/internships/$id');
    return InternshipModel.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<void> incrementInternshipView(String id) async {
    await _client.dio.patch('/internships/$id/views');
  }

  Future<void> applyToInternship(String id, {String notes = ''}) async {
    await _client.dio
        .post('/applications/internships/$id/apply', data: {'notes': notes});
  }

  Future<List<CompanyModel>> fetchCompanies({String? search}) async {
    return fetchCompaniesWithFilters(search: search);
  }

  Future<List<CompanyModel>> fetchCompaniesWithFilters({
    String? search,
    String? industry,
    String? location,
    bool? verified,
    int? page,
    int? limit,
  }) async {
    final response = await _client.dio.get('/companies', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (industry != null && industry.isNotEmpty) 'industry': industry,
      if (location != null && location.isNotEmpty) 'location': location,
      if (verified != null) 'verified': '$verified',
      if (page != null) 'page': page,
      if (limit != null) 'limit': limit,
    });
    final items = (response.data['data'] as List? ?? const []);
    return items
        .map((item) => CompanyModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<CompanyModel> getCompany(String id) async {
    final response = await _client.dio.get('/companies/$id');
    return CompanyModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<List<ApplicationModel>> fetchApplications() async {
    final response = await _client.dio.get('/applications/my');
    final items = (response.data['data'] as List? ?? const []);
    return items
        .map((item) => ApplicationModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> getApplication(String id) async {
    final response = await _client.dio.get('/applications/$id');
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<List<ConversationModel>> fetchConversations() async {
    final response = await _client.dio.get('/messages/conversations');
    final items = (response.data['data'] as List? ?? const []);
    return items
        .map((item) => ConversationModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<ChatMessageModel>> fetchMessages(String applicationId) async {
    final response =
        await _client.dio.get('/messages/application/$applicationId');
    final items = (response.data['data'] as List? ?? const []);
    return items
        .map((item) => ChatMessageModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> sendMessage(String applicationId, String content) async {
    await _client.dio.post('/messages/application/$applicationId',
        data: {'content': content});
  }

  Future<void> sendMessageWithFiles(
    String applicationId,
    String content,
    List<String> filePaths,
  ) async {
    final files = <MultipartFile>[];
    for (final path in filePaths) {
      files.add(
        await MultipartFile.fromFile(
          path,
          filename: path.split(Platform.pathSeparator).last,
        ),
      );
    }
    final form = FormData.fromMap({
      'content': content,
      'files': files,
    });
    await _client.dio.post('/messages/application/$applicationId', data: form);
  }

  Future<void> markConversationSeen(String applicationId) async {
    await _client.dio.patch('/messages/application/$applicationId/seen');
  }

  Future<Map<String, dynamic>> getConversationPreferences(
      String applicationId) async {
    final response =
        await _client.dio.get('/messages/application/$applicationId/preferences');
    return response.data['data'] as Map<String, dynamic>? ??
        const {'mutedUntil': null};
  }

  Future<void> muteConversation(String applicationId, String? isoTime) async {
    await _client.dio.post(
      '/messages/application/$applicationId/mute',
      data: {'mutedUntil': isoTime},
    );
  }

  Future<void> deleteConversation(String applicationId) async {
    await _client.dio.delete('/messages/application/$applicationId');
  }

  Future<void> createReport(Map<String, dynamic> payload) async {
    await _client.dio.post('/reports', data: payload);
  }

  Future<AnalyticsModel> fetchAnalytics() async {
    final response = await _client.dio.get('/analytics/student');
    return AnalyticsModel(raw: response.data['data'] as Map<String, dynamic>);
  }

  Future<List<AppNotificationModel>> fetchNotifications() async {
    final response = await _client.dio.get('/notifications');
    final items = (response.data['data']['items'] as List? ?? const []);
    return items
        .map((item) =>
            AppNotificationModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<int> fetchUnreadMessageCount() async {
    final response = await _client.dio.get('/messages/unread-count');
    return (response.data['data']?['unreadCount'] as num?)?.toInt() ?? 0;
  }

  Future<void> markNotificationRead(String id) async {
    await _client.dio.patch('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _client.dio.patch('/notifications/read-all');
  }

  Future<void> registerDevice({
    required String fcmToken,
    required String platform,
    String? deviceName,
    String? appVersion,
  }) async {
    await _client.dio.post(
      '/mobile/devices',
      data: {
        'fcmToken': fcmToken,
        'platform': platform,
        if (deviceName != null) 'deviceName': deviceName,
        if (appVersion != null) 'appVersion': appVersion,
      },
    );
  }

  Future<void> unregisterDevice(String fcmToken) async {
    await _client.dio.delete('/mobile/devices', data: {'fcmToken': fcmToken});
  }
}
