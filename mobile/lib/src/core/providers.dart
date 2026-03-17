import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

import 'api_client.dart';
import 'models.dart';
import 'push_service.dart';
import 'socket_service.dart';
import 'student_repository.dart';
import 'token_store.dart';

final secureStorageProvider = Provider((ref) => const FlutterSecureStorage());

final tokenStoreProvider = Provider<TokenStore>(
  (ref) => TokenStore(ref.watch(secureStorageProvider)),
);

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(tokenStoreProvider)),
);

final studentRepositoryProvider = Provider<StudentRepository>(
  (ref) => StudentRepository(ref.watch(apiClientProvider)),
);

final pushServiceProvider = Provider<PushService>((ref) {
  final service = PushService(ref.watch(studentRepositoryProvider));
  ref.onDispose(() {
    service.dispose();
  });
  return service;
});

final pushNavigationProvider = StreamProvider<String>((ref) {
  return ref.watch(pushServiceProvider).navigationStream;
});

final inboxRefreshTriggerProvider = StateProvider<int>((ref) => 0);
final activeChatIdProvider = StateProvider<String?>((ref) => null);

final inboxCountsProvider = FutureProvider<InboxCounts>((ref) async {
  ref.watch(inboxRefreshTriggerProvider);
  final repository = ref.watch(studentRepositoryProvider);
  final unreadMessages = await repository.fetchUnreadMessageCount();
  final notifications = await repository.fetchNotifications();
  final unreadNotifications = notifications.where((item) => !item.read).length;
  return InboxCounts(
    unreadMessages: unreadMessages,
    unreadNotifications: unreadNotifications,
  );
});

class SessionController extends StateNotifier<AsyncValue<AppSession?>> {
  SessionController(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;

  TokenStore get _tokenStore => _ref.read(tokenStoreProvider);
  StudentRepository get _repository => _ref.read(studentRepositoryProvider);

  Future<void> _registerCurrentDevice() async {
    try {
      await _ref.read(pushServiceProvider).syncTokenWithBackend();
    } catch (_) {}
  }

  Future<void> restore() async {
    final token = await _tokenStore.read();
    if (token == null || token.isEmpty) {
      state = const AsyncValue.data(null);
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _repository.restoreSession(token));

    final error = state.error;
    if (error is DioException) {
      final status = error.response?.statusCode;
      if (status == 401 || status == 403) {
        await _tokenStore.clear();
        state = const AsyncValue.data(null);
      }
      return;
    }

    if (error is NonStudentAccountException) {
      await _tokenStore.clear();
      state = const AsyncValue.data(null);
      return;
    }

    final session = state.valueOrNull;
    if (session != null) {
      await _registerCurrentDevice();
      _ref.read(socketServiceProvider).connect(session.token);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await _repository.login(email: email, password: password);
      await _tokenStore.write(session.token);
      await _registerCurrentDevice();
      _ref.read(socketServiceProvider).connect(session.token);
      return session;
    });
  }

  Future<void> signup({
    required String name,
    required String email,
    required String password,
    required String department,
    int? semester,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await _repository.signup(
        name: name,
        email: email,
        password: password,
        department: department,
        semester: semester,
      );
      await _tokenStore.write(session.token);
      await _registerCurrentDevice();
      _ref.read(socketServiceProvider).connect(session.token);
      return session;
    });
  }

  Future<void> googleLogin() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await _repository.googleLogin();
      await _tokenStore.write(session.token);
      await _registerCurrentDevice();
      _ref.read(socketServiceProvider).connect(session.token);
      return session;
    });
  }

  Future<void> refresh() async {
    final current = state.valueOrNull;
    if (current == null) {
      await restore();
      return;
    }
    state =
        await AsyncValue.guard(() => _repository.restoreSession(current.token));

    final error = state.error;
    if (error is DioException) {
      final status = error.response?.statusCode;
      if (status == 401 || status == 403) {
        await _tokenStore.clear();
        state = const AsyncValue.data(null);
      }
      return;
    }

    if (error is NonStudentAccountException) {
      await _tokenStore.clear();
      state = const AsyncValue.data(null);
    }
  }

  Future<void> logout() async {
    try {
      await _ref.read(pushServiceProvider).unregisterCurrentDevice();
    } catch (_) {}
    try {
      await _repository.logout();
    } catch (_) {}
    await _tokenStore.clear();
    _ref.read(socketServiceProvider).disconnect();
    state = const AsyncValue.data(null);
  }
}

final sessionControllerProvider =
    StateNotifierProvider<SessionController, AsyncValue<AppSession?>>(
  (ref) => SessionController(ref),
);

class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(this.ref) {
    ref.listen(sessionControllerProvider, (_, __) => notifyListeners());
  }

  final Ref ref;
}

final routerRefreshProvider = Provider<RouterRefreshNotifier>(
  (ref) => RouterRefreshNotifier(ref),
);

final socketServiceProvider = Provider<SocketService>((ref) {
  final socketService = SocketService();
  ref.onDispose(socketService.dispose);
  return socketService;
});

final pushBootstrapProvider = FutureProvider<void>((ref) async {
  final service = ref.watch(pushServiceProvider);
  await service.initialize();
});
