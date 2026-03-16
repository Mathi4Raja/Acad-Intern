import 'package:dio/dio.dart';

import 'app_config.dart';
import 'token_store.dart';

class ApiClient {
  ApiClient(this._tokenStore)
      : dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.normalizedApiBaseUrl,
            connectTimeout: const Duration(seconds: 20),
            receiveTimeout: const Duration(seconds: 20),
            contentType: 'application/json',
          ),
        ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          options.headers['X-Client-Platform'] = 'mobile';
          final token = await _tokenStore.read();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onResponse: (response, handler) async {
          final rotatedToken = response.headers.value('x-auth-token');
          if (rotatedToken != null && rotatedToken.isNotEmpty) {
            await _tokenStore.write(rotatedToken);
          }
          handler.next(response);
        },
      ),
    );
  }

  final Dio dio;
  final TokenStore _tokenStore;
}
