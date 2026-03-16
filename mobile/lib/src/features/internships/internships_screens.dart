import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/models.dart';
import '../../core/dropdown_styles.dart';
import '../../core/providers.dart';
import '../../core/app_config.dart';
import '../shell/student_shell.dart';

class InternshipsScreen extends ConsumerStatefulWidget {
  const InternshipsScreen({super.key});

  @override
  ConsumerState<InternshipsScreen> createState() => _InternshipsScreenState();
}

class _InternshipsScreenState extends ConsumerState<InternshipsScreen> {
  final _search = TextEditingController();
  final _scrollController = ScrollController();
  String _mode = '';
  String _minStipend = '';
  String _maxDuration = '';
  String _sortBy = 'match';
  final Set<String> _appliedIds = <String>{};
  String? _applyingInternshipId;
  final List<InternshipModel> _items = [];
  var _isLoading = true;
  var _isLoadingMore = false;
  var _hasMore = true;
  var _page = 1;
  static const _pageSize = 10;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_handleScroll);
    _loadInitial();
  }

  Future<void> _reload() async {
    await _loadInitial();
  }

  Future<void> _loadInitial() async {
    setState(() {
      _isLoading = true;
      _isLoadingMore = false;
      _hasMore = true;
      _page = 1;
      _items.clear();
    });

    await _fetchPage(1);
    if (_hasMore) {
      await _fetchPage(2);
      _page = 3;
    } else {
      _page = 2;
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchPage(int page) async {
    final repository = ref.read(studentRepositoryProvider);
    final data = await repository.fetchInternships(
      search: _search.text.trim(),
      mode: _mode,
      minStipend: _minStipend,
      maxDuration: _maxDuration,
      preferMatch: true,
      page: page,
      limit: _pageSize,
    );
    if (!mounted) return;
    setState(() {
      _items.addAll(data);
      _hasMore = data.length == _pageSize;
    });
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMore) return;
    setState(() => _isLoadingMore = true);
    await _fetchPage(_page);
    if (mounted) {
      setState(() {
        _page += 1;
        _isLoadingMore = false;
      });
    }
  }

  void _handleScroll() {
    if (_isLoading || _isLoadingMore || !_hasMore) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  String _modeLabel(String value) {
    switch (value) {
      case 'remote':
        return 'Remote';
      case 'hybrid':
        return 'Hybrid';
      case 'onsite':
        return 'On-site';
      default:
        return value;
    }
  }

  String _sortLabel(String value) {
    switch (value) {
      case 'match':
        return 'Match';
      case 'recent':
        return 'Recent';
      case 'stipend':
        return 'Stipend';
      default:
        return value;
    }
  }

  String _durationLabel(String value) => '<=${value}w';

  Future<void> _openFilterSheet({required bool compact}) async {
    var draftMode = _mode;
    var draftSortBy = _sortBy;
    var draftDuration = _maxDuration;
    final minStipendController = TextEditingController(text: _minStipend);

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final modeEntries = AppDropdownStyles.buildEntries(
              const ['remote', 'hybrid', 'onsite'],
              selected: draftMode.isEmpty ? null : draftMode,
              labelBuilder: _modeLabel,
            );
            final sortEntries = AppDropdownStyles.buildEntries(
              const ['match', 'recent', 'stipend'],
              selected: draftSortBy,
              labelBuilder: _sortLabel,
            );
            final durationEntries = AppDropdownStyles.buildEntries(
              const ['8', '12', '16'],
              selected: draftDuration.isEmpty ? null : draftDuration,
              labelBuilder: _durationLabel,
            );

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
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 52,
                            child: DropdownMenu<String>(
                              initialSelection:
                                  draftMode.isEmpty ? null : draftMode,
                              onSelected: (value) {
                                setModalState(() => draftMode = value ?? '');
                              },
                              expandedInsets: EdgeInsets.zero,
                              menuHeight: compact ? 200 : 240,
                              hintText: 'Mode',
                              trailingIcon:
                                  const Icon(Icons.keyboard_arrow_down_rounded),
                              selectedTrailingIcon:
                                  const Icon(Icons.keyboard_arrow_up_rounded),
                              textStyle: AppDropdownStyles.textStyle,
                              menuStyle: AppDropdownStyles.menuStyle,
                              inputDecorationTheme:
                                  AppDropdownStyles.inputDecorationTheme(
                                compact: true,
                                borderRadius: 18,
                              ),
                              dropdownMenuEntries: modeEntries,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: SizedBox(
                            height: 52,
                            child: TextField(
                              controller: minStipendController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                hintText: 'Min stipend',
                                prefixText: '₹ ',
                                isDense: true,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 52,
                            child: DropdownMenu<String>(
                              initialSelection:
                                  draftDuration.isEmpty ? null : draftDuration,
                              onSelected: (value) {
                                setModalState(() => draftDuration = value ?? '');
                              },
                              expandedInsets: EdgeInsets.zero,
                              menuHeight: compact ? 200 : 240,
                              hintText: 'Max duration',
                              trailingIcon:
                                  const Icon(Icons.keyboard_arrow_down_rounded),
                              selectedTrailingIcon:
                                  const Icon(Icons.keyboard_arrow_up_rounded),
                              textStyle: AppDropdownStyles.textStyle,
                              menuStyle: AppDropdownStyles.menuStyle,
                              inputDecorationTheme:
                                  AppDropdownStyles.inputDecorationTheme(
                                compact: true,
                                borderRadius: 18,
                              ),
                              dropdownMenuEntries: durationEntries,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: SizedBox(
                            height: 52,
                            child: DropdownMenu<String>(
                              initialSelection: draftSortBy,
                              onSelected: (value) {
                                setModalState(
                                    () => draftSortBy = value ?? 'match');
                              },
                              expandedInsets: EdgeInsets.zero,
                              menuHeight: compact ? 200 : 240,
                              hintText: 'Sort by',
                              trailingIcon:
                                  const Icon(Icons.keyboard_arrow_down_rounded),
                              selectedTrailingIcon:
                                  const Icon(Icons.keyboard_arrow_up_rounded),
                              textStyle: AppDropdownStyles.textStyle,
                              menuStyle: AppDropdownStyles.menuStyle,
                              inputDecorationTheme:
                                  AppDropdownStyles.inputDecorationTheme(
                                compact: true,
                                borderRadius: 18,
                              ),
                              dropdownMenuEntries: sortEntries,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setState(() {
                                _mode = '';
                                _minStipend = '';
                                _maxDuration = '';
                                _sortBy = 'match';
                              });
                              Navigator.of(sheetContext).pop();
                              _reload();
                            },
                            child: const Text('Reset'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _mode = draftMode;
                                _minStipend = minStipendController.text.trim();
                                _maxDuration = draftDuration;
                                _sortBy = draftSortBy;
                              });
                              Navigator.of(sheetContext).pop();
                              _reload();
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

    minStipendController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 390;
    final activeFilterCount = [
      _mode,
      _minStipend,
      _maxDuration,
      _sortBy == 'match' ? '' : _sortBy,
    ].where((item) => item.isNotEmpty).length;

    return StudentPageScaffold(
      title: 'Internships',
      body: RefreshIndicator(
        onRefresh: _reload,
        child: Builder(
          builder: (builderContext) {
            if (_isLoading) {
              return ListView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                children: const [
                  SizedBox(height: 140),
                  Center(child: CircularProgressIndicator()),
                ],
              );
            }

            final internships = [..._items];
            internships.sort((a, b) {
              if (_sortBy == 'recent') {
                return (b.createdAt ?? DateTime(1970))
                    .compareTo(a.createdAt ?? DateTime(1970));
              }
              if (_sortBy == 'stipend') {
                return b.stipend.compareTo(a.stipend);
              }
              return (b.matchScore ?? 0).compareTo(a.matchScore ?? 0);
            });

            return ListView(
              controller: _scrollController,
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
                child: Column(
                  children: [
                    TextField(
                      controller: _search,
                      onSubmitted: (_) => _reload(),
                      decoration: InputDecoration(
                        hintText: 'Search roles, skills, companies',
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
                                  icon:
                                      const Icon(Icons.tune_rounded, size: 20),
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
                            IconButton(
                              onPressed: _reload,
                              icon: const Icon(Icons.refresh_rounded, size: 20),
                              tooltip: 'Refresh',
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
                  ],
                ),
              ),
              const SizedBox(height: 10),
              if (internships.isEmpty)
                const EmptyStatePanel(
                  title: 'No internships found',
                  subtitle: 'Try broadening your filters.',
                  icon: Icons.work_off_outlined,
                )
              else
                ...internships.map(
                  (internship) {
                    final isApplied = internship.hasApplied ||
                        _appliedIds.contains(internship.id);
                    final isApplying = _applyingInternshipId == internship.id;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _InternshipListCard(
                        internship: internship,
                        isApplied: isApplied,
                        isApplying: isApplying,
                        onDetailsTap: () =>
                            builderContext.push('/internships/${internship.id}'),
                        onApplyTap: isApplied
                            ? null
                            : () async {
                                setState(() {
                                  _applyingInternshipId = internship.id;
                                });
                                try {
                                  await ref
                                      .read(studentRepositoryProvider)
                                      .applyToInternship(internship.id);
                                  if (!mounted) return;
                                  setState(() {
                                    _appliedIds.add(internship.id);
                                  });
                                  ScaffoldMessenger.of(this.context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Applied successfully'),
                                    ),
                                  );
                                } finally {
                                  if (mounted) {
                                    setState(() {
                                      _applyingInternshipId = null;
                                    });
                                  }
                                }
                              },
                      ),
                    );
                  },
                ),
              if (_isLoadingMore)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Center(child: CircularProgressIndicator()),
                ),
            ],
            );
          },
        ),
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _search.dispose();
    super.dispose();
  }
}

class _InternshipListCard extends StatelessWidget {
  const _InternshipListCard({
    required this.internship,
    required this.isApplied,
    required this.isApplying,
    required this.onDetailsTap,
    required this.onApplyTap,
  });

  final InternshipModel internship;
  final bool isApplied;
  final bool isApplying;
  final VoidCallback onDetailsTap;
  final VoidCallback? onApplyTap;

  @override
  Widget build(BuildContext context) {
    final modeLabel = _toTitle(internship.mode);
    final createdAt = internship.createdAt;
    final contentUpdatedAt = internship.contentUpdatedAt;
    final wasEdited = contentUpdatedAt != null;
    final postedDate = wasEdited
        ? 'Edited ${_formatTimeAgo(contentUpdatedAt)}'
        : createdAt != null
            ? 'Posted ${_formatTimeAgo(createdAt)}'
            : 'Posted recently';
    final skills = internship.skillsRequired.take(2).toList();
    final extraSkills = internship.skillsRequired.length - skills.length;
    final skillChips = skills
        .map(
          (skill) => Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 9,
              vertical: 3.5,
            ),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF1FF),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: const Color(0xFFC9DBFF)),
            ),
            child: Text(
              skill,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1D4ED8),
              ),
            ),
          ),
        )
        .toList();
    if (extraSkills > 0) {
      skillChips.add(
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 3.5,
          ),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Text(
            '+$extraSkills',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Color(0xFF64748B),
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(10, 9, 10, 9),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 8,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                clipBehavior: Clip.antiAlias,
                child: internship.company.logo != null &&
                        internship.company.logo!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: internship.company.logo!,
                        fit: BoxFit.cover,
                        memCacheWidth: 96,
                        memCacheHeight: 96,
                        placeholder: (_, __) => const Icon(
                          Icons.auto_awesome_rounded,
                          size: 17,
                          color: Color(0xFFF59E0B),
                        ),
                        errorWidget: (_, __, ___) => const Icon(
                          Icons.auto_awesome_rounded,
                          size: 17,
                          color: Color(0xFFF59E0B),
                        ),
                      )
                    : const Icon(
                        Icons.auto_awesome_rounded,
                        size: 16,
                        color: Color(0xFFF59E0B),
                      ),
              ),
              const SizedBox(width: 7),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      internship.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      internship.company.companyName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              if (isApplied)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8FFF1),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: const Color(0xFFB7ECCD)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.check_circle_rounded,
                        size: 12,
                        color: Color(0xFF15803D),
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Applied',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF15803D),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: [
              _MetaChip(
                icon: Icons.location_on_outlined,
                label: modeLabel,
              ),
              _MetaChip(
                icon: Icons.access_time_rounded,
                label: '${internship.durationWeeks} Weeks',
              ),
              _MetaChip(
                icon: Icons.currency_rupee_rounded,
                label: _stipendLabel(internship.stipend),
                textColor: const Color(0xFF059669),
                background: const Color(0xFFE8FFF6),
              ),
            ],
          ),
          if (skills.isNotEmpty) ...[
            const SizedBox(height: 7),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: skillChips,
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(
                Icons.schedule_rounded,
                size: 13,
                color: Color(0xFF94A3B8),
              ),
              const SizedBox(width: 5),
              Text(
                postedDate,
                style: const TextStyle(
                  fontSize: 11.5,
                  color: Color(0xFF94A3B8),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onDetailsTap,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(36),
                    side: const BorderSide(color: Color(0xFFD1D5DB)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Details',
                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: isApplying ? null : onApplyTap,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(36),
                    backgroundColor: isApplied
                        ? const Color(0xFF4CC57A)
                        : const Color(0xFF0D1B3D),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: isApplying
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              isApplied ? 'Applied' : 'Apply',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Icon(
                              isApplied
                                  ? Icons.check_circle_outline_rounded
                                  : Icons.arrow_forward_rounded,
                              size: 15,
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _toTitle(String value) {
    if (value.isEmpty) return 'Remote';
    final normalized = value.toLowerCase();
    if (normalized == 'onsite') return 'Onsite';
    return normalized[0].toUpperCase() + normalized.substring(1);
  }

  String _stipendLabel(int stipend) {
    if (stipend >= 1000) {
      return '₹${(stipend / 1000).toStringAsFixed(0)}K/month';
    }
    return '₹$stipend/month';
  }

  String _formatTimeAgo(DateTime? date) {
    if (date == null) return 'Just now';
    final now = DateTime.now();
    final diffInSeconds = now.difference(date).inSeconds;

    if (diffInSeconds < 60) return 'Just now';

    final diffInMinutes = diffInSeconds ~/ 60;
    if (diffInMinutes < 60) {
      return '$diffInMinutes ${diffInMinutes == 1 ? 'min' : 'mins'} ago';
    }

    final diffInHours = diffInMinutes ~/ 60;
    if (diffInHours < 24) {
      return '$diffInHours hour${diffInHours == 1 ? '' : 's'} ago';
    }

    final diffInDays = diffInHours ~/ 24;
    if (diffInDays == 1) return 'Yesterday';
    if (diffInDays < 7) return '$diffInDays days ago';
    if (diffInDays < 30) return '${diffInDays ~/ 7} weeks ago';

    return DateFormat('d/M/y').format(date);
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({
    required this.icon,
    required this.label,
    this.textColor = const Color(0xFF334155),
    this.background = const Color(0xFFF1F5F9),
  });

  final IconData icon;
  final String label;
  final Color textColor;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

class InternshipDetailScreen extends ConsumerStatefulWidget {
  const InternshipDetailScreen({super.key, required this.internshipId});

  final String internshipId;

  @override
  ConsumerState<InternshipDetailScreen> createState() =>
      _InternshipDetailScreenState();
}

class _InternshipDetailScreenState extends ConsumerState<InternshipDetailScreen> {
  bool _applied = false;
  late Future<InternshipModel> _future;

  String _shareLinkFor(String internshipId) {
    return '${AppConfig.normalizedFrontendBaseUrl}/internships/$internshipId';
  }

  @override
  void initState() {
    super.initState();
    _future = _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(studentRepositoryProvider).incrementInternshipView(widget.internshipId);
    });
  }

  Future<InternshipModel> _load() {
    return ref.read(studentRepositoryProvider).getInternship(widget.internshipId);
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    final repository = ref.watch(studentRepositoryProvider);

    return StudentPageScaffold(
      title: 'Internship Details',
      body: FutureBuilder<InternshipModel>(
        future: _future,
        builder: (builderContext, snapshot) {
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
                      Center(child: Text('Failed to load internship')),
                    ],
                  );
                }
                final internship = snapshot.data!;
                final hasApplied = _applied || internship.hasApplied;

                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                  children: [
              _InternshipHeaderCard(
                title: internship.title,
                companyName: internship.company.companyName,
                verified: internship.company.verified,
                locationLabel:
                    internship.location ?? _toTitle(internship.mode),
                durationLabel: '${internship.durationWeeks} Weeks',
                stipendLabel: _stipendLabel(internship.stipend),
                postedOn: _formatDate(internship.createdAt),
                onBookmarkTap: () {},
              ),
              const SizedBox(height: 10),
              _SectionCard(
                title: 'About the internship',
                children: [
                  Text(
                    internship.description,
                    style: const TextStyle(
                      fontSize: 13.5,
                      color: Color(0xFF475569),
                      height: 1.4,
                    ),
                  ),
                  if (internship.responsibilities != null &&
                      internship.responsibilities!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    const Text(
                      'Responsibilities',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      internship.responsibilities!,
                      style: const TextStyle(
                        fontSize: 13.5,
                        color: Color(0xFF475569),
                        height: 1.4,
                      ),
                    ),
                  ],
                  if (internship.requirements != null &&
                      internship.requirements!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    const Text(
                      'Requirements',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      internship.requirements!,
                      style: const TextStyle(
                        fontSize: 13.5,
                        color: Color(0xFF475569),
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
              if (internship.skillsRequired.isNotEmpty) ...[
                const SizedBox(height: 10),
                _SectionCard(
                  title: 'Skills required',
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: internship.skillsRequired
                          .map(
                            (skill) => Chip(
                              label: Text(skill),
                              backgroundColor: const Color(0xFFEFF6FF),
                              labelStyle: const TextStyle(
                                color: Color(0xFF2563EB),
                                fontWeight: FontWeight.w600,
                              ),
                              side:
                                  const BorderSide(color: Color(0xFFDBEAFE)),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 10),
              _SectionCard(
                title: 'Interested?',
                subtitle: "Don't miss out on this opportunity.",
                children: [
                  const SizedBox(height: 6),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: hasApplied
                          ? null
                          : () async {
                              await repository
                                  .applyToInternship(widget.internshipId);
                              if (!mounted) return;
                              setState(() => _applied = true);
                              ScaffoldMessenger.of(this.context).showSnackBar(
                                const SnackBar(
                                  content: Text('Applied successfully'),
                                ),
                              );
                            },
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(46),
                        backgroundColor: const Color(0xFF0B5BE8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(hasApplied ? 'Applied' : 'Apply Now'),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final link = _shareLinkFor(widget.internshipId);
                        final shareText =
                            'Check out this internship: ${internship.title} at ${internship.company.companyName}\n$link';
                        try {
                          await Share.share(
                            shareText,
                            subject:
                                'Internship: ${internship.title} at ${internship.company.companyName}',
                          );
                        } catch (_) {
                          await Clipboard.setData(ClipboardData(text: link));
                          if (!mounted) return;
                          ScaffoldMessenger.of(this.context).showSnackBar(
                            const SnackBar(
                              content:
                                  Text('Share unavailable. Link copied instead'),
                            ),
                          );
                        }
                      },
                      icon: const Icon(Icons.share_outlined),
                      label: const Text('Share this Internship'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _InfoRow(
                    label: 'Deadline',
                    value: internship.deadline == null
                        ? 'Not specified'
                        : DateFormat('MMMM d, y').format(internship.deadline!),
                  ),
                  const SizedBox(height: 6),
                  _InfoRow(
                    label: 'Openings',
                    value: internship.openings.toString(),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _CompanyCard(
                company: internship.company,
                onTap: () =>
                    builderContext.push('/companies/${internship.company.id}'),
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

  String _formatDate(DateTime? value) {
    if (value == null) return 'Not specified';
    return DateFormat('MMMM d, y').format(value);
  }

  String _toTitle(String value) {
    if (value.isEmpty) return 'Remote';
    final normalized = value.toLowerCase();
    if (normalized == 'onsite') return 'Onsite';
    return normalized[0].toUpperCase() + normalized.substring(1);
  }

  String _stipendLabel(int stipend) {
    if (stipend >= 1000) {
      return '₹${(stipend / 1000).toStringAsFixed(0)}K/month';
    }
    return '₹$stipend/month';
  }
}

class _InternshipHeaderCard extends StatelessWidget {
  const _InternshipHeaderCard({
    required this.title,
    required this.companyName,
    required this.verified,
    required this.locationLabel,
    required this.durationLabel,
    required this.stipendLabel,
    required this.postedOn,
    required this.onBookmarkTap,
  });

  final String title;
  final String companyName;
  final bool verified;
  final String locationLabel;
  final String durationLabel;
  final String stipendLabel;
  final String postedOn;
  final VoidCallback onBookmarkTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.business_rounded,
                            size: 16, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            companyName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13.5,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        if (verified) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.verified_rounded,
                              size: 16, color: Color(0xFF2563EB)),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: onBookmarkTap,
                icon: const Icon(Icons.bookmark_border_rounded),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFFF8FAFC),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.6,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _MetaTile(
                icon: Icons.location_on_rounded,
                label: 'Location',
                value: locationLabel,
                color: const Color(0xFF2563EB),
              ),
              _MetaTile(
                icon: Icons.schedule_rounded,
                label: 'Duration',
                value: durationLabel,
                color: const Color(0xFF16A34A),
              ),
              _MetaTile(
                icon: Icons.currency_rupee_rounded,
                label: 'Stipend',
                value: stipendLabel,
                color: const Color(0xFF7C3AED),
              ),
              _MetaTile(
                icon: Icons.calendar_today_rounded,
                label: 'Posted on',
                value: postedOn,
                color: const Color(0xFFF97316),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetaTile extends StatelessWidget {
  const _MetaTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10,
                    letterSpacing: 0.6,
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    this.subtitle,
    required this.children,
  });

  final String title;
  final String? subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: const TextStyle(
                fontSize: 12.5,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12.5,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w600,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12.5,
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _CompanyCard extends StatelessWidget {
  const _CompanyCard({
    required this.company,
    required this.onTap,
  });

  final CompanyModel company;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final description = company.description ?? company.about ?? '';
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'About Company',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: onTap,
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    company.companyName.isEmpty
                        ? 'C'
                        : company.companyName[0].toUpperCase(),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        company.companyName,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (company.website != null &&
                          company.website!.isNotEmpty)
                        Text(
                          'Visit Website',
                          style: TextStyle(
                            fontSize: 12.5,
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded),
              ],
            ),
          ),
          const SizedBox(height: 10),
          if (company.industry != null && company.industry!.isNotEmpty)
            _CompanyInfoRow(
              icon: Icons.business_center_outlined,
              text: company.industry!,
            ),
          if (company.companySize != null && company.companySize!.isNotEmpty)
            _CompanyInfoRow(
              icon: Icons.groups_outlined,
              text: company.companySize!,
            ),
          if (company.location != null && company.location!.isNotEmpty)
            _CompanyInfoRow(
              icon: Icons.location_on_outlined,
              text: company.location!,
            ),
          if (description.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              description,
              style: const TextStyle(
                fontSize: 12.5,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CompanyInfoRow extends StatelessWidget {
  const _CompanyInfoRow({
    required this.icon,
    required this.text,
  });

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12.5,
                color: Color(0xFF475569),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
