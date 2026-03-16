import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_file_dialog/flutter_file_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/models.dart';
import '../../core/dropdown_styles.dart';
import '../../core/providers.dart';
import '../shell/student_shell.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  static const _departments = <String>[
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Data Science',
    'Artificial Intelligence',
    'Other',
  ];
  static const _semesters = <String>[
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
  ];

  StudentProfileModel? _profile;
  bool _loading = true;
  bool _saving = false;
  bool _isEditing = false;
  // Snapshot of profile at edit-start; restored on Cancel.
  StudentProfileModel? _editStartProfile;
  // Locally-picked files pending upload on Save.
  File? _pendingBannerFile;
  File? _pendingProfileFile;
  final Map<String, String> _cachedResumePaths = {};
  final Set<String> _activeResumeOps = <String>{};
  final Set<String> _downloadedResumeUrls = <String>{};
  String? _selectedDepartment;
  String? _selectedSemester;
  int _imageVersion = 0;

  late final TextEditingController _name;
  late final TextEditingController _department;
  late final TextEditingController _semester;
  late final TextEditingController _customDepartment;
  late final TextEditingController _bio;
  late final TextEditingController _cgpa;
  late final TextEditingController _hoursRequired;
  late final TextEditingController _phone;
  late final TextEditingController _location;
  late final TextEditingController _linkedIn;
  late final TextEditingController _github;
  late final TextEditingController _skills;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController();
    _department = TextEditingController();
    _semester = TextEditingController();
    _customDepartment = TextEditingController();
    _bio = TextEditingController();
    _cgpa = TextEditingController();
    _hoursRequired = TextEditingController();
    _phone = TextEditingController();
    _location = TextEditingController();
    _linkedIn = TextEditingController();
    _github = TextEditingController();
    _skills = TextEditingController();
    _load();
  }

  Future<void> _load() async {
    final session = ref.read(sessionControllerProvider).value;
    final profile = await ref.read(studentRepositoryProvider).getProfile();
    if (!mounted) return;
    debugPrint(
      'Profile images: banner=${profile.bannerImage ?? ''} profile=${profile.profilePicture ?? ''}',
    );
    setState(() {
      _profile = profile;
      _loading = false;
      // Use a timestamp so CachedNetworkImage's persistent disk cache is
      // bypassed on every fresh server load (prevents showing stale images
      // across sessions when the server URL stays the same).
      _imageVersion = DateTime.now().millisecondsSinceEpoch;
      _name.text = profile.name ?? session?.user.name ?? '';
      _department.text = profile.department ?? '';
      _semester.text = profile.semester?.toString() ?? '';
      final departmentValue = profile.department?.trim() ?? '';
      if (_departments.contains(departmentValue)) {
        _selectedDepartment = departmentValue;
        _customDepartment.clear();
      } else if (departmentValue.isNotEmpty) {
        _selectedDepartment = 'Other';
        _customDepartment.text = departmentValue;
      } else {
        _selectedDepartment = null;
        _customDepartment.clear();
      }
      final semesterValue = profile.semester?.toString() ?? '';
      _selectedSemester =
          _semesters.contains(semesterValue) ? semesterValue : null;
      _bio.text = profile.bio ?? '';
      _cgpa.text = profile.cgpa?.toString() ?? '';
      _hoursRequired.text = profile.hoursRequired?.toString() ?? '';
      _phone.text = profile.phone ?? '';
      _location.text = profile.location ?? '';
      _linkedIn.text = profile.linkedIn ?? '';
      _github.text = profile.github ?? '';
      _skills.text = profile.skills.join(', ');
    });
  }

  Future<void> _refresh() async {
    await _load();
  }

  Future<void> _uploadResume() async {
    final file = await FilePicker.platform.pickFiles();
    if (file == null || file.files.single.path == null || _profile == null) {
      return;
    }
    final url = await ref.read(studentRepositoryProvider).uploadFile(
          path: file.files.single.path!,
          type: 'resume',
        );
    setState(() {
      _profile = _profile!.copyWith(resumeUrl: url);
    });
  }

  Future<void> _uploadImage(ImageSource source, String type) async {
    if (_saving) return;
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source);
    if (picked == null || _profile == null) return;
    setState(() {
      if (type == 'bannerImage') {
        _pendingBannerFile = File(picked.path);
      } else {
        _pendingProfileFile = File(picked.path);
      }
    });
  }

  Future<void> _save() async {
    if (_profile == null) {
      return;
    }
    setState(() => _saving = true);
    try {
      final repository = ref.read(studentRepositoryProvider);

      // Upload any locally-staged images first.
      String? uploadedBannerUrl;
      String? uploadedProfileUrl;
      if (_pendingBannerFile != null) {
        uploadedBannerUrl = await repository.uploadFile(
          path: _pendingBannerFile!.path,
          type: 'bannerImage',
        );
      }
      if (_pendingProfileFile != null) {
        uploadedProfileUrl = await repository.uploadFile(
          path: _pendingProfileFile!.path,
          type: 'profilePicture',
        );
      }

      final departmentValue = _selectedDepartment == 'Other'
          ? _customDepartment.text.trim()
          : (_selectedDepartment ?? _department.text.trim());
      final semesterValue = _selectedSemester ?? _semester.text.trim();
      _department.text = departmentValue;
      _semester.text = semesterValue;
      final updated = _profile!.copyWith(
        name: _name.text.trim(),
        department: departmentValue,
        semester: int.tryParse(semesterValue),
        bio: _bio.text.trim(),
        cgpa: num.tryParse(_cgpa.text.trim()),
        hoursRequired: num.tryParse(_hoursRequired.text.trim()),
        phone: _phone.text.trim(),
        location: _location.text.trim().isNotEmpty ? _location.text.trim() : null,
        linkedIn: _normalizeUrl(_linkedIn.text),
        github: _normalizeUrl(_github.text),
        skills: _skills.text
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList(),
        bannerImage: uploadedBannerUrl ?? _profile!.bannerImage,
        profilePicture: uploadedProfileUrl ?? _profile!.profilePicture,
      );
      final saved = await repository.updateProfile(updated);
      if (!mounted) return;
      setState(() {
        _profile = saved;
        _pendingBannerFile = null;
        _pendingProfileFile = null;
        // Bust CachedNetworkImage cache if images were re-uploaded,
        // in case the server reuses the same URL.
        if (uploadedBannerUrl != null || uploadedProfileUrl != null) {
          _imageVersion++;
        }
      });
      await ref.read(sessionControllerProvider.notifier).refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated')),
        );
        setState(() {
          _isEditing = false;
          _editStartProfile = null;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save profile')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _safeFileName(String input) {
    return input.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
  }

  String _resumeFileName(String url) {
    final parsed = Uri.tryParse(url);
    final name = parsed?.pathSegments.isNotEmpty == true
        ? parsed!.pathSegments.last
        : '';
    return name.isNotEmpty ? name : 'resume';
  }

  Future<String?> _downloadResumeToTemp(String url) async {
    if (url.isEmpty) return null;
    if (_cachedResumePaths.containsKey(url)) {
      final existing = _cachedResumePaths[url]!;
      if (await File(existing).exists()) return existing;
    }

    final fileName = _safeFileName(_resumeFileName(url));
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

    _cachedResumePaths[url] = localPath;
    return localPath;
  }

  Future<void> _previewResume(String url) async {
    if (url.isEmpty || _activeResumeOps.contains(url)) return;
    setState(() => _activeResumeOps.add(url));
    try {
      final path = await _downloadResumeToTemp(url);
      if (path == null) return;
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
        setState(() => _activeResumeOps.remove(url));
      }
    }
  }

  Future<void> _saveResume(String url) async {
    if (url.isEmpty || _activeResumeOps.contains(url)) return;
    if (_downloadedResumeUrls.contains(url)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Already downloaded')),
      );
      return;
    }

    setState(() => _activeResumeOps.add(url));
    try {
      final sourcePath = await _downloadResumeToTemp(url);
      if (sourcePath == null) return;
      final saved = await FlutterFileDialog.saveFile(
        params: SaveFileDialogParams(
          sourceFilePath: sourcePath,
          fileName: _safeFileName(_resumeFileName(url)),
        ),
      );

      if (!mounted) return;
      if (saved != null) {
        _downloadedResumeUrls.add(url);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('File saved successfully')),
        );
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Save cancelled')),
      );
    } catch (e) {
      final sourcePath = _cachedResumePaths[url];
      if (sourcePath != null) {
        final fallbackPath = await _copyToDownloads(
          sourcePath,
          _safeFileName(_resumeFileName(url)),
        );
        if (fallbackPath != null) {
          _downloadedResumeUrls.add(url);
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
        setState(() => _activeResumeOps.remove(url));
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

  @override
  void dispose() {
    _name.dispose();
    _department.dispose();
    _semester.dispose();
    _customDepartment.dispose();
    _bio.dispose();
    _cgpa.dispose();
    _hoursRequired.dispose();
    _phone.dispose();
    _location.dispose();
    _linkedIn.dispose();
    _github.dispose();
    _skills.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider).value;
    final completion = _profile == null
        ? 0
        : _completionPercent(_profile!, session?.user);
    final name = _name.text.trim().isNotEmpty
        ? _name.text.trim()
        : (session?.user.name ?? 'Not set');
    final email = session?.user.email ?? 'Not set';
    final phone =
        _phone.text.trim().isNotEmpty ? _phone.text.trim() : 'Not set';
    final location =
        _location.text.trim().isNotEmpty ? _location.text.trim() : 'Not set';
    final department = _department.text.trim().isNotEmpty
        ? _department.text.trim()
        : 'Not set';
    final semester = _semester.text.trim().isNotEmpty
        ? 'Semester ${_semester.text.trim()}'
        : 'Not set';
    final cgpa = _cgpa.text.trim().isNotEmpty ? _cgpa.text.trim() : 'Not set';
    final monthsRequired = _hoursRequired.text.trim().isNotEmpty
        ? '${_hoursRequired.text.trim()} Months'
        : 'Not set';
    final about =
        _bio.text.trim().isNotEmpty ? _bio.text.trim() : 'Not set';
    final skills = _profile?.skills ?? const <String>[];
    final resumeUrl = _profile?.resumeUrl ?? '';
    final resumeName = resumeUrl.isNotEmpty
        ? Uri.tryParse(resumeUrl)?.pathSegments.last ?? 'resume'
        : 'No resume uploaded';
    final resumeDownloaded =
        resumeUrl.isNotEmpty && _downloadedResumeUrls.contains(resumeUrl);
    final compact = MediaQuery.sizeOf(context).width < 390;
    final hasCustomDepartment = _selectedDepartment == 'Other';
    final bannerImageUrl =
        _safeImageUrl(_profile?.bannerImage, version: _imageVersion);
    final profileImageUrl =
        _safeImageUrl(_profile?.profilePicture, version: _imageVersion);
    final linkedIn =
        _linkedIn.text.trim().isNotEmpty ? _linkedIn.text.trim() : '';
    final github = _github.text.trim().isNotEmpty ? _github.text.trim() : '';

    return StudentPageScaffold(
      title: 'Profile',
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                children: [
                Container(
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
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          // Fixes hit-testing: SizedBox drives Stack height to
                          // 170dp (128 banner + 42 avatar overflow) so the
                          // profile-picture edit badge stays within bounds.
                          const SizedBox(height: 170, width: double.infinity),
                          Positioned(
                            top: 0,
                            left: 0,
                            right: 0,
                            child: ClipRRect(
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(18),
                            ),
                            child: SizedBox(
                              height: 128,
                              width: double.infinity,
                              child: _pendingBannerFile != null
                                  ? Image.file(
                                      _pendingBannerFile!,
                                      fit: BoxFit.cover,
                                      width: double.infinity,
                                      height: 128,
                                    )
                                  : (bannerImageUrl?.isNotEmpty == true)
                                  ? CachedNetworkImage(
                                      imageUrl: bannerImageUrl!,
                                      memCacheWidth: 900,
                                      memCacheHeight: 360,
                                      imageBuilder: (context, imageProvider) =>
                                          Container(
                                        decoration: BoxDecoration(
                                          image: DecorationImage(
                                            image: imageProvider,
                                            fit: BoxFit.cover,
                                            alignment: Alignment.center,
                                          ),
                                        ),
                                      ),
                                      placeholder: (_, __) => Container(
                                        decoration: const BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [
                                              Color(0xFFF3F4F6),
                                              Color(0xFFE5E7EB),
                                            ],
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                          ),
                                        ),
                                      ),
                                      errorWidget: (_, __, ___) => Container(
                                        decoration: const BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [
                                              Color(0xFFF3F4F6),
                                              Color(0xFFE5E7EB),
                                            ],
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                          ),
                                        ),
                                      ),
                                    )
                                  : Container(
                                      decoration: const BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            Color(0xFFF3F4F6),
                                            Color(0xFFE5E7EB),
                                          ],
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                        ),
                                      ),
                                    ),
                            ),
                          ),
                          ),
                          if (_isEditing)
                            Positioned(
                              right: 12,
                              top: 12,
                              child: Row(
                                children: [
                                  _EditBadge(
                                    icon: Icons.edit_rounded,
                                    onTap: () => _uploadImage(
                                      ImageSource.gallery,
                                      'bannerImage',
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  _EditBadge(
                                    icon: Icons.delete_outline_rounded,
                                    background: const Color(0xFFDC2626),
                                    onTap: () {
                                      if (_profile == null) return;
                                      setState(() {
                                        _profile = _profile!.copyWith(
                                          bannerImage: '',
                                        );
                                        _pendingBannerFile = null;
                                        _imageVersion++;
                                      });
                                    },
                                  ),
                                ],
                              ),
                            ),
                          Positioned(
                            left: 18,
                            bottom: 0,
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                SizedBox(
                                  width: 92,
                                  height: 92,
                                  child: Align(
                                    alignment: Alignment.center,
                                    child: CircleAvatar(
                                      radius: 42,
                                      backgroundColor: Colors.white,
                                      child: CircleAvatar(
                                        radius: 38,
                                        backgroundImage: (_pendingProfileFile !=
                                                    null
                                                ? FileImage(
                                                    _pendingProfileFile!,
                                                  )
                                                : (profileImageUrl?.isNotEmpty ==
                                                        true)
                                                    ? CachedNetworkImageProvider(
                                                        profileImageUrl!,
                                                      )
                                                    : null)
                                            as ImageProvider?,
                                        child: (_pendingProfileFile != null ||
                                                (profileImageUrl?.isNotEmpty ??
                                                    false))
                                            ? null
                                            : Text(
                                                (session?.user.name
                                                            .isNotEmpty ==
                                                        true
                                                    ? session!.user.name[0]
                                                    : 'S')
                                                    .toUpperCase(),
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 20,
                                                ),
                                              ),
                                      ),
                                    ),
                                  ),
                                ),
                               if (_isEditing)
                                  Positioned(
                                    right: 0,
                                    bottom: 0,
                                    child: GestureDetector(
                                      behavior: HitTestBehavior.translucent,
                                      onTap: () => _uploadImage(
                                        ImageSource.gallery,
                                        'profilePicture',
                                      ),
                                      child: const SizedBox(
                                        width: 40,
                                        height: 40,
                                        child: Center(
                                          child: _EditBadge(
                                            icon: Icons.edit_rounded,
                                            size: 30,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerRight,
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    alignment: WrapAlignment.end,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (_isEditing)
                        ElevatedButton(
                          onPressed: _saving ? null : _save,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            _saving ? 'Saving...' : 'Save',
                          ),
                        ),
                      TextButton(
                        onPressed: () => setState(() {
                          if (_isEditing) {
                            // Cancel: restore images to their pre-edit state
                            if (_editStartProfile != null) {
                              _profile = _profile!.copyWith(
                                bannerImage:
                                    _editStartProfile!.bannerImage ?? '',
                                profilePicture:
                                    _editStartProfile!.profilePicture ?? '',
                              );
                              _imageVersion++;
                            }
                            _editStartProfile = null;
                            _pendingBannerFile = null;
                            _pendingProfileFile = null;
                          } else {
                            // Enter edit mode: snapshot images
                            _editStartProfile = _profile;
                          }
                          _isEditing = !_isEditing;
                        }),
                        child: Text(_isEditing ? 'Cancel' : 'Edit'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                _ProfileCompletionCard(completion: completion),
                const SizedBox(height: 12),
                _SectionCard(
                  icon: Icons.person_outline_rounded,
                  iconBg: const Color(0xFFEFF6FF),
                  iconColor: const Color(0xFF2563EB),
                  title: 'Personal Information',
                  children: _isEditing
                      ? [
                          _EditableField(
                            controller: _name,
                            label: 'Full name',
                            icon: Icons.person_outline_rounded,
                          ),
                          _EditableField(
                            controller: _phone,
                            label: 'Phone number',
                            icon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                          ),
                          _EditableField(
                            controller: _location,
                            label: 'Location',
                            icon: Icons.location_on_outlined,
                          ),
                          _InfoTile(
                            label: 'Email',
                            icon: Icons.mail_outline_rounded,
                            value: email,
                          ),
                        ]
                      : [
                          _InfoTile(
                            label: 'Full name',
                            icon: Icons.person_outline_rounded,
                            value: name,
                          ),
                          _InfoTile(
                            label: 'Email',
                            icon: Icons.mail_outline_rounded,
                            value: email,
                          ),
                          _InfoTile(
                            label: 'Phone number',
                            icon: Icons.phone_outlined,
                            value: phone,
                          ),
                          _InfoTile(
                            label: 'Location',
                            icon: Icons.location_on_outlined,
                            value: location,
                          ),
                        ],
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  icon: Icons.school_outlined,
                  iconBg: const Color(0xFFF5F3FF),
                  iconColor: const Color(0xFF7C3AED),
                  title: 'Academic Information',
                  children: _isEditing
                      ? [
                          DropdownMenu<String>(
                            initialSelection: _selectedDepartment,
                            onSelected: (value) {
                              setState(() {
                                _selectedDepartment = value;
                                if (value != 'Other') {
                                  _customDepartment.clear();
                                }
                              });
                            },
                            expandedInsets: EdgeInsets.zero,
                            menuHeight: compact ? 200 : 260,
                            hintText: 'Select Department',
                            label: const Text('Department'),
                            trailingIcon:
                                const Icon(Icons.keyboard_arrow_down_rounded),
                            selectedTrailingIcon:
                                const Icon(Icons.keyboard_arrow_up_rounded),
                            textStyle: AppDropdownStyles.textStyle,
                            menuStyle: AppDropdownStyles.menuStyle,
                            inputDecorationTheme:
                                AppDropdownStyles.inputDecorationTheme(
                              compact: compact,
                            ),
                            dropdownMenuEntries: AppDropdownStyles.buildEntries(
                              _departments,
                              selected: _selectedDepartment,
                            ),
                          ),
                          if (hasCustomDepartment) ...[
                            const SizedBox(height: 10),
                            TextField(
                              controller: _customDepartment,
                              decoration: const InputDecoration(
                                labelText: 'Please specify department',
                                hintText: 'Enter your department name',
                                prefixIcon: Icon(Icons.edit_note_rounded),
                              ),
                            ),
                          ],
                          const SizedBox(height: 10),
                          DropdownMenu<String>(
                            initialSelection: _selectedSemester,
                            onSelected: (value) {
                              setState(() => _selectedSemester = value);
                            },
                            expandedInsets: EdgeInsets.zero,
                            menuHeight: compact ? 200 : 260,
                            hintText: 'Select Semester',
                            label: const Text('Current Semester'),
                            trailingIcon:
                                const Icon(Icons.keyboard_arrow_down_rounded),
                            selectedTrailingIcon:
                                const Icon(Icons.keyboard_arrow_up_rounded),
                            textStyle: AppDropdownStyles.textStyle,
                            menuStyle: AppDropdownStyles.menuStyle,
                            inputDecorationTheme:
                                AppDropdownStyles.inputDecorationTheme(
                              compact: compact,
                            ),
                            dropdownMenuEntries: AppDropdownStyles.buildEntries(
                              _semesters,
                              selected: _selectedSemester,
                              labelBuilder: (semester) => 'Semester $semester',
                            ),
                          ),
                          const SizedBox(height: 10),
                          _EditableField(
                            controller: _cgpa,
                            label: 'CGPA',
                            icon: Icons.numbers_rounded,
                            keyboardType: TextInputType.number,
                          ),
                          _EditableField(
                            controller: _hoursRequired,
                            label: 'Months required',
                            icon: Icons.schedule_rounded,
                            keyboardType: TextInputType.number,
                          ),
                        ]
                      : [
                          _InfoTile(
                            label: 'Department',
                            icon: Icons.badge_outlined,
                            value: department,
                          ),
                          _InfoTile(
                            label: 'Semester',
                            icon: Icons.calendar_today_outlined,
                            value: semester,
                          ),
                          _InfoTile(
                            label: 'CGPA',
                            icon: Icons.numbers_rounded,
                            value: cgpa,
                          ),
                          _InfoTile(
                            label: 'Months required',
                            icon: Icons.schedule_rounded,
                            value: monthsRequired,
                          ),
                        ],
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  icon: Icons.description_outlined,
                  iconBg: const Color(0xFFF3E8FF),
                  iconColor: const Color(0xFF9333EA),
                  title: 'About Me',
                  children: [
                    _isEditing
                        ? TextField(
                            controller: _bio,
                            maxLines: 4,
                            decoration: const InputDecoration(
                              hintText: 'Tell us about yourself',
                            ),
                          )
                        : Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border:
                                  Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Text(
                              about,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: Color(0xFF475569),
                                fontWeight: FontWeight.w600,
                                height: 1.4,
                              ),
                            ),
                          ),
                  ],
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  icon: Icons.auto_awesome_outlined,
                  iconBg: const Color(0xFFEFF6FF),
                  iconColor: const Color(0xFF2563EB),
                  title: 'Skills',
                  children: [
                    if (_isEditing)
                      TextField(
                        controller: _skills,
                        decoration: const InputDecoration(
                          hintText: 'Skills (comma separated)',
                        ),
                      )
                    else if (skills.isEmpty)
                      const Text(
                        'No skills added',
                        style: TextStyle(
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      )
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: skills
                            .map((skill) => Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: const Color(0xFFBFDBFE),
                                    ),
                                  ),
                                  child: Text(
                                    skill,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF2563EB),
                                    ),
                                  ),
                                ))
                            .toList(),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  icon: Icons.description_rounded,
                  iconBg: const Color(0xFFEFF6FF),
                  iconColor: const Color(0xFF2563EB),
                  title: 'Resume',
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF3),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFBBF7D0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.insert_drive_file_outlined,
                                  color: Color(0xFF16A34A)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  resumeName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: resumeUrl.isEmpty
                                      ? null
                                      : () => _previewResume(resumeUrl),
                                  icon: const Icon(Icons.open_in_new_rounded),
                                  label: const Text('Preview'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed:
                                      resumeUrl.isEmpty || resumeDownloaded
                                          ? null
                                          : () => _saveResume(resumeUrl),
                                  icon: Icon(
                                    resumeDownloaded
                                        ? Icons.check_circle_outline_rounded
                                        : Icons.download_rounded,
                                  ),
                                  label: Text(
                                    resumeDownloaded
                                        ? 'Downloaded'
                                        : 'Download',
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (_isEditing) ...[
                            const SizedBox(height: 10),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: OutlinedButton.icon(
                                onPressed: _uploadResume,
                                icon: const Icon(Icons.upload_file_rounded),
                                label: const Text('Upload new resume'),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  icon: Icons.link_rounded,
                  iconBg: const Color(0xFFEFF6FF),
                  iconColor: const Color(0xFF2563EB),
                  title: 'Social Links',
                  children: _isEditing
                      ? [
                          _EditableField(
                            controller: _linkedIn,
                            label: 'LinkedIn',
                            icon: Icons.business_center_outlined,
                          ),
                          _EditableField(
                            controller: _github,
                            label: 'GitHub',
                            icon: Icons.code_rounded,
                          ),
                        ]
                      : [
                          _LinkTile(
                            label: 'LinkedIn',
                            icon: Icons.business_center_outlined,
                            value: linkedIn.isEmpty
                                ? 'Not set'
                                : 'LinkedIn Profile',
                            onTap: linkedIn.isEmpty
                                ? null
                                : () async {
                                    final uri = Uri.tryParse(
                                        _normalizeUrl(linkedIn));
                                    if (uri != null) {
                                      await launchUrl(uri,
                                          mode: LaunchMode.externalApplication);
                                    }
                                  },
                          ),
                          _LinkTile(
                            label: 'GitHub',
                            icon: Icons.code_rounded,
                            value:
                                github.isEmpty ? 'Not set' : 'GitHub Profile',
                            onTap: github.isEmpty
                                ? null
                                : () async {
                                    final uri =
                                        Uri.tryParse(_normalizeUrl(github));
                                    if (uri != null) {
                                      await launchUrl(uri,
                                          mode: LaunchMode.externalApplication);
                                    }
                                  },
                          ),
                        ],
                ),
                const SizedBox(height: 12),
                _DangerZoneCard(
                  onDelete: () async {
                    final confirm = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Delete account?'),
                            content: const Text(
                              'This action is permanent and will remove your account data.',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () =>
                                    Navigator.of(context).pop(false),
                                child: const Text('Cancel'),
                              ),
                              FilledButton(
                                onPressed: () =>
                                    Navigator.of(context).pop(true),
                                child: const Text('Delete'),
                              ),
                            ],
                          ),
                        ) ??
                        false;
                    if (!confirm) return;
                    await ref.read(studentRepositoryProvider).deleteAccount();
                    await ref.read(sessionControllerProvider.notifier).logout();
                  },
                ),
                ],
              ),
            ),
    );
  }

  int _completionPercent(StudentProfileModel profile, UserSummary? user) {
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

  String _normalizeUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return 'https://$trimmed';
  }

  String? _safeImageUrl(String? value, {int? version}) {
    final trimmed = value?.trim();
    if (trimmed == null || trimmed.isEmpty) return null;
    if (trimmed.startsWith('http://')) {
      return _appendVersion(
        trimmed.replaceFirst('http://', 'https://'),
        version,
      );
    }
    return _appendVersion(trimmed, version);
  }

  String _appendVersion(String url, int? version) {
    if (version == null) return url;
    final separator = url.contains('?') ? '&' : '?';
    return '$url${separator}v=$version';
  }
}

class _ProfileCompletionCard extends StatelessWidget {
  const _ProfileCompletionCard({required this.completion});

  final int completion;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Profile Completion',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
              ),
              const Spacer(),
              Text(
                '$completion%',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: Color(0xFF2563EB),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: completion / 100,
            minHeight: 8,
            borderRadius: BorderRadius.circular(10),
            backgroundColor: const Color(0xFFE0E7FF),
            color: const Color(0xFF2563EB),
          ),
          const SizedBox(height: 8),
          Text(
            completion >= 100
                ? 'Your profile is complete.'
                : 'Complete your profile to improve visibility.',
            style: const TextStyle(
              color: Color(0xFF475569),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.children,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
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
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.label,
    required this.icon,
    required this.value,
  });

  final String label;
  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              letterSpacing: 0.6,
              color: Color(0xFF94A3B8),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 16, color: const Color(0xFF64748B)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EditableField extends StatelessWidget {
  const _EditableField({
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
        ),
      ),
    );
  }
}

class _LinkTile extends StatelessWidget {
  const _LinkTile({
    required this.label,
    required this.icon,
    required this.value,
    this.onTap,
  });

  final String label;
  final IconData icon;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 16, color: const Color(0xFF64748B)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10.5,
                      letterSpacing: 0.6,
                      color: Color(0xFF94A3B8),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: onTap == null
                          ? const Color(0xFF94A3B8)
                          : const Color(0xFF2563EB),
                    ),
                  ),
                ],
              ),
            ),
            if (onTap != null)
              const Icon(Icons.open_in_new_rounded,
                  size: 16, color: Color(0xFF2563EB)),
          ],
        ),
      ),
    );
  }
}

class _DangerZoneCard extends StatelessWidget {
  const _DangerZoneCard({required this.onDelete});

  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_rounded, color: Color(0xFFDC2626)),
              SizedBox(width: 6),
              Text(
                'Danger Zone',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFDC2626),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Once you delete your account, there is no going back. All your data will be permanently removed.',
            style: TextStyle(color: Color(0xFFB91C1C), fontSize: 12.5),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: onDelete,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.delete_outline_rounded),
            label: const Text('Delete Account'),
          ),
        ],
      ),
    );
  }
}

class _EditBadge extends StatelessWidget {
  const _EditBadge({
    required this.icon,
    this.onTap,
    this.background = const Color(0xFF111827),
    this.size = 30,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final Color background;
  final double size;

  @override
  Widget build(BuildContext context) {
    final badge = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: background,
        shape: BoxShape.circle,
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Icon(icon, size: size * 0.55, color: Colors.white),
    );

    if (onTap == null) return badge;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: badge,
    );
  }
}
