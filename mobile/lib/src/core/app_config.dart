class AppConfig {
  static const defaultApiBaseUrl =
      'https://acadintern-backend.onrender.com/api';
  static const defaultSocketBaseUrl = 'https://acadintern-backend.onrender.com';
  static const defaultFrontendBaseUrl = 'https://acadintern.mathi.live';
  static const defaultMobileDeepLinkBase = 'acadintern://auth';

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: defaultApiBaseUrl,
  );
  static const socketBaseUrl = String.fromEnvironment(
    'SOCKET_BASE_URL',
    defaultValue: defaultSocketBaseUrl,
  );
  static const googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
  );
  static const mobileDeepLinkBase = String.fromEnvironment(
    'MOBILE_DEEP_LINK_BASE',
    defaultValue: defaultMobileDeepLinkBase,
  );
  static const frontendBaseUrl = String.fromEnvironment(
    'FRONTEND_BASE_URL',
    defaultValue: defaultFrontendBaseUrl,
  );

  static String get normalizedApiBaseUrl {
    return apiBaseUrl;
  }

  static String get normalizedSocketBaseUrl {
    if (socketBaseUrl.isNotEmpty) {
      return socketBaseUrl;
    }
    return normalizedApiBaseUrl.replaceFirst('/api', '');
  }

  static String get normalizedFrontendBaseUrl {
    final trimmed = frontendBaseUrl.trim();
    if (trimmed.endsWith('/')) {
      return trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }
}
