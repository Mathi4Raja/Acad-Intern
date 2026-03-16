import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/app_config.dart';
import '../../core/dropdown_styles.dart';
import '../../core/providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _rememberMe = false;
  bool _obscurePassword = true;

  String _errorText(Object? error) {
    if (error is DioException) {
      if (error.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server. Active API: ${AppConfig.normalizedApiBaseUrl}';
      }
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.isNotEmpty) {
          return message;
        }
      }
      return error.message ?? 'Login failed';
    }
    if (error is Exception) {
      return error.toString().replaceFirst('Exception: ', '');
    }
    return 'Login failed';
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider);
    final isLoading = session.isLoading;
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 380;
    final stackedRememberRow = width < 360;
    final brandSize = compact ? 30.0 : 34.0;
    final titleSize = compact ? 17.0 : 20.0;
    final subtitleSize = compact ? 12.0 : 14.0;
    final labelSize = compact ? 12.5 : 13.5;
    final buttonTextSize = compact ? 16.0 : 17.0;

    return Scaffold(
      body: SafeArea(
        child: GestureDetector(
          behavior: HitTestBehavior.translucent,
          onTap: () => FocusScope.of(context).unfocus(),
          child: Container(
            color: const Color(0xFFF4F6FB),
            child: Align(
              alignment: Alignment.topCenter,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: SingleChildScrollView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: EdgeInsets.fromLTRB(
                    compact ? 12 : 16,
                    compact ? 50 : 56,
                    compact ? 12 : 16,
                    compact ? 12 : 16,
                  ),
                  child: Column(
                    children: [
                      SizedBox(height: compact ? 0 : 2),
                      Transform.translate(
                        offset: const Offset(0, -6),
                        child: Text(
                          'AcadIntern',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: const Color(0xFF145DE0),
                            fontSize: brandSize,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 58),
                      Text(
                        'Welcome back',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: const Color(0xFF111827),
                          fontSize: titleSize,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Login to your account',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: const Color(0xFF6B7280),
                          fontSize: subtitleSize,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.all(compact ? 10 : 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x12000000),
                              blurRadius: 14,
                              offset: Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Email Address',
                              style: TextStyle(
                                fontSize: labelSize,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF374151),
                              ),
                            ),
                            const SizedBox(height: 4),
                            TextField(
                              controller: _email,
                              keyboardType: TextInputType.emailAddress,
                              autofillHints: const [AutofillHints.email],
                              textInputAction: TextInputAction.next,
                              decoration: InputDecoration(
                                isDense: true,
                                hintText: 'you@example.com',
                                hintStyle: const TextStyle(
                                  color: Color(0xFF6B7280),
                                ),
                                prefixIcon: const Icon(
                                  Icons.mail_outline_rounded,
                                  color: Color(0xFF9CA3AF),
                                ),
                                prefixIconConstraints: const BoxConstraints(
                                  minWidth: 40,
                                  minHeight: 38,
                                ),
                                filled: true,
                                fillColor: const Color(0xFFF0F4FC),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(
                                    color: Color(0xFFD1D5DB),
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(
                                    color: Color(0xFFD1D5DB),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Password',
                              style: TextStyle(
                                fontSize: labelSize,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF374151),
                              ),
                            ),
                            const SizedBox(height: 4),
                            TextField(
                              controller: _password,
                              obscureText: _obscurePassword,
                              autofillHints: const [AutofillHints.password],
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) async {
                                if (!isLoading) {
                                  await ref
                                      .read(sessionControllerProvider.notifier)
                                      .login(_email.text.trim(), _password.text);
                                }
                              },
                              decoration: InputDecoration(
                                isDense: true,
                                prefixIcon: const Icon(
                                  Icons.lock_outline_rounded,
                                  color: Color(0xFF9CA3AF),
                                ),
                                prefixIconConstraints: const BoxConstraints(
                                  minWidth: 40,
                                  minHeight: 38,
                                ),
                                suffixIcon: IconButton(
                                  constraints: const BoxConstraints(
                                    minWidth: 40,
                                    minHeight: 38,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    color: const Color(0xFF9CA3AF),
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(
                                    color: Color(0xFFD1D5DB),
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(
                                    color: Color(0xFFD1D5DB),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (stackedRememberRow)
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: Checkbox(
                                          value: _rememberMe,
                                          onChanged: (value) {
                                            setState(() {
                                              _rememberMe = value ?? false;
                                            });
                                          },
                                          side: const BorderSide(
                                            color: Color(0xFF9CA3AF),
                                          ),
                                        ),
                                      ),
                                       const SizedBox(width: 6),
                                      const Text(
                                        'Remember me',
                                        style: TextStyle(
                                          color: Color(0xFF4B5563),
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      onPressed: () =>
                                          context.push('/forgot-password'),
                                      style: TextButton.styleFrom(
                                        visualDensity: VisualDensity.compact,
                                      ),
                                      child: const Text('Forgot password?'),
                                    ),
                                  ),
                                ],
                              )
                            else
                              Row(
                                children: [
                                  SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: Checkbox(
                                      value: _rememberMe,
                                      onChanged: (value) {
                                        setState(() {
                                          _rememberMe = value ?? false;
                                        });
                                      },
                                      side: const BorderSide(
                                        color: Color(0xFF9CA3AF),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Text(
                                    'Remember me',
                                    style: TextStyle(
                                      color: Color(0xFF4B5563),
                                      fontSize: 13,
                                    ),
                                  ),
                                  const Spacer(),
                                  TextButton(
                                    onPressed: () =>
                                        context.push('/forgot-password'),
                                    style: TextButton.styleFrom(
                                      visualDensity: VisualDensity.compact,
                                    ),
                                    child: const Text('Forgot password?'),
                                  ),
                                ],
                              ),
                            const SizedBox(height: 4),
                            if (session.hasError)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Text(
                                  _errorText(session.error),
                                  style: const TextStyle(color: Colors.red),
                                ),
                              ),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: isLoading
                                    ? null
                                    : () async {
                                        await ref
                                            .read(sessionControllerProvider.notifier)
                                            .login(
                                              _email.text.trim(),
                                              _password.text,
                                            );
                                      },
                                style: FilledButton.styleFrom(
                                  backgroundColor: const Color(0xFF145DE0),
                                  minimumSize: const Size.fromHeight(44),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      isLoading ? 'Signing in...' : 'Login',
                                      style: TextStyle(
                                        fontSize: buttonTextSize,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    if (!isLoading) const SizedBox(width: 8),
                                    if (!isLoading)
                                      const Icon(
                                        Icons.arrow_forward_rounded,
                                        size: 18,
                                      ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Row(
                              children: [
                                Expanded(
                                  child: Divider(color: Color(0xFFE5E7EB)),
                                ),
                                Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 10),
                                  child: Text(
                                    'or continue with',
                                    style: TextStyle(
                                      color: Color(0xFF9CA3AF),
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Divider(color: Color(0xFFE5E7EB)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: isLoading
                                    ? null
                                    : () async {
                                        await ref
                                            .read(sessionControllerProvider.notifier)
                                            .googleLogin();
                                      },
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size.fromHeight(42),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  side: const BorderSide(
                                    color: Color(0xFFE5E7EB),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SvgPicture.asset(
                                      'assets/icons/google_logo.svg',
                                      width: 18,
                                      height: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Continue with Google',
                                      style: TextStyle(
                                        color: Color(0xFF374151),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Divider(
                              height: 1,
                              color: Color(0xFFE9EDF3),
                            ),
                            const SizedBox(height: 8),
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Center(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Text(
                                      'Don\'t have an account? ',
                                      style: TextStyle(color: Color(0xFF6B7280)),
                                    ),
                                    InkWell(
                                      onTap: () => context.push('/signup'),
                                      child: const Text(
                                        'Create one',
                                        style: TextStyle(
                                          color: Color(0xFF145DE0),
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
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
      ),
    );
  }
}

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _customDepartment = TextEditingController();
  String? _selectedDepartment;
  String? _selectedSemester;
  bool _agreeTerms = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  static const _termsSections = <Map<String, String>>[
    {
      'title': '1. Acceptance of Terms',
      'content':
          'By accessing or using AcadIntern, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.',
    },
    {
      'title': '2. User Accounts',
      'content':
          'To access certain features of the platform, you must register for an account. You represent and warrant that all information you provide is accurate, current, and complete. You are responsible for maintaining the confidentiality of your account and password.',
    },
    {
      'title': '3. Platform Usage',
      'content':
          'AcadIntern provides a platform to connect students with companies for internship opportunities. Students may apply for internships, and companies may post and manage internship listings. We do not guarantee employment or the accuracy of listings.',
    },
    {
      'title': '4. Prohibited Activities',
      'content':
          'Users are prohibited from: (a) posting false or misleading information; (b) harassing other users; (c) attempting to circumvent security measures; (d) using the platform for unauthorized commercial purposes; or (e) violating any intellectual property rights.',
    },
    {
      'title': '5. Intellectual Property',
      'content':
          'The platform and its original content, features, and functionality are and will remain the exclusive property of AcadIntern and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent.',
    },
  ];

  static const _privacySections = <Map<String, String>>[
    {
      'title': '1. Information We Collect',
      'content':
          'We collect information you provide directly to us when you create an account, including your name, email address, profile picture, education history (for students), and company details (for employers).',
    },
    {
      'title': '2. How We Use Your Information',
      'content':
          'We use the information we collect to provide and improve our services, facilitate the internship application process, communicate with you, and personalize your experience on the platform.',
    },
    {
      'title': '3. Information Sharing',
      'content':
          'When students apply for an internship, we share their name, email, and profile details with the respective company. We do not sell your personal information to third parties.',
    },
    {
      'title': '4. Data Security',
      'content':
          'We implement robust security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. This includes encryption and secure server infrastructure.',
    },
    {
      'title': '5. Cookies & Tracking',
      'content':
          'We use cookies and similar tracking technologies to analyze platform usage and store your preferences. You can manage your cookie settings through your browser.',
    },
  ];

  String _errorText(Object? error) {
    if (error is DioException) {
      if (error.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server. Active API: ${AppConfig.normalizedApiBaseUrl}';
      }
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.isNotEmpty) {
          return message;
        }
      }
      return error.message ?? 'Signup failed';
    }
    if (error is Exception) {
      return error.toString().replaceFirst('Exception: ', '');
    }
    return 'Signup failed';
  }

  void _showLegalPopup({required bool isTerms}) {
    final sections = isTerms ? _termsSections : _privacySections;
    final title = isTerms ? 'Terms of Service' : 'Privacy Policy';
    final subtitle = isTerms ? 'Legal Framework' : 'Data Protection';
    final accent = isTerms ? const Color(0xFF145DE0) : const Color(0xFF059669);
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return Dialog(
          backgroundColor: Colors.white,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: 460,
              maxHeight: MediaQuery.sizeOf(dialogContext).height * 0.78,
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: accent.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          isTerms
                              ? Icons.gavel_rounded
                              : Icons.verified_user_rounded,
                          color: accent,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              subtitle,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.0,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                            const SizedBox(height: 1),
                            Text(
                              title,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(dialogContext).pop(),
                        icon: const Icon(Icons.close_rounded),
                        tooltip: 'Close',
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: ListView.separated(
                      itemCount: sections.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final section = sections[index];
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                section['title'] ?? '',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                section['content'] ?? '',
                                style: const TextStyle(
                                  height: 1.45,
                                  fontSize: 12.5,
                                  color: Color(0xFF4B5563),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.of(dialogContext).pop(),
                      style: FilledButton.styleFrom(
                        backgroundColor: accent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Acknowledge & Close'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider);
    final isLoading = session.isLoading;

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final hasCustomDepartment = _selectedDepartment == 'Other';
            final designHeight = hasCustomDepartment ? 900.0 : 835.0;
            double scale = constraints.maxHeight / designHeight;
            if (scale > 1.08) scale = 1.08;
            if (scale < 0.66) scale = 0.66;

            final compact =
                constraints.maxHeight < 760 || constraints.maxWidth < 380;
            final tightCompact = compact || hasCustomDepartment;
            final pagePaddingH = tightCompact ? 12.0 : 16.0;
            final pagePaddingV = tightCompact ? 4.0 : 10.0;
            final gap = tightCompact ? 6.0 : 12.0;
            final cardPadding = tightCompact ? 10.0 : 14.0;
            const departments = <String>[
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
            const semesters = <String>[
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
            ];
            final departmentEntries = AppDropdownStyles.buildEntries(
              departments,
              selected: _selectedDepartment,
            );
            final semesterEntries = AppDropdownStyles.buildEntries(
              semesters,
              selected: _selectedSemester,
              labelBuilder: (semester) => 'Semester $semester',
            );

            return Center(
              child: Transform.scale(
                scale: scale,
                alignment: Alignment.center,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 430),
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      pagePaddingH,
                      pagePaddingV,
                      pagePaddingH,
                      pagePaddingV,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(height: tightCompact ? 2 : 6),
                        const Text(
                          'AcadIntern',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF145DE0),
                          ),
                        ),
                        SizedBox(height: tightCompact ? 4 : 6),
                        const Text(
                          'Create your account',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),
                        SizedBox(height: tightCompact ? 2 : 4),
                        const Text(
                          'Join AcadIntern and start your journey',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        SizedBox(height: gap),
                        Card(
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Padding(
                            padding: EdgeInsets.all(cardPadding),
                            child: Column(
                              children: [
                                TextField(
                                  controller: _name,
                                  decoration: const InputDecoration(
                                    labelText: 'Full Name',
                                    hintText: 'John Doe',
                                    prefixIcon: Icon(Icons.person_outline_rounded),
                                  ),
                                ),
                                SizedBox(height: gap),
                                TextField(
                                  controller: _email,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: const InputDecoration(
                                    labelText: 'Email Address',
                                    hintText: 'you@example.com',
                                    prefixIcon: Icon(Icons.mail_outline_rounded),
                                  ),
                                ),
                                SizedBox(height: gap),
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
                                  menuHeight: tightCompact ? 200 : 260,
                                  hintText: 'Select Department',
                                  label: const Text('Department'),
                                  trailingIcon: const Icon(
                                    Icons.keyboard_arrow_down_rounded,
                                  ),
                                  selectedTrailingIcon: const Icon(
                                    Icons.keyboard_arrow_up_rounded,
                                  ),
                                  textStyle: AppDropdownStyles.textStyle,
                                  menuStyle: AppDropdownStyles.menuStyle,
                                  inputDecorationTheme:
                                      AppDropdownStyles.inputDecorationTheme(
                                    compact: tightCompact,
                                  ),
                                  dropdownMenuEntries: departmentEntries,
                                ),
                                SizedBox(height: gap),
                                if (hasCustomDepartment) ...[
                                  TextField(
                                    controller: _customDepartment,
                                    decoration: const InputDecoration(
                                      labelText: 'Please specify department',
                                      hintText: 'Enter your department name',
                                      prefixIcon:
                                          Icon(Icons.edit_note_rounded),
                                    ),
                                  ),
                                  SizedBox(height: gap),
                                ],
                                DropdownMenu<String>(
                                  initialSelection: _selectedSemester,
                                  onSelected: (value) {
                                    setState(() {
                                      _selectedSemester = value;
                                    });
                                  },
                                  expandedInsets: EdgeInsets.zero,
                                  menuHeight: tightCompact ? 200 : 260,
                                  hintText: 'Select Semester',
                                  label: const Text('Current Semester'),
                                  trailingIcon: const Icon(
                                    Icons.keyboard_arrow_down_rounded,
                                  ),
                                  selectedTrailingIcon: const Icon(
                                    Icons.keyboard_arrow_up_rounded,
                                  ),
                                  textStyle: AppDropdownStyles.textStyle,
                                  menuStyle: AppDropdownStyles.menuStyle,
                                  inputDecorationTheme:
                                      AppDropdownStyles.inputDecorationTheme(
                                    compact: tightCompact,
                                  ),
                                  dropdownMenuEntries: semesterEntries,
                                ),
                                SizedBox(height: gap),
                                TextField(
                                  controller: _password,
                                  obscureText: _obscurePassword,
                                  decoration: InputDecoration(
                                    labelText: 'Password',
                                    hintText: 'Min. 8 characters',
                                    prefixIcon:
                                        const Icon(Icons.lock_outline_rounded),
                                    suffixIcon: IconButton(
                                      onPressed: () {
                                        setState(() {
                                          _obscurePassword = !_obscurePassword;
                                        });
                                      },
                                      icon: Icon(
                                        _obscurePassword
                                            ? Icons.visibility_outlined
                                            : Icons.visibility_off_outlined,
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(height: gap),
                                TextField(
                                  controller: _confirmPassword,
                                  obscureText: _obscureConfirmPassword,
                                  decoration: InputDecoration(
                                    labelText: 'Confirm Password',
                                    hintText: 'Re-enter password',
                                    prefixIcon:
                                        const Icon(Icons.lock_outline_rounded),
                                    suffixIcon: IconButton(
                                      onPressed: () {
                                        setState(() {
                                          _obscureConfirmPassword =
                                              !_obscureConfirmPassword;
                                        });
                                      },
                                      icon: Icon(
                                        _obscureConfirmPassword
                                            ? Icons.visibility_outlined
                                            : Icons.visibility_off_outlined,
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(height: gap),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(12),
                                    border:
                                        Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Row(
                                    children: [
                                      Checkbox(
                                        value: _agreeTerms,
                                        onChanged: (value) {
                                          setState(() {
                                            _agreeTerms = value ?? false;
                                          });
                                        },
                                        visualDensity: VisualDensity.compact,
                                      ),
                                      Expanded(
                                        child: Wrap(
                                          crossAxisAlignment:
                                              WrapCrossAlignment.center,
                                          children: [
                                            const Text(
                                              'I Agree to the ',
                                              style: TextStyle(
                                                color: Color(0xFF475569),
                                              ),
                                            ),
                                            InkWell(
                                              onTap: () => _showLegalPopup(
                                                isTerms: true,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                              child: const Text(
                                                'Terms',
                                                style: TextStyle(
                                                  color: Color(0xFF145DE0),
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                            const Text(
                                              ' and ',
                                              style: TextStyle(
                                                color: Color(0xFF475569),
                                              ),
                                            ),
                                            InkWell(
                                              onTap: () => _showLegalPopup(
                                                isTerms: false,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                              child: const Text(
                                                'Policies',
                                                style: TextStyle(
                                                  color: Color(0xFF145DE0),
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(height: tightCompact ? 8 : 12),
                                if (session.hasError)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Text(
                                      _errorText(session.error),
                                      style: const TextStyle(color: Colors.red),
                                    ),
                                  ),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: isLoading
                                        ? null
                                        : () async {
                                            if (_password.text !=
                                                _confirmPassword.text) {
                                              if (context.mounted) {
                                                ScaffoldMessenger.of(context)
                                                    .showSnackBar(
                                                  const SnackBar(
                                                    content: Text(
                                                      'Passwords do not match',
                                                    ),
                                                  ),
                                                );
                                              }
                                              return;
                                            }
                                            if (!_agreeTerms) {
                                              if (context.mounted) {
                                                ScaffoldMessenger.of(context)
                                                    .showSnackBar(
                                                  const SnackBar(
                                                    content: Text(
                                                      'Please agree to Terms and Policies',
                                                    ),
                                                  ),
                                                );
                                              }
                                              return;
                                            }
                                            if (_selectedDepartment == 'Other' &&
                                                _customDepartment.text
                                                    .trim()
                                                    .isEmpty) {
                                              if (context.mounted) {
                                                ScaffoldMessenger.of(context)
                                                    .showSnackBar(
                                                  const SnackBar(
                                                    content: Text(
                                                      'Please specify your department',
                                                    ),
                                                  ),
                                                );
                                              }
                                              return;
                                            }
                                            await ref
                                                .read(sessionControllerProvider.notifier)
                                                .signup(
                                                  name: _name.text.trim(),
                                                  email: _email.text.trim(),
                                                  password: _password.text,
                                                  department: _selectedDepartment ==
                                                          'Other'
                                                      ? _customDepartment.text
                                                          .trim()
                                                      : (_selectedDepartment ??
                                                          ''),
                                                  semester: int.tryParse(
                                                    _selectedSemester ?? '',
                                                  ),
                                                );
                                          },
                                    child: Text(
                                      isLoading
                                          ? 'Creating account...'
                                          : 'Create Account',
                                    ),
                                  ),
                                ),
                                SizedBox(height: tightCompact ? 4 : 6),
                                const Divider(height: 1),
                                SizedBox(height: tightCompact ? 6 : 10),
                                Center(
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Text(
                                        'Already have an account? ',
                                        style:
                                            TextStyle(color: Color(0xFF6B7280)),
                                      ),
                                      InkWell(
                                        onTap: () {
                                          if (context.canPop()) {
                                            context.pop();
                                          } else {
                                            context.go('/login');
                                          }
                                        },
                                        child: const Text(
                                          'Login',
                                          style: TextStyle(
                                            color: Color(0xFF145DE0),
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _email = TextEditingController();
  String? _message;

  @override
  Widget build(BuildContext context) {
    final repository = ref.watch(studentRepositoryProvider);

    return Scaffold(
      appBar: AppBar(),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Reset password',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _email,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () async {
              await repository.forgotPassword(_email.text.trim());
              setState(() {
                _message = 'If the account exists, a reset link has been sent.';
              });
            },
            child: const Text('Send reset link'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 16),
            Text(_message!),
          ],
        ],
      ),
    );
  }
}

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key, required this.token});

  final String token;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _password = TextEditingController();
  String? _message;

  @override
  Widget build(BuildContext context) {
    final repository = ref.watch(studentRepositoryProvider);
    return Scaffold(
      appBar: AppBar(),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Set a new password',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'New password'),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () async {
              await repository.resetPassword(
                token: widget.token,
                password: _password.text,
              );
              setState(() {
                _message = 'Password updated. You can now log in.';
              });
            },
            child: const Text('Update password'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 16),
            Text(_message!),
          ],
        ],
      ),
    );
  }
}

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key, required this.token});

  final String token;

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  Future<String>? _future;

  @override
  void initState() {
    super.initState();
    _future = _verify();
  }

  Future<String> _verify() async {
    if (widget.token.isEmpty) {
      return 'Missing verification token';
    }
    await ref.read(studentRepositoryProvider).verifyEmail(widget.token);
    return 'Email verified. You can continue using the app.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: FutureBuilder<String>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(snapshot.error.toString()),
              ),
            );
          }
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(snapshot.data ?? ''),
            ),
          );
        },
      ),
    );
  }
}
