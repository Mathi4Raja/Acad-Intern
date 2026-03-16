import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models.dart';
import '../../core/providers.dart';
import '../shell/student_shell.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<dynamic>> _load() {
    final repository = ref.read(studentRepositoryProvider);
    return Future.wait([
      repository.fetchApplications(),
      repository.getProfile(),
      repository.fetchInternships(preferMatch: true),
    ]);
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider).value;

    return StudentPageScaffold(
      title: 'Dashboard',
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
              children: [
                if (snapshot.connectionState != ConnectionState.done) ...[
                  const SizedBox(height: 140),
                  const Center(child: CircularProgressIndicator()),
                ] else if (snapshot.hasError || !snapshot.hasData) ...[
                  const SizedBox(height: 140),
                  const Center(child: Text('Failed to load dashboard')),
                ] else ...[
                  Builder(
                    builder: (context) {
                      final applications =
                          snapshot.data![0] as List<ApplicationModel>;
                      final profile =
                          snapshot.data![1] as StudentProfileModel;
                      final internships =
                          snapshot.data![2] as List<InternshipModel>;

                      final interviews = applications
                          .where((item) =>
                              item.status == 'interview_scheduled')
                          .length;
                      final shortlisted = applications
                          .where((item) => const [
                                'shortlisted',
                                'assessment_completed',
                                'accepted',
                              ].contains(item.status))
                          .length;
                      final completion = _completion(profile, session?.user);

                      return Column(
                        children: [
                          GridView.count(
                            crossAxisCount: 2,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            padding: EdgeInsets.zero,
                            childAspectRatio: 2.08,
                            children: [
                              _MetricCard(
                                title: 'INTERVIEWS',
                                value: '$interviews',
                                subtitle: 'Scheduled',
                                icon: Icons.access_time_rounded,
                                iconColor: const Color(0xFFFF7A1A),
                                iconBackground: const Color(0xFFFFF3E8),
                              ),
                              _MetricCard(
                                title: 'APPLICATIONS',
                                value: '${applications.length}',
                                subtitle: 'Total Sent',
                                icon: Icons.description_outlined,
                                iconColor: const Color(0xFF2563EB),
                                iconBackground: const Color(0xFFEEF4FF),
                              ),
                              _MetricCard(
                                title: 'SHORTLISTED',
                                value: '$shortlisted',
                                subtitle: 'Active Processes',
                                icon: Icons.check_circle_outline_rounded,
                                iconColor: const Color(0xFF16A34A),
                                iconBackground: const Color(0xFFECFDF3),
                              ),
                              _MetricCard(
                                title: 'ACTIVE',
                                value: '${internships.length}',
                                subtitle: 'Current Internships',
                                icon: Icons.work_outline_rounded,
                                iconColor: const Color(0xFF7E22CE),
                                iconBackground: const Color(0xFFF7EDFF),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          _RecentApplicationsCard(
                            items: applications.take(3).toList(),
                            onViewAll: () => context.go('/applications'),
                            onItemTap: () => context.go('/applications'),
                          ),
                          const SizedBox(height: 8),
                          _ProfileStrengthCard(
                            completion: completion,
                            onTap: () => context.go('/profile'),
                          ),
                          const SizedBox(height: 8),
                          const _QuickTipsCard(),
                        ],
                      );
                    },
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  int _completion(StudentProfileModel profile, UserSummary? user) {
    var done = 0;
    const total = 9;
    if (user?.name.isNotEmpty == true) done++;
    if (user?.email.isNotEmpty == true) done++;
    if (profile.department?.isNotEmpty == true) done++;
    if (profile.semester != null) done++;
    if (profile.cgpa != null) done++;
    if (profile.bio?.isNotEmpty == true) done++;
    if (profile.skills.isNotEmpty) done++;
    if (profile.resumeUrl?.isNotEmpty == true) done++;
    if (profile.phone?.isNotEmpty == true) done++;
    return ((done / total) * 100).round();
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.iconBackground,
  });

  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final Color iconBackground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(9, 7, 9, 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: iconBackground,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 10.5, color: iconColor),
              ),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.7,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF94A3B8),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentApplicationsCard extends StatelessWidget {
  const _RecentApplicationsCard({
    required this.items,
    required this.onViewAll,
    required this.onItemTap,
  });

  final List<ApplicationModel> items;
  final VoidCallback onViewAll;
  final VoidCallback onItemTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Recent Applications',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: onViewAll,
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('View All'),
                    SizedBox(width: 3),
                    Icon(Icons.arrow_forward_rounded, size: 16),
                  ],
                ),
              ),
            ],
          ),
          if (items.isEmpty)
            const Padding(
              padding: EdgeInsets.fromLTRB(4, 8, 4, 10),
              child: Text(
                'No applications yet.',
                style: TextStyle(color: Color(0xFF6B7280)),
              ),
            )
          else
            ...List.generate(items.length, (index) {
              final item = items[index];
              return Column(
                children: [
                  InkWell(
                    onTap: onItemTap,
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          _ApplicationAvatar(logoUrl: item.logo),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.internshipTitle,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                Text(
                                  item.companyName,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              _StatusPill(status: item.status),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.access_time_rounded,
                                    size: 12,
                                    color: Color(0xFF94A3B8),
                                  ),
                                  const SizedBox(width: 3),
                                  Text(
                                    _formatDate(item.appliedAt ?? item.lastUpdate),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Color(0xFF94A3B8),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (index != items.length - 1)
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                ],
              );
            }),
        ],
      ),
    );
  }

  String _formatDate(DateTime? value) {
    if (value == null) return '--';
    const months = <String>[
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${value.day.toString().padLeft(2, '0')} ${months[value.month - 1]} ${value.year}';
  }
}

class _ApplicationAvatar extends StatelessWidget {
  const _ApplicationAvatar({required this.logoUrl});

  final String? logoUrl;

  @override
  Widget build(BuildContext context) {
    final hasLogo = logoUrl != null && logoUrl!.isNotEmpty;
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      clipBehavior: Clip.antiAlias,
      child: hasLogo
          ? CachedNetworkImage(
              imageUrl: logoUrl!,
              fit: BoxFit.cover,
              memCacheWidth: 96,
              memCacheHeight: 96,
              placeholder: (_, __) => const Icon(
                Icons.business_rounded,
                size: 18,
                color: Color(0xFF94A3B8),
              ),
              errorWidget: (_, __, ___) => const Icon(
                Icons.business_rounded,
                size: 18,
                color: Color(0xFF94A3B8),
              ),
            )
          : const Icon(
              Icons.business_rounded,
              size: 18,
              color: Color(0xFF94A3B8),
            ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase();
    Color fg = const Color(0xFFA16207);
    Color bg = const Color(0xFFFFFBEB);
    Color border = const Color(0xFFFCD34D);
    String label = 'Pending';

    if (normalized == 'accepted') {
      fg = const Color(0xFF1D4ED8);
      bg = const Color(0xFFEFF6FF);
      border = const Color(0xFFBFDBFE);
      label = 'Accepted';
    } else if (normalized == 'rejected') {
      fg = const Color(0xFFDC2626);
      bg = const Color(0xFFFEF2F2);
      border = const Color(0xFFFECACA);
      label = 'Rejected';
    } else if (normalized == 'shortlisted') {
      fg = const Color(0xFF15803D);
      bg = const Color(0xFFF0FDF4);
      border = const Color(0xFFBBF7D0);
      label = 'Shortlisted';
    } else if (normalized == 'interview_scheduled') {
      fg = const Color(0xFF7C3AED);
      bg = const Color(0xFFF5F3FF);
      border = const Color(0xFFDDD6FE);
      label = 'Interview';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }
}

class _ProfileStrengthCard extends StatelessWidget {
  const _ProfileStrengthCard({
    required this.completion,
    required this.onTap,
  });

  final int completion;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final clamped = completion.clamp(0, 100).toDouble();
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFF145DE0), Color(0xFF7C1DFF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33145DE0),
            blurRadius: 14,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Profile Strength',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              Text(
                '${clamped.toInt()}%',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              minHeight: 6,
              value: clamped / 100,
              backgroundColor: const Color(0x5EFFFFFF),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Complete your profile to increase your chances of getting noticed by 3x.',
            style: TextStyle(
              fontSize: 11,
              color: Color(0xFFE0E7FF),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onTap,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF145DE0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Complete Profile',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickTipsCard extends StatelessWidget {
  const _QuickTipsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.lightbulb_outline_rounded,
                color: Color(0xFFF59E0B),
                size: 18,
              ),
              SizedBox(width: 8),
              Text(
                'Quick Tips',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          SizedBox(height: 10),
          _TipLine(text: 'Complete your profile for better matches.'),
          SizedBox(height: 8),
          _TipLine(text: 'Use filters to find the right internships faster.'),
        ],
      ),
    );
  }
}

class _TipLine extends StatelessWidget {
  const _TipLine({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 7,
          height: 7,
          margin: const EdgeInsets.only(top: 7),
          decoration: const BoxDecoration(
            color: Color(0xFFD1D5DB),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF475569),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
