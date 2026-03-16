import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class DeepLinkHandler extends StatefulWidget {
  const DeepLinkHandler({
    super.key,
    required this.router,
    required this.child,
  });

  final GoRouter router;
  final Widget child;

  @override
  State<DeepLinkHandler> createState() => _DeepLinkHandlerState();
}

class _DeepLinkHandlerState extends State<DeepLinkHandler> {
  StreamSubscription<Uri>? _subscription;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final appLinks = AppLinks();
    try {
      final initialUri = await appLinks.getInitialLink();
      if (initialUri != null) {
        _handleUri(initialUri);
      }
    } catch (_) {}

    _subscription = appLinks.uriLinkStream.listen(_handleUri);
  }

  void _handleUri(Uri uri) {
    final legacyPath = uri.queryParameters['path'];
    final path = (legacyPath != null && legacyPath.isNotEmpty)
        ? (legacyPath.startsWith('/') ? legacyPath : '/$legacyPath')
        : (uri.path.isNotEmpty && uri.path != '/' ? uri.path : null);
    final token = uri.queryParameters['token'];

    if (path == null || path.isEmpty) {
      return;
    }

    if (path == '/verify-email') {
      if (token != null && token.isNotEmpty) {
        widget.router
            .go('/verify-email?token=${Uri.encodeQueryComponent(token)}');
      } else {
        widget.router.go('/verify-email');
      }
      return;
    }

    if (path == '/reset-password') {
      if (token != null && token.isNotEmpty) {
        widget.router
            .go('/reset-password?token=${Uri.encodeQueryComponent(token)}');
      } else {
        widget.router.go('/reset-password');
      }
      return;
    }

    if (legacyPath != null && legacyPath.isNotEmpty) {
      widget.router.go(path);
      return;
    }

    final query = uri.query;
    widget.router.go(query.isEmpty ? path : '$path?$query');
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
