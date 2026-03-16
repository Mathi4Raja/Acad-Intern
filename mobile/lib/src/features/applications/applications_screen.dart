import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/models.dart';
import '../../core/providers.dart';
import '../shell/student_shell.dart';

class ApplicationsScreen extends ConsumerStatefulWidget {
  const ApplicationsScreen({super.key, this.highlightedApplicationId});

  final String? highlightedApplicationId;

  @override
  ConsumerState<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends ConsumerState<ApplicationsScreen> {
  final _search = TextEditingController();
  String _filter = 'all';
  String _query = '';
  late Future<List<ApplicationModel>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<ApplicationModel>> _load() {
    return ref.read(studentRepositoryProvider).fetchApplications();
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _openFilterSheet({required bool compact}) async {
    var draftFilter = _filter;
    const statuses = [
      'all',
      'pending',
      'shortlisted',
      'interview_scheduled',
      'assessment_completed',
      'accepted',
      'rejected',
    ];

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              top: false,
              child: Container(
                margin: const EdgeInsets.fromLTRB(10, 0, 10, 10),
                padding: EdgeInsets.fromLTRB(
                  12,
                  10,
                  12,
                  MediaQuery.of(context).viewInsets.bottom + 10,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Center(
                      child: SizedBox(
                        width: 40,
                        child: Divider(thickness: 3, color: Color(0xFFD1D5DB)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Filters',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final status in statuses)
                          ChoiceChip(
                            label: Text(status.replaceAll('_', ' ')),
                            selected: draftFilter == status,
                            onSelected: (_) =>
                                setModalState(() => draftFilter = status),
                          ),
                      ],
                    ),
                    SizedBox(height: compact ? 10 : 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setState(() => _filter = 'all');
                              Navigator.of(sheetContext).pop();
                            },
                            child: const Text('Reset'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              setState(() => _filter = draftFilter);
                              Navigator.of(sheetContext).pop();
                            },
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size.fromHeight(40),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text('Apply'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 390;
    final activeFilterCount = _filter == 'all' ? 0 : 1;

    return StudentPageScaffold(
      title: 'Applications',
      body: FutureBuilder<List<ApplicationModel>>(
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
                      Center(child: Text('Failed to load applications')),
                    ],
                  );
                }

                final allItems = snapshot.data!;
                final filteredByStatus = _filter == 'all'
                    ? allItems
                    : allItems.where((item) => item.status == _filter).toList();
                final filtered = filteredByStatus.where((item) {
                  if (_query.isEmpty) return true;
                  final q = _query.toLowerCase();
                  return item.internshipTitle.toLowerCase().contains(q) ||
                      item.companyName.toLowerCase().contains(q);
                }).toList()
                  ..sort((a, b) {
                    final aDate =
                        a.lastUpdate ?? a.appliedAt ?? DateTime(1970);
                    final bDate =
                        b.lastUpdate ?? b.appliedAt ?? DateTime(1970);
                    return bDate.compareTo(aDate);
                  });

                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                  children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0D000000),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _search,
                  onChanged: (value) => setState(() => _query = value.trim()),
                  decoration: InputDecoration(
                    hintText: 'Search by company or role',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            IconButton(
                              onPressed: () =>
                                  _openFilterSheet(compact: compact),
                              icon: const Icon(Icons.tune_rounded, size: 20),
                              tooltip: 'Filters',
                            ),
                            if (activeFilterCount > 0)
                              Positioned(
                                right: 5,
                                top: 5,
                                child: Container(
                                  width: 15,
                                  height: 15,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF145DE0),
                                    shape: BoxShape.circle,
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '$activeFilterCount',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        if (_search.text.isNotEmpty)
                          IconButton(
                            onPressed: () {
                              _search.clear();
                              setState(() => _query = '');
                            },
                            icon:
                                const Icon(Icons.close_rounded, size: 20),
                            tooltip: 'Clear search',
                          ),
                      ],
                    ),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (filtered.isEmpty)
                const EmptyStatePanel(
                  title: 'No applications found',
                  subtitle: 'Try changing filters or search terms.',
                  icon: Icons.filter_alt_off_rounded,
                )
              else
                ...filtered.map(
                  (application) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _ApplicationCard(
                      application: application,
                      highlighted: widget.highlightedApplicationId ==
                          application.id,
                    ),
                  ),
                ),
            ],
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({
    required this.application,
    required this.highlighted,
  });

  final ApplicationModel application;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final applied = application.appliedAt == null
        ? '-'
        : DateFormat('dd MMM yyyy').format(application.appliedAt!);
    final interview = application.interviewDetails;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: highlighted
            ? [
                BoxShadow(
                  color: Theme.of(
                    context,
                  ).colorScheme.primary.withValues(alpha: 0.18),
                  blurRadius: 16,
                  offset: const Offset(0, 7),
                ),
              ]
            : null,
      ),
      child: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color: highlighted
                ? Theme.of(context).colorScheme.primary
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      application.internshipTitle,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  _StatusBadge(status: application.status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${application.companyName}\nApplied $applied',
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12.5,
                ),
              ),
              if (interview != null &&
                  application.status == 'interview_scheduled') ...[
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Interview: ${interview['date'] ?? '-'} • ${interview['time'] ?? '-'}',
                    style: const TextStyle(
                      color: Color(0xFF3730A3),
                      fontWeight: FontWeight.w600,
                      fontSize: 12.5,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        context.push(
                          '/messages?applicationId=${Uri.encodeQueryComponent(application.id)}',
                        );
                      },
                      icon: const Icon(Icons.chat_bubble_outline_rounded),
                      label: const Text('Message'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextButton(
                      onPressed: () =>
                          context.push('/internships/${application.internshipId}'),
                      child: const Text('View Internship'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (status) {
      case 'accepted':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF166534);
        break;
      case 'rejected':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        break;
      case 'interview_scheduled':
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1D4ED8);
        break;
      case 'shortlisted':
        bg = const Color(0xFFE0E7FF);
        fg = const Color(0xFF3730A3);
        break;
      default:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: fg,
          fontWeight: FontWeight.w700,
          fontSize: 10.5,
        ),
      ),
    );
  }
}
