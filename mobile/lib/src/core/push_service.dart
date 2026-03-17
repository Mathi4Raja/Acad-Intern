import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'student_repository.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
}

class PushService {
  PushService(this._repository);

  final StudentRepository _repository;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final StreamController<String> _navigationController =
      StreamController<String>.broadcast();

  static const String _defaultChannelId = 'student_notifications';
  static const String _defaultChannelName = 'Student Notifications';
  static const String _defaultChannelDescription =
      'AcadIntern student app updates and alerts';

  static const AndroidNotificationChannel _defaultChannel =
      AndroidNotificationChannel(
        _defaultChannelId,
        _defaultChannelName,
        description: _defaultChannelDescription,
        importance: Importance.high,
      );

  StreamSubscription<RemoteMessage>? _onMessageSubscription;
  StreamSubscription<RemoteMessage>? _onMessageOpenedSubscription;
  StreamSubscription<String>? _tokenRefreshSubscription;
  bool _initialized = false;

  Stream<String> get navigationStream => _navigationController.stream;

  String _platformName() {
    if (Platform.isAndroid) return 'android';
    if (Platform.isIOS) return 'ios';
    return 'unknown';
  }

  String _resolveRoute(RemoteMessage message) {
    final data = message.data;
    final route = data['route']?.toString();
    if (route != null && route.trim().isNotEmpty) {
      return route.startsWith('/') ? route : '/$route';
    }

    final applicationId = data['applicationId']?.toString();
    if (applicationId != null && applicationId.isNotEmpty) {
      return '/messages/$applicationId';
    }

    final internshipId = data['internshipId']?.toString();
    if (internshipId != null && internshipId.isNotEmpty) {
      return '/internships/$internshipId';
    }

    return '/notifications';
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) {
      return;
    }
    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _defaultChannelId,
          _defaultChannelName,
          channelDescription: _defaultChannelDescription,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: jsonEncode(message.data),
    );
  }

  void _emitRouteFromMessage(RemoteMessage message) {
    final route = _resolveRoute(message);
    if (!_navigationController.isClosed) {
      _navigationController.add(route);
    }
  }

  Future<void> _configureNotificationChannels() async {
    if (!Platform.isAndroid) {
      return;
    }
    final androidPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    if (androidPlugin == null) {
      debugPrint('PushService: Android notifications plugin unavailable');
      return;
    }
    await androidPlugin.createNotificationChannel(_defaultChannel);
    final wasEnabled = await androidPlugin.areNotificationsEnabled();
    debugPrint('PushService: Android notifications enabled=$wasEnabled');
    try {
      final granted = await androidPlugin.requestNotificationsPermission();
      debugPrint('PushService: Android notification request result=$granted');
    } catch (error) {
      debugPrint(
        'PushService: Android notification request failed: $error',
      );
    }
    final isEnabled = await androidPlugin.areNotificationsEnabled();
    debugPrint('PushService: Android notifications enabled(after)=$isEnabled');
  }

  void _handleLocalNotificationTap(String? payload) {
    if (payload == null || payload.isEmpty || _navigationController.isClosed) {
      return;
    }
    try {
      final decoded = jsonDecode(payload);
      if (decoded is! Map<String, dynamic>) {
        _navigationController.add('/notifications');
        return;
      }
      final route = decoded['route']?.toString();
      if (route != null && route.trim().isNotEmpty) {
        _navigationController.add(route.startsWith('/') ? route : '/$route');
        return;
      }
      final applicationId = decoded['applicationId']?.toString();
      if (applicationId != null && applicationId.isNotEmpty) {
        _navigationController.add('/messages/$applicationId');
        return;
      }
      final internshipId = decoded['internshipId']?.toString();
      if (internshipId != null && internshipId.isNotEmpty) {
        _navigationController.add('/internships/$internshipId');
        return;
      }
    } catch (_) {}
    _navigationController.add('/notifications');
  }

  Future<void> syncTokenWithBackend() async {
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('PushService: FCM token missing');
      return;
    }
    debugPrint('PushService: FCM token=$token');
    try {
      await _repository.registerDevice(
        fcmToken: token,
        platform: _platformName(),
      );
      debugPrint('PushService: token registered with backend');
    } catch (error) {
      debugPrint('PushService: token register failed: $error');
    }
  }

  Future<void> unregisterCurrentDevice() async {
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) {
      return;
    }
    await _repository.unregisterDevice(token);
  }

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }
    _initialized = true;

    try {
      await _localNotifications.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/launcher_icon'),
          iOS: DarwinInitializationSettings(),
        ),
        onDidReceiveNotificationResponse: (response) {
          _handleLocalNotificationTap(response.payload);
        },
      );
    } catch (error) {
      debugPrint('PushService: local notifications init failed: $error');
      return;
    }

    try {
      await _configureNotificationChannels();
    } catch (error) {
      debugPrint('PushService: channel setup failed: $error');
    }

    final messaging = FirebaseMessaging.instance;
    try {
      final permission = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      debugPrint(
        'PushService: permission status=${permission.authorizationStatus}',
      );
    } catch (error) {
      debugPrint('PushService: permission request failed: $error');
    }

    try {
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (error) {
      debugPrint(
        'PushService: foreground presentation setup failed: $error',
      );
    }

    try {
      await syncTokenWithBackend();
    } catch (_) {
      // Device registration requires auth and is retried after login.
    }

    _onMessageSubscription = FirebaseMessaging.onMessage.listen((message) async {
      debugPrint(
        'PushService: foreground message data=${message.data} notification=${message.notification?.title}',
      );
      await _showForegroundNotification(message);
    });

    _onMessageOpenedSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
      (message) {
        debugPrint(
          'PushService: notification opened data=${message.data}',
        );
        _emitRouteFromMessage(message);
      },
    );

    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      debugPrint(
        'PushService: initial message data=${initialMessage.data}',
      );
      _emitRouteFromMessage(initialMessage);
    }

    _tokenRefreshSubscription =
        FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
      if (token.isEmpty) {
        return;
      }
      debugPrint('PushService: token refreshed=$token');
      try {
        await _repository.registerDevice(
          fcmToken: token,
          platform: _platformName(),
        );
        debugPrint('PushService: refreshed token registered');
      } catch (_) {}
    });
  }

  Future<void> dispose() async {
    await _onMessageSubscription?.cancel();
    await _onMessageOpenedSubscription?.cancel();
    await _tokenRefreshSubscription?.cancel();
    await _navigationController.close();
  }
}
