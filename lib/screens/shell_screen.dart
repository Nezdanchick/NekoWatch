// Порт `app/(tabs)/_layout.tsx` через MD3 `NavigationBar`.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

const List<String> _tabPaths = ['/', '/search', '/bookmarks', '/profile'];

class ShellScreen extends StatelessWidget {
  const ShellScreen({super.key, required this.child, required this.currentLocation});

  final Widget child;
  final String currentLocation;

  int get _currentIndex {
    final index = _tabPaths.indexWhere((path) => currentLocation == path);
    return index == -1 ? 0 : index;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => context.go(_tabPaths[index]),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Главная'),
          NavigationDestination(icon: Icon(Icons.search), label: 'Поиск'),
          NavigationDestination(
            icon: Icon(Icons.bookmark_border),
            selectedIcon: Icon(Icons.bookmark),
            label: 'Закладки',
          ),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Профиль'),
        ],
      ),
    );
  }
}
