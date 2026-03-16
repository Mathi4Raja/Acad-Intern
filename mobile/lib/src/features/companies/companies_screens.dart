import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/models.dart';
import '../../core/providers.dart';
import '../shell/student_shell.dart';

class CompaniesScreen extends ConsumerStatefulWidget {
  const CompaniesScreen({super.key});

  @override
  ConsumerState<CompaniesScreen> createState() => _CompaniesScreenState();
}

class _CompaniesScreenState extends ConsumerState<CompaniesScreen> {
  final _search = TextEditingController();
  final _industry = TextEditingController();
  final _location = TextEditingController();
  bool _verifiedOnly = false;
  int _activeFilterCount = 0;
  final _scrollController = ScrollController();
  final List<CompanyModel> _companies = [];
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
      _companies.clear();
      _activeFilterCount = _filterCount(
        industry: _industry.text,
        location: _location.text,
        verifiedOnly: _verifiedOnly,
      );
    });

    await _fetchPage(1);
    if (_hasMore) {
      await _fetchPage(2);
      _page = 3;
    } else {
      _page = 2;
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchPage(int page) async {
    final repository = ref.read(studentRepositoryProvider);
    final data = await repository.fetchCompaniesWithFilters(
      search: _search.text.trim(),
      industry: _industry.text.trim(),
      location: _location.text.trim(),
      verified: _verifiedOnly ? true : null,
      page: page,
      limit: _pageSize,
    );
    if (!mounted) return;
    setState(() {
      _companies.addAll(data);
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

  int _filterCount({
    required String industry,
    required String location,
    required bool verifiedOnly,
  }) {
    var count = 0;
    if (industry.trim().isNotEmpty) count++;
    if (location.trim().isNotEmpty) count++;
    if (verifiedOnly) count++;
    return count;
  }

  Future<void> _openFilterSheet() async {
    final draftIndustry = TextEditingController(text: _industry.text);
    final draftLocation = TextEditingController(text: _location.text);
    var draftVerified = _verifiedOnly;

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
                    const SizedBox(height: 10),
                    TextField(
                      controller: draftIndustry,
                      decoration: const InputDecoration(
                        hintText: 'Industry',
                        prefixIcon: Icon(Icons.work_outline_rounded),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: draftLocation,
                      decoration: const InputDecoration(
                        hintText: 'Location',
                        prefixIcon: Icon(Icons.location_on_outlined),
                      ),
                    ),
                    const SizedBox(height: 6),
                    SwitchListTile(
                      value: draftVerified,
                      onChanged: (value) {
                        setModalState(() => draftVerified = value);
                      },
                      title: const Text('Verified companies only'),
                      contentPadding: EdgeInsets.zero,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              _industry.clear();
                              _location.clear();
                              _verifiedOnly = false;
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
                                _industry.text = draftIndustry.text.trim();
                                _location.text = draftLocation.text.trim();
                                _verifiedOnly = draftVerified;
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
  }

  @override
  Widget build(BuildContext context) {
    return StudentPageScaffold(
      title: 'Companies',
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
          children: [
            if (_isLoading) ...[
              const SizedBox(height: 140),
              const Center(child: CircularProgressIndicator()),
            ] else ...[
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
                  onSubmitted: (_) => _reload(),
                  decoration: InputDecoration(
                    hintText: 'Search companies',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            IconButton(
                              onPressed: _openFilterSheet,
                              icon: const Icon(Icons.tune_rounded, size: 20),
                              tooltip: 'Filters',
                            ),
                            if (_activeFilterCount > 0)
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
                                    '$_activeFilterCount',
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
              ),
              const SizedBox(height: 12),
              if (_companies.isEmpty)
                const EmptyStatePanel(
                  title: 'No companies found',
                  subtitle: 'Try broadening your filters.',
                  icon: Icons.business_center_outlined,
                )
              else
                ..._companies.map(
                  (company) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _CompanyListCard(
                      company: company,
                      onTap: () => context.push('/companies/${company.id}'),
                    ),
                  ),
                ),
              if (_isLoadingMore)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Center(child: CircularProgressIndicator()),
                ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _search.dispose();
    _industry.dispose();
    _location.dispose();
    super.dispose();
  }
}

class CompanyDetailScreen extends ConsumerStatefulWidget {
  const CompanyDetailScreen({super.key, required this.companyId});

  final String companyId;

  @override
  ConsumerState<CompanyDetailScreen> createState() => _CompanyDetailScreenState();
}

class _CompanyListCard extends StatelessWidget {
  const _CompanyListCard({
    required this.company,
    required this.onTap,
  });

  final CompanyModel company;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final description = (company.description ?? '').trim();
    final industry = (company.industry ?? '').trim();
    final location = (company.location ?? '').trim();
    final size = (company.companySize ?? '').trim();

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
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
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: company.logo != null && company.logo!.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: company.logo!,
                          fit: BoxFit.cover,
                          memCacheWidth: 120,
                          memCacheHeight: 120,
                          placeholder: (_, __) => const Icon(
                            Icons.auto_awesome_rounded,
                            size: 18,
                            color: Color(0xFFF59E0B),
                          ),
                          errorWidget: (_, __, ___) => const Icon(
                            Icons.auto_awesome_rounded,
                            size: 18,
                            color: Color(0xFFF59E0B),
                          ),
                        )
                      : Center(
                          child: Text(
                            company.companyName.isEmpty
                                ? 'C'
                                : company.companyName[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                        ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              company.companyName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          if (company.verified) ...[
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.verified_rounded,
                              size: 15,
                              color: Color(0xFF2563EB),
                            ),
                          ],
                        ],
                      ),
                      if (industry.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: const Color(0xFFDBEAFE)),
                          ),
                          child: Text(
                            industry.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.4,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12.5,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                  height: 1.35,
                ),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                if (location.isNotEmpty)
                  _CompanyMeta(
                    icon: Icons.location_on_outlined,
                    text: location,
                  ),
                if (location.isNotEmpty && size.isNotEmpty)
                  const SizedBox(width: 12),
                if (size.isNotEmpty)
                  _CompanyMeta(
                    icon: Icons.groups_outlined,
                    text: size,
                  ),
                const Spacer(),
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Icon(
                    Icons.chevron_right_rounded,
                    size: 18,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CompanyMeta extends StatelessWidget {
  const _CompanyMeta({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 6),
        Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _CompanyDetailScreenState extends ConsumerState<CompanyDetailScreen> {
  bool _reported = false;
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<dynamic>> _load() {
    final repository = ref.read(studentRepositoryProvider);
    return Future.wait([
      repository.getCompany(widget.companyId),
      repository.fetchInternships(
        preferMatch: false,
        companyId: widget.companyId,
      ),
    ]);
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  Future<bool> _confirmReport() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Report company?'),
          content: const Text(
            'This will flag the company for review. Continue?',
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
    return result ?? false;
  }

  Widget _buildBannerFallback() {
    return Container(
      height: 110,
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(22),
        ),
        gradient: LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFF4C1D95)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
    );
  }

  Future<void> _openWebsite(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final repository = ref.watch(studentRepositoryProvider);

    return StudentPageScaffold(
      title: 'Company',
      body: FutureBuilder<List<dynamic>>(
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
                      Center(child: Text('Failed to load company')),
                    ],
                  );
                }
                final company = snapshot.data![0] as CompanyModel;
                final internships = snapshot.data![1] as List<InternshipModel>;
                final industry = (company.industry ?? '').trim();
                final location = (company.location ?? '').trim();
                final description =
                    (company.description ?? company.about ?? '').trim();
                final size = (company.companySize ?? '').trim();
                final bannerUrl = (company.banner ?? '').trim();
                final bannerWidget = bannerUrl.isNotEmpty
                    ? ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(22)),
                        child: CachedNetworkImage(
                          imageUrl: bannerUrl,
                          height: 110,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          memCacheWidth: 900,
                          memCacheHeight: 300,
                          placeholder: (_, __) => _buildBannerFallback(),
                          errorWidget: (_, __, ___) => _buildBannerFallback(),
                        ),
                      )
                    : _buildBannerFallback();

                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                  children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0F000000),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        bannerWidget,
                        Positioned(
                          right: 12,
                          top: 12,
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x0F000000),
                                  blurRadius: 8,
                                  offset: Offset(0, 3),
                                ),
                              ],
                            ),
                            child: IconButton(
                              onPressed: _reported
                                  ? null
                                  : () async {
                                      final confirmed = await _confirmReport();
                                      if (!confirmed) return;
                                      await repository.createReport({
                                        'reportedUserId': company.userId,
                                        'subject':
                                            'Report Company: ${company.companyName}',
                                        'body':
                                            'Reported from mobile company detail.',
                                        'category': 'other',
                                        'priority': 'medium',
                                      });
                                      if (!mounted) return;
                                      setState(() => _reported = true);
                                    },
                              icon: Icon(
                                _reported
                                    ? Icons.flag_rounded
                                    : Icons.flag_outlined,
                                size: 18,
                                color: _reported
                                    ? const Color(0xFF2563EB)
                                    : const Color(0xFF64748B),
                              ),
                              tooltip:
                                  _reported ? 'Reported' : 'Report Company',
                            ),
                          ),
                        ),
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: -34,
                          child: Center(
                            child: Container(
                              width: 68,
                              height: 68,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x14000000),
                                    blurRadius: 10,
                                    offset: Offset(0, 6),
                                  ),
                                ],
                              ),
                              alignment: Alignment.center,
                              child: company.logo != null &&
                                      company.logo!.isNotEmpty
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(16),
                                      child: CachedNetworkImage(
                                        imageUrl: company.logo!,
                                        width: 52,
                                        height: 52,
                                        fit: BoxFit.cover,
                                        memCacheWidth: 140,
                                        memCacheHeight: 140,
                                        placeholder: (_, __) => const Icon(
                                          Icons.auto_awesome_rounded,
                                          size: 22,
                                          color: Color(0xFFF59E0B),
                                        ),
                                        errorWidget: (_, __, ___) =>
                                            const Icon(
                                          Icons.auto_awesome_rounded,
                                          size: 22,
                                          color: Color(0xFFF59E0B),
                                        ),
                                      ),
                                    )
                                  : const Icon(
                                      Icons.auto_awesome_rounded,
                                      size: 22,
                                      color: Color(0xFFF59E0B),
                                    ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 42),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Flexible(
                                child: Text(
                                  company.companyName,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (company.verified) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(999),
                                    border: Border.all(
                                        color: const Color(0xFFBFDBFE)),
                                  ),
                                  child: const Text(
                                    'VERIFIED',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF2563EB),
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            alignment: WrapAlignment.center,
                            children: [
                              if (industry.isNotEmpty)
                                _ChipPill(
                                  icon: Icons.apartment_rounded,
                                  label: industry.toUpperCase(),
                                  color: const Color(0xFF2563EB),
                                  background: const Color(0xFFEFF6FF),
                                ),
                              if (location.isNotEmpty)
                                _ChipPill(
                                  icon: Icons.location_on_rounded,
                                  label: location.toUpperCase(),
                                  color: const Color(0xFF16A34A),
                                  background: const Color(0xFFECFDF3),
                                ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          if (company.website != null &&
                              company.website!.isNotEmpty)
                            FilledButton.icon(
                              onPressed: () => _openWebsite(company.website),
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF0F172A),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 18,
                                  vertical: 10,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(Icons.open_in_new_rounded,
                                  size: 16),
                              label: const Text('Visit Site'),
                            ),
                          if (description.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            _InfoSection(
                              title: 'About',
                              body: description,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text(
                    'Active Openings',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      internships.length.toString(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (internships.isEmpty)
                const Text('No active internships for this company.')
              else
                ...internships.map(
                  (internship) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _CompanyInternshipCard(
                      internship: internship,
                      onTap: () =>
                          context.push('/internships/${internship.id}'),
                    ),
                  ),
                ),
              const SizedBox(height: 6),
              _OverviewCard(
                industry: industry,
                size: size,
                location: location,
                verified: company.verified,
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

class _ChipPill extends StatelessWidget {
  const _ChipPill({
    required this.icon,
    required this.label,
    required this.color,
    required this.background,
  });

  final IconData icon;
  final String label;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  const _InfoSection({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: const TextStyle(
              fontSize: 12.5,
              color: Color(0xFF475569),
              height: 1.35,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _CompanyInternshipCard extends StatelessWidget {
  const _CompanyInternshipCard({
    required this.internship,
    required this.onTap,
  });

  final InternshipModel internship;
  final VoidCallback onTap;

  String _modeLabel(String value) {
    switch (value) {
      case 'remote':
        return 'REMOTE';
      case 'hybrid':
        return 'HYBRID';
      case 'onsite':
        return 'ON-SITE';
      default:
        return value.toUpperCase();
    }
  }

  String _stipendLabel(int stipend) {
    if (stipend >= 1000) {
      return '₹${(stipend / 1000).toStringAsFixed(0)}k';
    }
    return '₹$stipend';
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0D000000),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _modeLabel(internship.mode),
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              internship.title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                if (internship.location != null &&
                    internship.location!.isNotEmpty) ...[
                  const Icon(Icons.location_on_outlined,
                      size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 4),
                  Text(
                    internship.location!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF94A3B8),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                if (internship.durationWeeks > 0) ...[
                  const SizedBox(width: 10),
                  const Icon(Icons.schedule_rounded,
                      size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 4),
                  Text(
                    '${internship.durationWeeks}w',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF94A3B8),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            const SizedBox(height: 8),
            Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'STIPEND',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                    const SizedBox(height: 4),
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(
                          fontFamily: 'Roboto',
                          color: Color(0xFF0F172A),
                        ),
                        children: [
                          TextSpan(
                            text: _stipendLabel(internship.stipend),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const TextSpan(
                            text: '/m',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Icon(Icons.chevron_right_rounded,
                      color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OverviewCard extends StatelessWidget {
  const _OverviewCard({
    required this.industry,
    required this.size,
    required this.location,
    required this.verified,
  });

  final String industry;
  final String size;
  final String location;
  final bool verified;

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
          const Text(
            'Overview',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          if (industry.isNotEmpty)
            _OverviewRow(
              icon: Icons.apartment_rounded,
              iconBg: const Color(0xFFEFF6FF),
              iconColor: const Color(0xFF2563EB),
              label: 'Industry',
              value: industry,
            ),
          if (size.isNotEmpty)
            _OverviewRow(
              icon: Icons.groups_rounded,
              iconBg: const Color(0xFFEFF6FF),
              iconColor: const Color(0xFF2563EB),
              label: 'Size',
              value: size,
            ),
          if (location.isNotEmpty)
            _OverviewRow(
              icon: Icons.location_on_rounded,
              iconBg: const Color(0xFFFEE2E2),
              iconColor: const Color(0xFFDC2626),
              label: 'HQ',
              value: location,
            ),
          if (verified) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Row(
                children: [
                  Icon(Icons.verified_rounded, color: Colors.white),
                  SizedBox(width: 8),
                  Text(
                    'VERIFIED SAFE',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(width: 6),
                  Text(
                    'By Acad-Intern',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _OverviewRow extends StatelessWidget {
  const _OverviewRow({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
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
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
