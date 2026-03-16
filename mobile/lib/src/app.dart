import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/app_theme.dart';
import 'core/deep_link_handler.dart';
import 'core/providers.dart';
import 'features/applications/applications_screen.dart';
import 'features/auth/auth_screens.dart';
import 'features/companies/companies_screens.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/internships/internships_screens.dart';
import 'features/messages/messages_screens.dart';
import 'features/profile/profile_screen.dart';
import 'features/shell/student_shell.dart';
import 'features/support_screens.dart';

class AcadInternStudentApp extends ConsumerWidget {
  const AcadInternStudentApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);

    final router = GoRouter(
      initialLocation: '/dashboard',
      refreshListenable: ref.watch(routerRefreshProvider),
      redirect: (context, state) {
        final isLoggedIn = session.valueOrNull != null;
        final isAuthRoute = state.fullPath == '/login' ||
            state.fullPath == '/signup' ||
            state.fullPath == '/forgot-password';

        if (!isLoggedIn &&
            !isAuthRoute &&
            !state.uri.path.startsWith('/reset-password') &&
            !state.uri.path.startsWith('/verify-email')) {
          return '/login';
        }

        if (isLoggedIn && isAuthRoute) {
          return '/dashboard';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => const SignupScreen(),
        ),
        GoRoute(
          path: '/forgot-password',
          builder: (context, state) => const ForgotPasswordScreen(),
        ),
        GoRoute(
          path: '/reset-password',
          builder: (context, state) => ResetPasswordScreen(
              token: state.uri.queryParameters['token'] ?? ''),
        ),
        GoRoute(
          path: '/verify-email',
          builder: (context, state) => VerifyEmailScreen(
              token: state.uri.queryParameters['token'] ?? ''),
        ),
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) => StudentAppShell(
            navigationShell: navigationShell,
          ),
          branches: [
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/dashboard',
                  builder: (context, state) => const DashboardScreen(),
                ),
                GoRoute(
                  path: '/analytics',
                  builder: (context, state) => const AnalyticsScreen(),
                ),
                GoRoute(
                  path: '/companies',
                  builder: (context, state) => const CompaniesScreen(),
                  routes: [
                    GoRoute(
                      path: ':id',
                      builder: (context, state) => CompanyDetailScreen(
                        companyId: state.pathParameters['id']!,
                      ),
                    ),
                  ],
                ),
                GoRoute(
                  path: '/notifications',
                  builder: (context, state) => const NotificationsScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/internships',
                  builder: (context, state) => const InternshipsScreen(),
                  routes: [
                    GoRoute(
                      path: ':id',
                      builder: (context, state) => InternshipDetailScreen(
                        internshipId: state.pathParameters['id']!,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/applications',
                  builder: (context, state) => ApplicationsScreen(
                    highlightedApplicationId:
                        state.uri.queryParameters['highlight'],
                  ),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/messages',
                  builder: (context, state) => MessagesScreen(
                    highlightedApplicationId:
                        state.uri.queryParameters['applicationId'],
                  ),
                  routes: [
                    GoRoute(
                      path: ':id',
                      builder: (context, state) => ChatScreen(
                        applicationId: state.pathParameters['id']!,
                        otherPartyName:
                            state.uri.queryParameters['name'] ?? 'Conversation',
                      ),
                    ),
                  ],
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/profile',
                  builder: (context, state) => const ProfileScreen(),
                ),
              ],
            ),
          ],
        ),
      ],
    );

    ref.listen<AsyncValue<String>>(pushNavigationProvider, (_, next) {
      next.whenData((route) {
        if (route.isNotEmpty) {
          router.go(route);
        }
      });
    });

    return MaterialApp.router(
      title: 'AcadIntern Student',
      debugShowCheckedModeBanner: false,
      theme: buildAcadInternTheme(),
      routerConfig: router,
      builder: (context, child) => DeepLinkHandler(
        router: router,
        child: child ?? const SizedBox.shrink(),
      ),
    );
  }
}
