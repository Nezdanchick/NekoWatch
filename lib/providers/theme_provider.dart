// Порт `store/theme-store.ts`, переосмысленный в MD3.
// Три режима: Светлая, Amoled и Монет (Material You — палитра из обоев,
// светлая/тёмная по системной настройке).
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/local_storage.dart';

enum AppThemeMode { light, amoled, monet }

extension AppThemeModeLabel on AppThemeMode {
  String get storageKey => name;

  String get label {
    switch (this) {
      case AppThemeMode.light:
        return 'Светлая';
      case AppThemeMode.amoled:
        return 'Тёмная';
      case AppThemeMode.monet:
        return 'Монет';
    }
  }

  static AppThemeMode fromStorageKey(String? key) {
    switch (key) {
      case 'light':
        return AppThemeMode.light;
      case 'monet':
        return AppThemeMode.monet;
      // 'dark' — режим из старых версий, ближайший аналог — amoled.
      case 'dark':
      case 'amoled':
      default:
        return AppThemeMode.amoled;
    }
  }
}

class ThemeNotifier extends StateNotifier<AppThemeMode> {
  ThemeNotifier() : super(AppThemeMode.amoled) {
    _restore();
  }

  static const _modeKey = 'themeMode';

  void _restore() {
    final box = LocalStorage.themeStorageBox;
    state = AppThemeModeLabel.fromStorageKey(box.get(_modeKey) as String?);
  }

  Future<void> setMode(AppThemeMode mode) async {
    state = mode;
    await LocalStorage.themeStorageBox.put(_modeKey, mode.storageKey);
  }
}

final themeProvider = StateNotifierProvider<ThemeNotifier, AppThemeMode>((ref) {
  return ThemeNotifier();
});
