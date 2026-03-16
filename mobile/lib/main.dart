import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app.dart';
import 'src/core/providers.dart';
import 'src/core/push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase remains optional until native config files are added.
  }

  final container = ProviderContainer();
  await container.read(sessionControllerProvider.notifier).restore();
  await container.read(pushBootstrapProvider.future);

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const AcadInternStudentApp(),
    ),
  );
}
