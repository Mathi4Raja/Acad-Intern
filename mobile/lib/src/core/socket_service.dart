import 'dart:async';

import 'package:socket_io_client/socket_io_client.dart' as io;

import 'app_config.dart';

class SocketService {
  io.Socket? _socket;

  final StreamController<Map<String, dynamic>> _messages =
      StreamController.broadcast();
  final StreamController<Map<String, dynamic>> _status =
      StreamController.broadcast();

  Stream<Map<String, dynamic>> get messages => _messages.stream;
  Stream<Map<String, dynamic>> get status => _status.stream;

  bool get isConnected => _socket?.connected == true;

  void connect(String token) {
    if (_socket?.connected == true) {
      return;
    }

    _socket = io.io(
      AppConfig.normalizedSocketBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableForceNew()
          .setAuth({'token': token})
          .build(),
    );

    _socket?.on('new-message', (data) {
      _messages.add(Map<String, dynamic>.from(data as Map));
    });
    _socket?.on('messages-delivered', (data) {
      _status.add({'event': 'delivered', 'data': data});
    });
    _socket?.on('messages-seen', (data) {
      _status.add({'event': 'seen', 'data': data});
    });
    _socket?.on('user-typing', (data) {
      _status.add({'event': 'typing', 'data': data});
    });
    _socket?.on('joined-conversation', (data) {
      _status.add({'event': 'joined-conversation', 'data': data});
    });
    _socket?.on('user-status', (data) {
      _status.add({'event': 'user-status', 'data': data});
    });
    _socket?.on('message-deleted', (data) {
      _status.add({'event': 'message-deleted', 'data': data});
    });
    _socket?.connect();
  }

  void joinApplication(String applicationId) {
    _socket?.emit('join-application', applicationId);
  }

  void leaveApplication(String applicationId) {
    _socket?.emit('leave-application', applicationId);
  }

  void markAsSeen(String applicationId) {
    _socket?.emit('mark-seen', {'applicationId': applicationId});
  }

  void setTyping(String applicationId, bool isTyping) {
    _socket?.emit('typing', {
      'applicationId': applicationId,
      'isTyping': isTyping,
    });
  }

  void deleteMessage({
    required String messageId,
    required String applicationId,
  }) {
    _socket?.emit('delete-message', {
      'messageId': messageId,
      'applicationId': applicationId,
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _messages.close();
    _status.close();
  }
}
