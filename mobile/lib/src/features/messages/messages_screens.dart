import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_file_dialog/flutter_file_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import '../../core/models.dart';
import '../../core/providers.dart';
import '../shell/student_shell.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key, this.highlightedApplicationId});

  final String? highlightedApplicationId;

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  List<ConversationModel> _conversations = const [];
  bool _loading = true;
  String? _error;
  String _query = '';
  bool _deepLinked = false;
  StreamSubscription<Map<String, dynamic>>? _messageSubscription;
  StreamSubscription<Map<String, dynamic>>? _statusSubscription;

  @override
  void initState() {
    super.initState();
    _loadConversations(showLoading: true);
    _messageSubscription =
        ref.read(socketServiceProvider).messages.listen((data) {
      _handleMessageEvent(data);
    });
    _statusSubscription =
        ref.read(socketServiceProvider).status.listen((event) {
      final eventName = event['event']?.toString();
      if (eventName == 'conversation-updated') {
        final data = event['data'] as Map<String, dynamic>? ?? {};
        _handleConversationUpdated(data);
      } else if (eventName == 'seen') {
        final data = event['data'] as Map<String, dynamic>? ?? {};
        _handleConversationSeen(data);
      }
    });
    if (widget.highlightedApplicationId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _tryDeepLinkOpen());
    }
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _statusSubscription?.cancel();
    super.dispose();
  }

  Future<void> _tryDeepLinkOpen() async {
    if (_deepLinked || widget.highlightedApplicationId == null) return;
    _deepLinked = true;

    final applicationId = widget.highlightedApplicationId!;
    final conversations = _conversations.isNotEmpty
        ? _conversations
        : await ref.read(studentRepositoryProvider).fetchConversations();
    if (_conversations.isEmpty && mounted) {
      setState(() {
        _conversations = conversations;
        _loading = false;
      });
    }
    final existing = conversations.where((item) => item.applicationId == applicationId);
    if (!mounted) return;

    if (existing.isNotEmpty) {
      final conversation = existing.first;
      context.push(
        '/messages/${conversation.applicationId}?name=${Uri.encodeComponent(conversation.otherPartyName)}',
      );
      return;
    }

    try {
      final application =
          await ref.read(studentRepositoryProvider).getApplication(applicationId);
      final internship = application['internshipId'] as Map<String, dynamic>? ?? {};
      final company = internship['companyId'] as Map<String, dynamic>? ?? {};
      final companyName = company['companyName']?.toString() ?? 'Conversation';
      if (mounted) {
        context.push(
          '/messages/$applicationId?name=${Uri.encodeComponent(companyName)}',
        );
      }
    } catch (_) {}
  }

  Future<void> _loadConversations({bool showLoading = false}) async {
    if (!mounted) return;
    if (showLoading) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final next = await ref.read(studentRepositoryProvider).fetchConversations();
      if (!mounted) return;
      setState(() {
        _conversations = next;
        _loading = false;
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Failed to load conversations';
      });
    }
  }

  Future<void> _reload() async {
    await _loadConversations(showLoading: false);
  }

  DateTime? _parseMessageTime(Map<String, dynamic>? message) {
    final raw = message?['createdAt']?.toString();
    if (raw == null || raw.isEmpty) return null;
    return DateTime.tryParse(raw)?.toLocal();
  }

  ConversationModel _mergeConversation(
    ConversationModel existing, {
    String? lastMessage,
    DateTime? lastMessageAt,
    int? unreadCount,
  }) {
    return ConversationModel(
      applicationId: existing.applicationId,
      otherPartyName: existing.otherPartyName,
      internshipTitle: existing.internshipTitle,
      unreadCount: unreadCount ?? existing.unreadCount,
      lastMessage: lastMessage ?? existing.lastMessage,
      applicationStatus: existing.applicationStatus,
      lastMessageAt: lastMessageAt ?? existing.lastMessageAt,
      companyLogo: existing.companyLogo,
      studentProfilePicture: existing.studentProfilePicture,
    );
  }

  bool _updateConversation(
    String applicationId,
    ConversationModel Function(ConversationModel existing) updater,
  ) {
    final index =
        _conversations.indexWhere((item) => item.applicationId == applicationId);
    if (index == -1) return false;
    final next = [..._conversations];
    next[index] = updater(next[index]);
    if (mounted) {
      setState(() => _conversations = next);
    }
    return true;
  }

  void _handleMessageEvent(Map<String, dynamic> data) {
    final message = data['message'] as Map<String, dynamic>? ?? {};
    final applicationId =
        (message['applicationId'] ?? data['applicationId'])?.toString() ?? '';
    if (applicationId.isEmpty) return;
    final updated = _updateConversation(applicationId, (existing) {
      return _mergeConversation(
        existing,
        lastMessage: message['content']?.toString(),
        lastMessageAt: _parseMessageTime(message),
      );
    });
    if (!updated) {
      _reload();
    }
  }

  void _handleConversationUpdated(Map<String, dynamic> data) {
    final applicationId = data['applicationId']?.toString() ?? '';
    if (applicationId.isEmpty) return;

    final message = data['message'] as Map<String, dynamic>? ?? {};
    final increment = (data['unreadCountIncrement'] as num?)?.toInt();
    final activeChatId = ref.read(activeChatIdProvider);
    final updated = _updateConversation(applicationId, (existing) {
      var unread = existing.unreadCount;
      if (increment != null) {
        unread = activeChatId == applicationId ? 0 : unread + increment;
      } else if (activeChatId == applicationId) {
        unread = 0;
      }
      return _mergeConversation(
        existing,
        lastMessage: message['content']?.toString(),
        lastMessageAt: _parseMessageTime(message),
        unreadCount: unread,
      );
    });
    if (!updated) {
      _reload();
    }
  }

  void _handleConversationSeen(Map<String, dynamic> data) {
    final applicationId = data['applicationId']?.toString() ?? '';
    if (applicationId.isEmpty) return;
    final seenBy = data['userId']?.toString();
    final currentUserId = ref.read(sessionControllerProvider).value?.user.id;
    if (currentUserId == null || seenBy != currentUserId) return;
    final updated = _updateConversation(applicationId, (existing) {
      return _mergeConversation(existing, unreadCount: 0);
    });
    if (!updated) {
      _reload();
    }
  }

  String _formatLastSeen(DateTime? timestamp) {
    if (timestamp == null) return '';
    final now = DateTime.now();
    final sameDay = now.year == timestamp.year &&
        now.month == timestamp.month &&
        now.day == timestamp.day;
    return sameDay ? DateFormat.jm().format(timestamp) : DateFormat('d MMM').format(timestamp);
  }

  String _messagePreview(String? rawMessage) {
    final text = (rawMessage ?? '').trim();
    if (text.isEmpty) return 'No messages yet';
    final uri = Uri.tryParse(text);
    if (uri != null && (uri.scheme == 'http' || uri.scheme == 'https')) {
      return 'Shared a link';
    }
    return text;
  }

  Future<void> _confirmDeleteConversation(ConversationModel conversation) async {
    final repository = ref.read(studentRepositoryProvider);
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete conversation'),
          content: Text(
            'Delete chat with ${conversation.otherPartyName}?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
    if (shouldDelete != true) return;
    await repository.deleteConversation(conversation.applicationId);
    ref.read(inboxRefreshTriggerProvider.notifier).state++;
    await _reload();
  }

  @override
  Widget build(BuildContext context) {
    return StudentPageScaffold(
      title: 'Messages',
      body: RefreshIndicator(
        onRefresh: _reload,
        child: Builder(
          builder: (context) {
            if (_loading && _conversations.isEmpty) {
                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                    children: const [
                      SizedBox(height: 140),
                      Center(child: CircularProgressIndicator()),
                    ],
                  );
                }
                if (_error != null && _conversations.isEmpty) {
                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                    children: [
                      const SizedBox(height: 140),
                      Center(child: Text(_error!)),
                    ],
                  );
                }
                final conversations = _conversations;
                final filtered = conversations.where((item) {
                  if (_query.isEmpty) return true;
                  final q = _query.toLowerCase();
                  return item.otherPartyName.toLowerCase().contains(q) ||
                      item.internshipTitle.toLowerCase().contains(q);
                }).toList();

                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                  children: [
                    TextField(
                      decoration: const InputDecoration(
                        hintText: 'Search conversations...',
                        prefixIcon: Icon(Icons.search_rounded),
                      ),
                      onChanged: (value) =>
                          setState(() => _query = value.trim()),
                    ),
                    const SizedBox(height: 8),
                    if (filtered.isEmpty)
                      const EmptyStatePanel(
                        title: 'No conversations',
                        subtitle: 'Your conversation threads will appear here.',
                        icon: Icons.forum_outlined,
                      )
                    else
                      ...filtered.map(
                        (conversation) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Dismissible(
                            key: ValueKey(conversation.applicationId),
                            direction: DismissDirection.startToEnd,
                            confirmDismiss: (_) async {
                              await _confirmDeleteConversation(conversation);
                              return false;
                            },
                            background: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              alignment: Alignment.centerLeft,
                              decoration: BoxDecoration(
                                color: const Color(0xFFEF4444),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.delete_outline_rounded,
                                      color: Colors.white),
                                  SizedBox(width: 6),
                                  Text(
                                    'Delete',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(14),
                              onTap: () async {
                                await context.push(
                                  '/messages/${conversation.applicationId}?name=${Uri.encodeComponent(conversation.otherPartyName)}',
                                );
                                if (mounted) {
                                  ref
                                      .read(inboxRefreshTriggerProvider.notifier)
                                      .state++;
                                  await _reload();
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border:
                                      Border.all(color: const Color(0xFFE5E7EB)),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    CircleAvatar(
                                      radius: 23,
                                      backgroundColor: const Color(0xFFEFF6FF),
                                      backgroundImage: conversation.companyLogo !=
                                                  null &&
                                              conversation.companyLogo!.isNotEmpty
                                          ? NetworkImage(
                                              conversation.companyLogo!,
                                            )
                                          : null,
                                      child: conversation.companyLogo == null ||
                                              conversation.companyLogo!.isEmpty
                                          ? Text(
                                              conversation.otherPartyName.isEmpty
                                                  ? '?'
                                                  : conversation.otherPartyName[0]
                                                      .toUpperCase(),
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                                color: Color(0xFF145DE0),
                                              ),
                                            )
                                          : null,
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  conversation.otherPartyName,
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 15.5,
                                                    fontWeight: FontWeight.w700,
                                                    color: Color(0xFF0F172A),
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                _formatLastSeen(
                                                    conversation.lastMessageAt),
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  color: Color(0xFF94A3B8),
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 1),
                                          Text(
                                            conversation.internshipTitle,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 13,
                                              color: Color(0xFF64748B),
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  _messagePreview(
                                                      conversation.lastMessage),
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 13.5,
                                                    color: Color(0xFF475569),
                                                  ),
                                                ),
                                              ),
                                              if (conversation.unreadCount > 0)
                                                ...[
                                                  const SizedBox(width: 6),
                                                  Container(
                                                    padding: const EdgeInsets
                                                        .symmetric(
                                                      horizontal: 7,
                                                      vertical: 2,
                                                    ),
                                                    decoration: BoxDecoration(
                                                      color: const Color(
                                                          0xFF145DE0),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              999),
                                                    ),
                                                    child: Text(
                                                      '${conversation.unreadCount}',
                                                      style: const TextStyle(
                                                        color: Colors.white,
                                                        fontSize: 10,
                                                        fontWeight:
                                                            FontWeight.w700,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          _StatusChip(
                                            status:
                                                conversation.applicationStatus,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String? status;

  @override
  Widget build(BuildContext context) {
    final normalized = (status ?? 'pending').trim().toLowerCase();
    Color background;
    Color text;
    String label;

    switch (normalized) {
      case 'accepted':
        background = const Color(0xFFDDF7E6);
        text = const Color(0xFF057A43);
        label = 'ACCEPTED';
        break;
      case 'rejected':
        background = const Color(0xFFFDE2E1);
        text = const Color(0xFFCD1C18);
        label = 'REJECTED';
        break;
      default:
        background = const Color(0xFFE5E7EB);
        text = const Color(0xFF4B5563);
        label = normalized.isEmpty ? 'PENDING' : normalized.toUpperCase();
        break;
    }

    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: text.withValues(alpha: 0.15)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            letterSpacing: 0.3,
            fontWeight: FontWeight.w700,
            color: text,
          ),
        ),
      ),
    );
  }
}

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({
    super.key,
    required this.applicationId,
    required this.otherPartyName,
  });

  final String applicationId;
  final String otherPartyName;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen>
    with WidgetsBindingObserver {
  final _messageController = TextEditingController();
  final _inputFocusNode = FocusNode();
  final _scrollController = ScrollController();
  List<ChatMessageModel> _messages = const [];
  StreamSubscription<Map<String, dynamic>>? _subscription;
  StreamSubscription<Map<String, dynamic>>? _statusSubscription;
  List<String> _pendingFiles = [];
  final Map<String, String> _cachedAttachmentPaths = {};
  final Set<String> _activeAttachmentOps = <String>{};
  final Set<String> _downloadedAttachmentUrls = <String>{};
  String? _otherPartyId;
  bool _isOtherOnline = false;
  bool _isOtherTyping = false;
  Timer? _typingDebounce;
  bool _localTyping = false;
  bool _sending = false;
  DateTime? _mutedUntil;
  bool _isAppActive = true;
  late final StateController<String?> _activeChatController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _activeChatController = ref.read(activeChatIdProvider.notifier);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _activeChatController.state = widget.applicationId;
      }
    });
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final repository = ref.read(studentRepositoryProvider);
    final token = await ref.read(tokenStoreProvider).read();
    final socket = ref.read(socketServiceProvider);

    final messages = await repository.fetchMessages(widget.applicationId);
    final pref = await repository.getConversationPreferences(widget.applicationId);
    if (mounted) {
      setState(() {
        _messages = messages;
        _mutedUntil = pref['mutedUntil'] == null
            ? null
            : DateTime.tryParse(pref['mutedUntil'].toString());
      });
      _scrollToEnd();
    }

    _subscription = socket.messages.listen((data) {
      final payload = data['message'] as Map<String, dynamic>? ?? {};
      final next = ChatMessageModel.fromJson(payload);
      if (mounted) {
        setState(() => _messages = [..._messages, next]);
      }
      _scrollToEnd();

      // If we are viewing this chat, mark incoming messages as seen immediately
      final currentUserId =
          ref.read(sessionControllerProvider).value?.user.id;
      final activeChatId = ref.read(activeChatIdProvider);
      if (_isAppActive &&
          activeChatId == widget.applicationId &&
          currentUserId != null &&
          next.senderId.isNotEmpty &&
          next.senderId != currentUserId) {
        socket.markAsSeen(widget.applicationId);
        repository.markConversationSeen(widget.applicationId);
        ref.read(inboxRefreshTriggerProvider.notifier).state++;
      }
    });

    _statusSubscription = socket.status.listen((event) {
      final eventName = event['event']?.toString() ?? '';
      final data = event['data'] as Map<String, dynamic>? ?? {};
      final applicationId = data['applicationId']?.toString() ?? '';
      if (applicationId.isNotEmpty && applicationId != widget.applicationId) {
        return;
      }

      if (eventName == 'message-deleted') {
        final messageId = data['messageId']?.toString();
        if (messageId == null || !mounted) return;
        setState(() {
          _messages = _messages
              .map((item) => item.id == messageId
                  ? ChatMessageModel(
                      id: item.id,
                      senderId: item.senderId,
                      senderName: item.senderName,
                      content: 'This message was deleted',
                      status: item.status,
                      createdAt: item.createdAt,
                      isDeleted: true,
                      attachments: const [],
                    )
                  : item)
              .toList();
        });
        return;
      }

      if (eventName == 'delivered') {
        final currentUserId =
            ref.read(sessionControllerProvider).value?.user.id;
        if (currentUserId == null || !mounted) return;
        setState(() {
          _messages = _messages
              .map((item) => item.senderId == currentUserId &&
                      item.status == 'sent'
                  ? ChatMessageModel(
                      id: item.id,
                      senderId: item.senderId,
                      senderName: item.senderName,
                      content: item.content,
                      status: 'delivered',
                      createdAt: item.createdAt,
                      isDeleted: item.isDeleted,
                      attachments: item.attachments,
                    )
                  : item)
              .toList();
        });
        return;
      }

      if (eventName == 'seen') {
        final currentUserId =
            ref.read(sessionControllerProvider).value?.user.id;
        if (currentUserId == null || !mounted) return;
        setState(() {
          _messages = _messages
              .map((item) => item.senderId == currentUserId &&
                      item.status != 'seen'
                  ? ChatMessageModel(
                      id: item.id,
                      senderId: item.senderId,
                      senderName: item.senderName,
                      content: item.content,
                      status: 'seen',
                      createdAt: item.createdAt,
                      isDeleted: item.isDeleted,
                      attachments: item.attachments,
                    )
                  : item)
              .toList();
        });
        return;
      }

      if (eventName == 'joined-conversation') {
        final otherPartyId = data['otherPartyId']?.toString();
        final isOnline = data['isOnline'] == true;
        if (!mounted) return;
        setState(() {
          _otherPartyId = otherPartyId;
          _isOtherOnline = isOnline;
        });
        return;
      }

      if (eventName == 'typing') {
        final userId = data['userId']?.toString();
        if (_otherPartyId != null && userId != _otherPartyId) {
          return;
        }
        final isTyping = data['isTyping'] == true;
        if (!mounted) return;
        setState(() {
          _isOtherTyping = isTyping;
        });
        return;
      }

      if (eventName == 'user-status') {
        final userId = data['userId']?.toString();
        if (_otherPartyId != null && userId != _otherPartyId) {
          return;
        }
        final isOnline = data['isOnline'] == true;
        if (!mounted) return;
        setState(() {
          _isOtherOnline = isOnline;
        });
      }
    });

    if (token != null && token.isNotEmpty) {
      socket.connect(token);
      socket.joinApplication(widget.applicationId);
      await repository.markConversationSeen(widget.applicationId);
      ref.read(inboxRefreshTriggerProvider.notifier).state++;
    }

    _inputFocusNode.addListener(() {
      if (!_inputFocusNode.hasFocus) {
        _stopTyping();
      }
    });
  }

  void _stopTyping() {
    if (!_localTyping) return;
    _localTyping = false;
    _typingDebounce?.cancel();
    ref.read(socketServiceProvider).setTyping(widget.applicationId, false);
  }

  void _handleTypingChange(String value) {
    final isTypingNow = value.trim().isNotEmpty;
    if (!isTypingNow) {
      _stopTyping();
      return;
    }

    if (!_localTyping) {
      _localTyping = true;
      ref.read(socketServiceProvider).setTyping(widget.applicationId, true);
    }

    _typingDebounce?.cancel();
    _typingDebounce = Timer(const Duration(seconds: 2), () {
      _stopTyping();
    });
  }

  Future<void> _setMute(Duration? duration) async {
    final repository = ref.read(studentRepositoryProvider);
    final value = duration == null
        ? null
        : DateTime.now().add(duration).toIso8601String();
    await repository.muteConversation(widget.applicationId, value);
    if (!mounted) return;
    setState(() => _mutedUntil = value == null ? null : DateTime.parse(value));
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty && _pendingFiles.isEmpty) return;

    setState(() => _sending = true);
    final repository = ref.read(studentRepositoryProvider);
    try {
      if (_pendingFiles.isEmpty) {
        await repository.sendMessage(widget.applicationId, text);
      } else {
        await repository.sendMessageWithFiles(
          widget.applicationId,
          text,
          _pendingFiles,
        );
      }
      _messageController.clear();
      _stopTyping();
      setState(() => _pendingFiles = []);
      final refreshed = await repository.fetchMessages(widget.applicationId);
      if (mounted) {
        setState(() => _messages = refreshed);
      }
      _scrollToEnd();
    } finally {
      if (mounted) {
        setState(() => _sending = false);
      }
    }
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true);
    if (!mounted || result == null) return;
    setState(() {
      _pendingFiles = result.files
          .where((file) => file.path != null)
          .map((file) => file.path!)
          .toList();
    });
  }

  String _attachmentName(Map<String, dynamic> attachment) {
    const fallback = 'Attachment';
    final raw = attachment['fileName']?.toString().trim();
    if (raw == null || raw.isEmpty) return fallback;
    return raw;
  }

  String _attachmentUrl(Map<String, dynamic> attachment) {
    return attachment['fileUrl']?.toString().trim() ?? '';
  }

  String _attachmentMimeType(Map<String, dynamic> attachment) {
    return attachment['mimeType']?.toString().toLowerCase().trim() ?? '';
  }

  bool _isImageAttachment(Map<String, dynamic> attachment) {
    final mime = _attachmentMimeType(attachment);
    if (mime.startsWith('image/')) return true;
    final name = _attachmentName(attachment).toLowerCase();
    return name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp') ||
        name.endsWith('.gif');
  }

  String _readableSize(Map<String, dynamic> attachment) {
    final raw = attachment['fileSize'];
    final bytes = raw is num ? raw.toInt() : int.tryParse('$raw');
    if (bytes == null || bytes <= 0) return '';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  String _safeFileName(String input) {
    return input.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
  }

  Future<String?> _downloadAttachmentToTemp(Map<String, dynamic> attachment) async {
    final url = _attachmentUrl(attachment);
    if (url.isEmpty) return null;
    if (_cachedAttachmentPaths.containsKey(url)) {
      final existing = _cachedAttachmentPaths[url]!;
      if (await File(existing).exists()) return existing;
    }

    final fileName = _safeFileName(_attachmentName(attachment));
    final tempDir = await getTemporaryDirectory();
    final localPath =
        '${tempDir.path}${Platform.pathSeparator}${DateTime.now().millisecondsSinceEpoch}_$fileName';

    await Dio().download(
      url,
      localPath,
      options: Options(
        responseType: ResponseType.bytes,
        followRedirects: true,
      ),
    );

    _cachedAttachmentPaths[url] = localPath;
    return localPath;
  }

  Future<void> _previewAttachment(Map<String, dynamic> attachment) async {
    final url = _attachmentUrl(attachment);
    if (url.isEmpty || _activeAttachmentOps.contains(url)) return;

    setState(() => _activeAttachmentOps.add(url));
    try {
      final path = await _downloadAttachmentToTemp(attachment);
      if (path == null) return;

      if (_isImageAttachment(attachment)) {
        if (!mounted) return;
        await Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => _ImagePreviewScreen(
              filePath: path,
              title: _attachmentName(attachment),
            ),
          ),
        );
        return;
      }

      final result = await OpenFilex.open(path);
      if (result.type != ResultType.done && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result.type == ResultType.noAppToOpen
                  ? 'No app found to preview this file'
                  : 'Could not preview file (${result.message})',
            ),
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to preview file')),
      );
    } finally {
      if (mounted) {
        setState(() => _activeAttachmentOps.remove(url));
      }
    }
  }

  Future<void> _saveAttachment(Map<String, dynamic> attachment) async {
    final url = _attachmentUrl(attachment);
    if (url.isEmpty || _activeAttachmentOps.contains(url)) return;
    if (_downloadedAttachmentUrls.contains(url)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Already downloaded')),
      );
      return;
    }

    setState(() => _activeAttachmentOps.add(url));
    try {
      final sourcePath = await _downloadAttachmentToTemp(attachment);
      if (sourcePath == null) return;

      final saved = await FlutterFileDialog.saveFile(
        params: SaveFileDialogParams(
          sourceFilePath: sourcePath,
          fileName: _safeFileName(_attachmentName(attachment)),
        ),
      );

      if (!mounted) return;
      if (saved != null) {
        _downloadedAttachmentUrls.add(url);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('File saved successfully')),
        );
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Save cancelled')),
      );
    } catch (e) {
      final sourcePath = _cachedAttachmentPaths[url];
      if (sourcePath != null) {
        final fallbackPath = await _copyToDownloads(
          sourcePath,
          _safeFileName(_attachmentName(attachment)),
        );
        if (fallbackPath != null) {
          _downloadedAttachmentUrls.add(url);
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Saved to Downloads: $fallbackPath')),
          );
          return;
        }
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to save file: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _activeAttachmentOps.remove(url));
      }
    }
  }

  Future<String?> _copyToDownloads(
    String sourcePath,
    String preferredName,
  ) async {
    try {
      Directory? downloadsDir = await getDownloadsDirectory();

      if ((downloadsDir == null || !downloadsDir.existsSync()) &&
          Platform.isAndroid) {
        final androidPublic = Directory('/storage/emulated/0/Download');
        if (androidPublic.existsSync()) {
          downloadsDir = androidPublic;
        }
      }

      if (downloadsDir == null || !downloadsDir.existsSync()) {
        return null;
      }

      final extension = preferredName.contains('.')
          ? preferredName.substring(preferredName.lastIndexOf('.'))
          : '';
      final base = extension.isEmpty
          ? preferredName
          : preferredName.substring(0, preferredName.length - extension.length);

      var candidate = File(
        '${downloadsDir.path}${Platform.pathSeparator}$preferredName',
      );
      var index = 1;
      while (candidate.existsSync()) {
        candidate = File(
          '${downloadsDir.path}${Platform.pathSeparator}$base ($index)$extension',
        );
        index++;
      }

      await File(sourcePath).copy(candidate.path);
      return candidate.path;
    } catch (_) {
      return null;
    }
  }

  Future<void> _deleteMessage(ChatMessageModel message) async {
    final currentUserId = ref.read(sessionControllerProvider).value?.user.id;
    if (currentUserId == null) return;
    if (message.senderId != currentUserId || message.isDeleted) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete message'),
          content: const Text('Delete this message for everyone?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    ref.read(socketServiceProvider).deleteMessage(
          messageId: message.id,
          applicationId: widget.applicationId,
        );

    if (!mounted) return;
    setState(() {
      _messages = _messages
          .map((item) => item.id == message.id
              ? ChatMessageModel(
                  id: item.id,
                  senderId: item.senderId,
                  senderName: item.senderName,
                  content: 'This message was deleted',
                  status: item.status,
                  createdAt: item.createdAt,
                  isDeleted: true,
                  attachments: const [],
                )
              : item)
          .toList();
    });
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  bool _sameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _dateChipLabel(DateTime value) {
    return DateFormat('d MMMM yyyy').format(value).toUpperCase();
  }

  Future<void> _reportConversation() async {
    final shouldReport = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Report conversation?'),
          content: const Text(
            'This will flag the conversation for review. Continue?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Report'),
            ),
          ],
        );
      },
    );
    if (shouldReport != true) return;

    final repository = ref.read(studentRepositoryProvider);
    await repository.createReport({
      'applicationId': widget.applicationId,
      'subject': 'Report conversation',
      'body': 'Reported from mobile chat',
      'category': 'chat',
      'priority': 'medium',
    });
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Report submitted')),
    );
  }

  Future<void> _confirmDeleteCurrentConversation() async {
    final repository = ref.read(studentRepositoryProvider);
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete conversation'),
          content: const Text('Delete this conversation from your list?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (shouldDelete != true) return;
    await repository.deleteConversation(widget.applicationId);
    ref.read(inboxRefreshTriggerProvider.notifier).state++;
    if (!mounted) return;
    context.pop();
  }

  Future<void> _viewCompanyFromConversation() async {
    final repository = ref.read(studentRepositoryProvider);
    try {
      final application = await repository.getApplication(widget.applicationId);
      final internship = application['internshipId'] as Map<String, dynamic>? ?? {};
      final company = internship['companyId'] as Map<String, dynamic>? ?? {};
      final companyId = (company['_id'] ?? company['id'] ?? '').toString();

      if (companyId.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Company details are unavailable')),
        );
        return;
      }

      if (!mounted) return;
      context.push('/companies/$companyId');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open company profile')),
      );
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _statusSubscription?.cancel();
    _typingDebounce?.cancel();
    _stopTyping();
    WidgetsBinding.instance.removeObserver(this);
    if (_activeChatController.state == widget.applicationId) {
      _activeChatController.state = null;
    }
    ref.read(socketServiceProvider).leaveApplication(widget.applicationId);
    _messageController.dispose();
    _inputFocusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _isAppActive = state == AppLifecycleState.resumed;
    final activeChatId = ref.read(activeChatIdProvider);
    if (_isAppActive && activeChatId == widget.applicationId) {
      final currentUserId = ref.read(sessionControllerProvider).value?.user.id;
      if (currentUserId != null) {
        final hasUnseenFromOther = _messages.any((item) =>
            item.senderId.isNotEmpty &&
            item.senderId != currentUserId &&
            item.status != 'seen');
        if (hasUnseenFromOther) {
          ref.read(socketServiceProvider).markAsSeen(widget.applicationId);
          ref
              .read(studentRepositoryProvider)
              .markConversationSeen(widget.applicationId);
          ref.read(inboxRefreshTriggerProvider.notifier).state++;
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = ref.watch(sessionControllerProvider).value?.user.id;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
        ),
        title: Row(
          children: [
            CircleAvatar(
              radius: 17,
              backgroundColor: const Color(0xFFEFF6FF),
              child: Text(
                widget.otherPartyName.isEmpty
                    ? '?'
                    : widget.otherPartyName[0].toUpperCase(),
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF145DE0),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    widget.otherPartyName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 1),
                  Row(
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: _isOtherOnline
                              ? const Color(0xFF22C55E)
                              : const Color(0xFF9CA3AF),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _isOtherOnline ? 'Online' : 'Offline',
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: Color(0xFF6B7280),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) async {
              if (value == 'view-company') {
                await _viewCompanyFromConversation();
              } else if (value == 'mute8h') {
                await _setMute(const Duration(hours: 8));
              } else if (value == 'mute2d') {
                await _setMute(const Duration(days: 2));
              } else if (value == 'mute1w') {
                await _setMute(const Duration(days: 7));
              } else if (value == 'unmute') {
                await _setMute(null);
              } else if (value == 'report') {
                await _reportConversation();
              } else if (value == 'delete') {
                await _confirmDeleteCurrentConversation();
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(
                value: 'view-company',
                child: Text('View Company'),
              ),
              const PopupMenuItem(value: 'mute8h', child: Text('Mute for 8h')),
              const PopupMenuItem(value: 'mute2d', child: Text('Mute for 2 days')),
              const PopupMenuItem(value: 'mute1w', child: Text('Mute for 1 week')),
              if (_mutedUntil != null)
                const PopupMenuItem(value: 'unmute', child: Text('Unmute')),
              const PopupMenuItem(value: 'report', child: Text('Report conversation')),
              const PopupMenuItem(value: 'delete', child: Text('Delete conversation')),
            ],
            icon: const Icon(Icons.more_vert_rounded),
          ),
          const SizedBox(width: 6),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1),
        ),
      ),
      body: Column(
        children: [
          if (_mutedUntil != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              color: const Color(0xFFF1F5F9),
              child: Text(
                'Muted until ${DateFormat.yMMMd().add_jm().format(_mutedUntil!)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF334155),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          Expanded(
            child: ListView.separated(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final message = _messages[index];
                final previous =
                    index > 0 ? _messages[index - 1] : null;
                final showDateChip = previous == null ||
                    !_sameDay(previous.createdAt, message.createdAt);
                final isMine = message.senderId == currentUserId;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (showDateChip)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Text(
                              _dateChipLabel(message.createdAt),
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF9CA3AF),
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                    Align(
                      alignment:
                          isMine ? Alignment.centerRight : Alignment.centerLeft,
                      child: GestureDetector(
                        onLongPress: isMine && !message.isDeleted
                            ? () => _deleteMessage(message)
                            : null,
                        child: Container(
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.76,
                          ),
                          padding: const EdgeInsets.all(13),
                          decoration: BoxDecoration(
                            color: isMine
                                ? const Color(0xFF145DE0)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: isMine
                                ? null
                                : Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!isMine)
                                Text(
                                  message.senderName,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF145DE0),
                                  ),
                                ),
                              if (message.content != null &&
                                  message.content!.isNotEmpty)
                                Text(
                                  message.content!,
                                  style: TextStyle(
                                    color: isMine ? Colors.white : Colors.black87,
                                    fontSize: 17,
                                  ),
                                ),
                              if (message.attachments.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                ...message.attachments.map(
                                  (attachment) => Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: _AttachmentTile(
                                      fileName: _attachmentName(attachment),
                                      sizeText: _readableSize(attachment),
                                      isMine: isMine,
                                      isBusy: _activeAttachmentOps
                                          .contains(_attachmentUrl(attachment)),
                                      onPreview: () => _previewAttachment(attachment),
                                      onSave: () => _saveAttachment(attachment),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.only(
                        top: 3,
                        left: isMine ? 0 : 8,
                        right: isMine ? 8 : 0,
                      ),
                      child: Row(
                        mainAxisAlignment:
                            isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            DateFormat.jm().format(message.createdAt),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF94A3B8),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          if (isMine) ...[
                            const SizedBox(width: 4),
                            Icon(
                              message.status == 'seen' ||
                                      message.status == 'delivered'
                                  ? Icons.done_all_rounded
                                  : Icons.done_rounded,
                              size: 15,
                              color: message.status == 'seen'
                                  ? const Color(0xFF3B82F6)
                                  : const Color(0xFF9CA3AF),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          if (_isOtherTyping)
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _TypingDot(delay: 0),
                      SizedBox(width: 5),
                      _TypingDot(delay: 150),
                      SizedBox(width: 5),
                      _TypingDot(delay: 300),
                    ],
                  ),
                ),
              ),
            ),
          if (_pendingFiles.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.white,
              child: Text('Attachments: ${_pendingFiles.length}'),
            ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Row(
                children: [
                  IconButton(
                    onPressed: _pickFiles,
                    icon: const Icon(Icons.attach_file_rounded, size: 22),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      focusNode: _inputFocusNode,
                      minLines: 1,
                      maxLines: 4,
                      onChanged: _handleTypingChange,
                      decoration: const InputDecoration(
                        hintText: 'Type your message',
                        filled: true,
                        fillColor: Color(0xFFF3F4F6),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(18)),
                          borderSide: BorderSide(color: Color(0xFFE5E7EB)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(18)),
                          borderSide: BorderSide(color: Color(0xFFE5E7EB)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(18)),
                          borderSide: BorderSide(color: Color(0xFF93C5FD)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sending ? null : _send,
                    icon:
                        Icon(_sending ? Icons.hourglass_top : Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AttachmentTile extends StatelessWidget {
  const _AttachmentTile({
    required this.fileName,
    required this.sizeText,
    required this.isMine,
    required this.isBusy,
    required this.onPreview,
    required this.onSave,
  });

  final String fileName;
  final String sizeText;
  final bool isMine;
  final bool isBusy;
  final VoidCallback onPreview;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final foreground = isMine ? Colors.white : const Color(0xFF0F172A);
    final subtle = isMine
        ? Colors.white.withValues(alpha: 0.75)
        : const Color(0xFF64748B);
    final borderColor = isMine
        ? Colors.white.withValues(alpha: 0.22)
        : const Color(0xFFE2E8F0);
    final surface = isMine
        ? Colors.white.withValues(alpha: 0.08)
        : const Color(0xFFF8FAFC);

    return InkWell(
      onTap: isBusy ? null : onPreview,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: isMine
                    ? Colors.white.withValues(alpha: 0.16)
                    : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.insert_drive_file_outlined,
                size: 15,
                color: foreground,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    fileName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: foreground,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (sizeText.isNotEmpty)
                    Text(
                      sizeText,
                      style: TextStyle(
                        color: subtle,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 6),
            IconButton(
              onPressed: isBusy ? null : onSave,
              icon: isBusy
                  ? SizedBox(
                      width: 17,
                      height: 17,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: foreground,
                      ),
                    )
                  : Icon(
                      Icons.download_rounded,
                      size: 18,
                      color: foreground,
                    ),
              visualDensity: VisualDensity.compact,
              tooltip: 'Download',
            ),
          ],
        ),
      ),
    );
  }
}

class _ImagePreviewScreen extends StatelessWidget {
  const _ImagePreviewScreen({
    required this.filePath,
    required this.title,
  });

  final String filePath;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(
          title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: Center(
        child: InteractiveViewer(
          minScale: 0.8,
          maxScale: 4.0,
          child: Image.file(
            File(filePath),
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Text(
              'Unable to preview image',
              style: TextStyle(color: Colors.white70),
            ),
          ),
        ),
      ),
    );
  }
}

class _TypingDot extends StatefulWidget {
  const _TypingDot({required this.delay});

  final int delay;

  @override
  State<_TypingDot> createState() => _TypingDotState();
}

class _TypingDotState extends State<_TypingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _scale = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) {
        _controller.repeat(reverse: true);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scale,
      builder: (context, child) {
        return Transform.scale(
          scale: _scale.value,
          child: child,
        );
      },
      child: Container(
        width: 7,
        height: 7,
        decoration: BoxDecoration(
          color: const Color(0xFF3B82F6),
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}
