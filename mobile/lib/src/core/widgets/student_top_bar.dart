import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers.dart';

class StudentTopBar extends ConsumerWidget implements PreferredSizeWidget {
  const StudentTopBar({
    super.key,
    required this.title,
  });

  final String title;

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final counts = ref.watch(inboxCountsProvider).valueOrNull;
    final unreadNotifications = counts?.unreadNotifications ?? 0;

    return SafeArea(
      bottom: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        decoration: const BoxDecoration(
          color: Color(0xFFF4F6FB),
          border: Border(
            bottom: BorderSide(color: Color(0xFFE5E7EB), width: 1),
          ),
        ),
        child: Row(
          children: [
            const SizedBox(width: 6),
            Text(
              title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
              ),
            ),
            const Spacer(),
            _TopBarBadgeButton(
              icon: Icons.notifications_none_rounded,
              count: unreadNotifications,
              tooltip: 'Notifications',
              onTap: () async {
                await context.push('/notifications');
                ref.read(inboxRefreshTriggerProvider.notifier).state++;
              },
            ),
            IconButton(
              onPressed: () => _openMenu(context, ref),
              icon: const Icon(Icons.menu_rounded),
              color: const Color(0xFF374151),
              iconSize: 22,
              padding: const EdgeInsets.all(6),
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              visualDensity: VisualDensity.compact,
              tooltip: 'Menu',
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openMenu(BuildContext parentContext, WidgetRef ref) async {
    await showModalBottomSheet<void>(
      context: parentContext,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  leading: const Icon(Icons.business_outlined),
                  title: const Text('Companies'),
                  onTap: () {
                    Navigator.of(context).pop();
                    parentContext.push('/companies');
                  },
                ),
                ListTile(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  leading: const Icon(Icons.query_stats_outlined),
                  title: const Text('Analytics'),
                  onTap: () {
                    Navigator.of(context).pop();
                    parentContext.push('/analytics');
                  },
                ),
                ListTile(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  leading: const Icon(Icons.logout_rounded, color: Colors.red),
                  title: const Text('Logout'),
                  onTap: () async {
                    Navigator.of(context).pop();
                    final shouldLogout = await showDialog<bool>(
                      context: parentContext,
                      builder: (dialogContext) {
                        return AlertDialog(
                          title: const Text('Confirm logout'),
                          content: const Text(
                            'Are you sure you want to logout?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () =>
                                  Navigator.of(dialogContext).pop(false),
                              child: const Text('Cancel'),
                            ),
                            FilledButton(
                              onPressed: () =>
                                  Navigator.of(dialogContext).pop(true),
                              child: const Text('Logout'),
                            ),
                          ],
                        );
                      },
                    );
                    if (shouldLogout == true) {
                      await ref.read(sessionControllerProvider.notifier).logout();
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _TopBarBadgeButton extends StatelessWidget {
  const _TopBarBadgeButton({
    required this.icon,
    required this.count,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final int count;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          onPressed: onTap,
          icon: Icon(icon),
          color: const Color(0xFF374151),
          iconSize: 22,
          padding: const EdgeInsets.all(6),
          constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
          visualDensity: VisualDensity.compact,
          tooltip: tooltip,
        ),
        if (count > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(12),
              ),
              constraints: const BoxConstraints(minWidth: 18),
              child: Text(
                count > 99 ? '99+' : '$count',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
