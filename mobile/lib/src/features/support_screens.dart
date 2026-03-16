import 'dart:math';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';

import '../core/models.dart';
import '../core/providers.dart';
import 'shell/student_shell.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  late Future<dynamic> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<dynamic> _load() {
    return ref.read(studentRepositoryProvider).fetchAnalytics();
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return StudentPageScaffold(
      title: 'Analytics',
      body: FutureBuilder(
        future: _future,
        builder: (context, snapshot) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(10, 2, 10, 10),
              children: [
                if (snapshot.connectionState != ConnectionState.done) ...[
                  const SizedBox(height: 140),
                  const Center(child: CircularProgressIndicator()),
                ] else if (snapshot.hasError || !snapshot.hasData) ...[
                  const SizedBox(height: 140),
                  const Center(child: Text('Failed to load analytics')),
                ] else ...[
                  Builder(
                    builder: (context) {
                      final data = snapshot.data!.raw;
                      final profileViews = (data['profileViews'] ?? {}) as Map;
                      final searchAppearances =
                          (data['searchAppearances'] ?? {}) as Map;
                      final applicationRate =
                          (data['applicationRate'] ?? {}) as Map;
                      final profileStrength =
                          (data['profileStrength'] ?? {}) as Map;
                      final profileViewsHistory =
                          _parseSeries(profileViews['history']);
                      final searchAppearancesHistory =
                          _parseSeries(searchAppearances['history']);
                      final topSkillsDemand =
                          _parseSkillDemand(data['topSkillsDemand']);
                      final skillMatch = _parseSkillMatch(data['skillMatch']);
                      final companiesViewed =
                          _parseCompaniesViewed(data['companiesViewed']);

                      return Column(
                        children: [
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            padding: EdgeInsets.zero,
                            itemCount: 4,
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: 1.85,
                            ),
                            itemBuilder: (context, index) {
                              final card = _metricCardData(
                                index,
                                profileViews,
                                searchAppearances,
                                applicationRate,
                                profileStrength,
                              );
                              return _MetricCard(
                                title: card.title,
                                value: card.value,
                                subtitle: card.subtitle,
                                trend: card.trend,
                                icon: card.icon,
                                color: card.color,
                              );
                            },
                          ),
                          const SizedBox(height: 16),
                          _ChartCard(
                            title: 'Profile Views (Last 7 Days)',
                            child: _LineChart(
                              points: profileViewsHistory,
                              height: 170,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _ChartCard(
                            title: 'Search Appearances (Last 4 Weeks)',
                            child: _LineChart(
                              points: searchAppearancesHistory,
                              height: 170,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _ChartCard(
                            title: 'Your Top Skills in Demand',
                            child: _SkillsDemandList(items: topSkillsDemand),
                          ),
                          const SizedBox(height: 12),
                          _ChartCard(
                            title: 'Skill Match Analysis',
                            child: _RadarChart(
                              items: skillMatch,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _ChartCard(
                            title: 'Companies That Viewed Your Profile',
                            child: companiesViewed.isEmpty
                                ? const Padding(
                                    padding:
                                        EdgeInsets.symmetric(vertical: 16),
                                    child: Center(child: Text('No views yet')),
                                  )
                                : Column(
                                    children: companiesViewed
                                        .map(
                                          (item) => ListTile(
                                            dense: true,
                                            contentPadding: EdgeInsets.zero,
                                            leading: const CircleAvatar(
                                              radius: 16,
                                              child: Icon(Icons.business_rounded,
                                                  size: 16),
                                            ),
                                            title: Text(item.name),
                                            subtitle: Text(item.date),
                                            trailing: Text('${item.views}'),
                                          ),
                                        )
                                        .toList(),
                                  ),
                          ),
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
}

class _MetricCardData {
  const _MetricCardData({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.trend,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final String subtitle;
  final int trend;
  final IconData icon;
  final Color color;
}

_MetricCardData _metricCardData(
  int index,
  Map profileViews,
  Map searchAppearances,
  Map applicationRate,
  Map profileStrength,
) {
  final items = [
    _MetricCardData(
      title: 'Profile Views',
      value: '${profileViews['total'] ?? 0}',
      subtitle: 'Last 30 days',
      trend: (profileViews['trend'] ?? 0) is num
          ? (profileViews['trend'] ?? 0).toInt()
          : 0,
      icon: Icons.visibility_outlined,
      color: const Color(0xFF2563EB),
    ),
    _MetricCardData(
      title: 'Search Appearances',
      value: '${searchAppearances['total'] ?? 0}',
      subtitle: 'Last 30 days',
      trend: (searchAppearances['trend'] ?? 0) is num
          ? (searchAppearances['trend'] ?? 0).toInt()
          : 0,
      icon: Icons.search_rounded,
      color: const Color(0xFF7C3AED),
    ),
    _MetricCardData(
      title: 'Application Rate',
      value: '${applicationRate['value'] ?? '0%'}',
      subtitle: 'Views to applications',
      trend: (applicationRate['trend'] ?? 0) is num
          ? (applicationRate['trend'] ?? 0).toInt()
          : 0,
      icon: Icons.assignment_turned_in_outlined,
      color: const Color(0xFF16A34A),
    ),
    _MetricCardData(
      title: 'Profile Strength',
      value: '${profileStrength['value'] ?? '0%'}',
      subtitle: 'Profile completeness',
      trend: (profileStrength['trend'] ?? 0) is num
          ? (profileStrength['trend'] ?? 0).toInt()
          : 0,
      icon: Icons.trending_up_rounded,
      color: const Color(0xFFF97316),
    ),
  ];
  return items[index];
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.trend,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final String subtitle;
  final int trend;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final trendText = trend >= 0 ? '+$trend%' : '$trend%';
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
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
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 12, color: color),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 9,
                    letterSpacing: 0.6,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                trendText,
                style: const TextStyle(
                  fontSize: 10,
                  color: Color(0xFF22C55E),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF94A3B8),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  const _ChartCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}

class _ChartPoint {
  const _ChartPoint({required this.label, required this.value});

  final String label;
  final double value;
}

List<_ChartPoint> _parseSeries(dynamic raw) {
  if (raw is! List) return const [];
  return raw.map((item) {
    final map = item as Map? ?? const {};
    return _ChartPoint(
      label: map['label']?.toString() ?? '',
      value: (map['value'] as num?)?.toDouble() ?? 0,
    );
  }).toList();
}

class _LineChart extends StatelessWidget {
  const _LineChart({required this.points, required this.height});

  final List<_ChartPoint> points;
  final double height;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('No data yet')),
      );
    }
    return SizedBox(
      height: height,
      child: CustomPaint(
        painter: _LineChartPainter(points),
        child: Padding(
          padding: const EdgeInsets.only(top: 6, bottom: 8, left: 4, right: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: points
                .map((p) => Text(
                      p.label,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF94A3B8),
                      ),
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }
}

class _LineChartPainter extends CustomPainter {
  _LineChartPainter(this.points);

  final List<_ChartPoint> points;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF2563EB)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    final fillPaint = Paint()
      ..color = const Color(0xFFEFF6FF)
      ..style = PaintingStyle.fill;
    final gridPaint = Paint()
      ..color = const Color(0xFFE5E7EB)
      ..strokeWidth = 1;

    final maxValue =
        points.map((p) => p.value).fold<double>(0, (a, b) => a > b ? a : b);
    final safeMax = maxValue == 0 ? 1 : maxValue;
    final chartHeight = size.height - 24;
    final chartWidth = size.width;

    for (int i = 1; i <= 3; i++) {
      final y = chartHeight * (i / 4);
      canvas.drawLine(Offset(0, y), Offset(chartWidth, y), gridPaint);
    }

    final path = Path();
    final fillPath = Path();
    for (int i = 0; i < points.length; i++) {
      final x = points.length == 1
          ? chartWidth / 2
          : (chartWidth / (points.length - 1)) * i;
      final y =
          chartHeight - (points[i].value / safeMax) * (chartHeight - 6) + 4;
      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, chartHeight);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }
    fillPath.lineTo(chartWidth, chartHeight);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);

    final pointPaint = Paint()..color = const Color(0xFF2563EB);
    for (int i = 0; i < points.length; i++) {
      final x = points.length == 1
          ? chartWidth / 2
          : (chartWidth / (points.length - 1)) * i;
      final y =
          chartHeight - (points[i].value / safeMax) * (chartHeight - 6) + 4;
      canvas.drawCircle(Offset(x, y), 3, pointPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _SkillDemandItem {
  const _SkillDemandItem({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final int value;
  final Color color;
}

List<_SkillDemandItem> _parseSkillDemand(dynamic raw) {
  if (raw is! List) return const [];
  const colors = [
    Color(0xFF2563EB),
    Color(0xFF8B5CF6),
    Color(0xFF22C55E),
    Color(0xFFEAB308),
    Color(0xFFEF4444),
  ];
  return raw.asMap().entries.map((entry) {
    final map = entry.value as Map? ?? const {};
    final value = (map['value'] as num?)?.toInt() ?? 0;
    return _SkillDemandItem(
      label: map['label']?.toString() ?? '',
      value: value,
      color: colors[entry.key % colors.length],
    );
  }).toList();
}

class _SkillsDemandList extends StatelessWidget {
  const _SkillsDemandList({required this.items});

  final List<_SkillDemandItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Text('No data yet'),
      );
    }
    final maxValue =
        items.map((e) => e.value).fold<int>(0, (a, b) => a > b ? a : b);
    return Column(
      children: items.map((item) {
        final ratio = maxValue == 0 ? 0.0 : item.value / maxValue;
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      item.label,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  Text('${item.value}'),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: ratio,
                  minHeight: 8,
                  color: item.color,
                  backgroundColor: const Color(0xFFF1F5F9),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _SkillMatchItem {
  const _SkillMatchItem({
    required this.name,
    required this.studentLevel,
    required this.requiredLevel,
  });

  final String name;
  final double studentLevel;
  final double requiredLevel;
}

List<_SkillMatchItem> _parseSkillMatch(dynamic raw) {
  if (raw is! List) return const [];
  return raw.map((item) {
    final map = item as Map? ?? const {};
    return _SkillMatchItem(
      name: map['name']?.toString() ?? '',
      studentLevel: (map['studentLevel'] as num?)?.toDouble() ?? 0,
      requiredLevel: (map['requiredLevel'] as num?)?.toDouble() ?? 0,
    );
  }).toList();
}

class _RadarChart extends StatelessWidget {
  const _RadarChart({required this.items});

  final List<_SkillMatchItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Text('No data yet'),
      );
    }
    return Column(
      children: [
        SizedBox(
          height: 230,
          width: double.infinity,
          child: CustomPaint(
            painter: _RadarChartPainter(items),
          ),
        ),
        const SizedBox(height: 6),
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _LegendDot(color: Color(0xFF2563EB), label: 'Your Skills'),
            SizedBox(width: 16),
            _LegendDot(color: Color(0xFFC084FC), label: 'Required'),
          ],
        ),
      ],
    );
  }
}

class _RadarChartPainter extends CustomPainter {
  _RadarChartPainter(this.items);

  final List<_SkillMatchItem> items;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) * 0.34;
    final axisPaint = Paint()
      ..color = const Color(0xFFE5E7EB)
      ..strokeWidth = 1;
    final studentPaint = Paint()
      ..color = const Color(0xFF2563EB).withValues(alpha: 0.5)
      ..style = PaintingStyle.fill;
    final requiredPaint = Paint()
      ..color = const Color(0xFFC084FC).withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;
    final outlinePaint = Paint()
      ..color = const Color(0xFF2563EB)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    final requiredOutline = Paint()
      ..color = const Color(0xFFC084FC)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final count = items.length;
    if (count == 0) return;

    for (int ring = 1; ring <= 3; ring++) {
      final ringRadius = radius * (ring / 3);
      final ringPath = Path();
      for (int i = 0; i < count; i++) {
        final angle = (2 * pi * i / count) - pi / 2;
        final point = Offset(
          center.dx + ringRadius * cos(angle),
          center.dy + ringRadius * sin(angle),
        );
        if (i == 0) {
          ringPath.moveTo(point.dx, point.dy);
        } else {
          ringPath.lineTo(point.dx, point.dy);
        }
      }
      ringPath.close();
      canvas.drawPath(ringPath, axisPaint);
    }

    for (int i = 0; i < count; i++) {
      final angle = (2 * pi * i / count) - pi / 2;
      final end = Offset(
        center.dx + radius * cos(angle),
        center.dy + radius * sin(angle),
      );
      canvas.drawLine(center, end, axisPaint);
    }

    final studentPath = Path();
    final requiredPath = Path();
    for (int i = 0; i < count; i++) {
      final angle = (2 * pi * i / count) - pi / 2;
      final studentRadius = radius * (items[i].studentLevel / 100);
      final requiredRadius = radius * (items[i].requiredLevel / 100);
      final studentPoint = Offset(
        center.dx + studentRadius * cos(angle),
        center.dy + studentRadius * sin(angle),
      );
      final requiredPoint = Offset(
        center.dx + requiredRadius * cos(angle),
        center.dy + requiredRadius * sin(angle),
      );
      if (i == 0) {
        studentPath.moveTo(studentPoint.dx, studentPoint.dy);
        requiredPath.moveTo(requiredPoint.dx, requiredPoint.dy);
      } else {
        studentPath.lineTo(studentPoint.dx, studentPoint.dy);
        requiredPath.lineTo(requiredPoint.dx, requiredPoint.dy);
      }

      final textPainter = TextPainter(
        text: TextSpan(
          text: items[i].name,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w600,
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      )..layout();
      final labelOffset = Offset(
        center.dx + (radius + 24) * cos(angle) - textPainter.width / 2,
        center.dy + (radius + 24) * sin(angle) - textPainter.height / 2,
      );
      textPainter.paint(canvas, labelOffset);
    }
    studentPath.close();
    requiredPath.close();
    canvas.drawPath(requiredPath, requiredPaint);
    canvas.drawPath(studentPath, studentPaint);
    _drawDashedPath(canvas, requiredPath, requiredOutline, dash: 6, gap: 4);
    canvas.drawPath(studentPath, outlinePaint);
  }

  void _drawDashedPath(
    Canvas canvas,
    Path path,
    Paint paint, {
    required double dash,
    required double gap,
  }) {
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      double distance = 0;
      while (distance < metric.length) {
        final next = min(distance + dash, metric.length);
        final segment = metric.extractPath(distance, next);
        canvas.drawPath(segment, paint);
        distance = next + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _CompanyViewItem {
  const _CompanyViewItem({
    required this.name,
    required this.views,
    required this.date,
  });

  final String name;
  final int views;
  final String date;
}

List<_CompanyViewItem> _parseCompaniesViewed(dynamic raw) {
  if (raw is! List) return const [];
  return raw.map((item) {
    final map = item as Map? ?? const {};
    return _CompanyViewItem(
      name: map['name']?.toString() ?? 'Company',
      views: (map['views'] as num?)?.toInt() ?? 0,
      date: map['date']?.toString() ?? '',
    );
  }).toList();
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  late Future<List<AppNotificationModel>> _future;

  @override
  void initState() {
    super.initState();
    _future = ref.read(studentRepositoryProvider).fetchNotifications();
  }

  Future<void> _refresh() async {
    final next = ref.read(studentRepositoryProvider).fetchNotifications();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    final repository = ref.watch(studentRepositoryProvider);

    return StudentPageScaffold(
      title: 'Notifications',
      body: FutureBuilder<List<AppNotificationModel>>(
        future: _future,
        builder: (context, snapshot) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: Builder(
              builder: (context) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                    children: const [
                      SizedBox(height: 140),
                      Center(child: CircularProgressIndicator()),
                    ],
                  );
                }
                if (snapshot.hasError || !snapshot.hasData) {
                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                    children: const [
                      SizedBox(height: 140),
                      Center(child: Text('Failed to load notifications')),
                    ],
                  );
                }
                final notifications = snapshot.data!;
                if (notifications.isEmpty) {
                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                    children: const [
                      SizedBox(height: 140),
                      Center(child: Text('No notifications yet')),
                    ],
                  );
                }
                return ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                  itemCount: notifications.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () async {
                            await repository.markAllNotificationsRead();
                            ref
                                .read(inboxRefreshTriggerProvider.notifier)
                                .state++;
                            await _refresh();
                          },
                          child: const Text('Mark all read'),
                        ),
                      );
                    }
                    final notification = notifications[index - 1];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: notification.read
                              ? Colors.grey.shade100
                              : Theme.of(context)
                                  .colorScheme
                                  .primaryContainer,
                          child: Icon(
                            notification.type == 'general'
                                ? Icons.notifications_active_outlined
                                : Icons.article_outlined,
                          ),
                        ),
                        title: Text(notification.title),
                        subtitle: Text(
                          '${notification.message}\n${DateFormat.yMMMd().add_jm().format(notification.createdAt)}',
                        ),
                        isThreeLine: true,
                        trailing: notification.read
                            ? null
                            : const Icon(
                                Icons.circle,
                                size: 12,
                                color: Colors.blue,
                              ),
                        onTap: () async {
                          await repository
                              .markNotificationRead(notification.id);
                          ref
                              .read(inboxRefreshTriggerProvider.notifier)
                              .state++;
                          final normalized =
                              _resolveNotificationRoute(notification);
                          if (normalized == null) {
                            await _refresh();
                            return;
                          }
                          if (context.mounted) {
                            context.go(normalized);
                          }
                        },
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  String? _resolveNotificationRoute(AppNotificationModel notification) {
    final payload = notification.payload ?? const {};
    final route = payload['route']?.toString();
    final applicationId = payload['applicationId']?.toString();

    if (notification.type == 'application' ||
        notification.type == 'status_update') {
      return '/applications';
    }

    if (notification.type == 'general') {
      if (notification.title.toLowerCase().contains('new message') &&
          applicationId != null &&
          applicationId.isNotEmpty) {
        return '/messages?applicationId=${Uri.encodeQueryComponent(applicationId)}';
      }
      if (route != null && route.isNotEmpty) {
        return route.startsWith('/') ? route : '/$route';
      }
      return '/dashboard';
    }

    if (route != null && route.isNotEmpty) {
      return route.startsWith('/') ? route : '/$route';
    }
    return null;
  }
}
