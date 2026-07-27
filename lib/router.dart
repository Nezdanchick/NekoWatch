// go_router — аналог expo-router. Поддерживает path-параметры (/anime/:id)
// и передачу extra-данных (плеер, список аниме).
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/anime_details_screen.dart';
import 'screens/anime_list_screen.dart';
import 'screens/bookmarks_screen.dart';
import 'screens/history_screen.dart';
import 'screens/home_screen.dart';
import 'screens/player_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/search_screen.dart';
import 'screens/shell_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        return ShellScreen(currentLocation: state.uri.toString(), child: child);
      },
      routes: [
        GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
        GoRoute(path: '/search', builder: (context, state) => const SearchScreen()),
        GoRoute(path: '/bookmarks', builder: (context, state) => const BookmarksScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
      ],
    ),
    GoRoute(
      path: '/anime/:id',
      pageBuilder: (context, state) {
        final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
        return CustomTransitionPage(
          key: state.pageKey,
          child: AnimeDetailsScreen(animeId: id),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1, 0),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
              child: child,
            );
          },
        );
      },
    ),
    GoRoute(
      path: '/player',
      pageBuilder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? const {};
        return CustomTransitionPage(
          key: state.pageKey,
          fullscreenDialog: true,
          child: PlayerScreen(
            url: extra['url'] as String?,
            animeId: extra['animeId'] as int?,
          ),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        );
      },
    ),
    GoRoute(path: '/history', builder: (context, state) => const HistoryScreen()),
    GoRoute(
      path: '/anime-list',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? const {};
        return AnimeListScreen(
          title: extra['title'] as String? ?? '',
          type: extra['type'] as String? ?? 'popular',
        );
      },
    ),
  ],
);
