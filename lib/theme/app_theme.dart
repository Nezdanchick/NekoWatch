// Тема MD3. Порт `constants/theme.ts`, переосмысленный в Material 3.
//
// Три режима (см. `AppThemeMode`):
//   • Светлая — статичная палитра из фирменного seed-цвета;
//   • Amoled  — тёмная палитра, поверхности выведены в чистый чёрный;
//   • Монет   — Material You: палитра берётся из обоев системы,
//               светлая/тёмная переключается системной настройкой.
import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';

/// Фирменный цвет NekoWatch — seed для статичных палитр.
const Color seedColor = Color(0xFF7B68EE);

ColorScheme lightScheme([ColorScheme? dynamicScheme]) {
  if (dynamicScheme != null) return dynamicScheme.harmonized();
  return ColorScheme.fromSeed(seedColor: seedColor, brightness: Brightness.light);
}

ColorScheme darkScheme([ColorScheme? dynamicScheme]) {
  if (dynamicScheme != null) return dynamicScheme.harmonized();
  return ColorScheme.fromSeed(seedColor: seedColor, brightness: Brightness.dark);
}

/// Тёмная палитра с поверхностями, выведенными в чистый чёрный —
/// на OLED-экранах такие пиксели не светятся.
ColorScheme amoledScheme([ColorScheme? dynamicScheme]) {
  return darkScheme(dynamicScheme).copyWith(
    surface: Colors.black,
    surfaceContainerLowest: Colors.black,
    surfaceContainerLow: const Color(0xFF0A0A0A),
    surfaceContainer: const Color(0xFF121212),
    surfaceContainerHigh: const Color(0xFF1A1A1A),
    surfaceContainerHighest: const Color(0xFF222222),
  );
}

ThemeData buildTheme(ColorScheme scheme, {bool amoled = false}) {
  final surface = amoled ? Colors.black : scheme.surface;

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: surface,

    // Плоский верх: заголовок слева, тень появляется только под скроллом.
    appBarTheme: AppBarTheme(
      backgroundColor: surface,
      surfaceTintColor: scheme.surfaceTint,
      scrolledUnderElevation: 3,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: scheme.onSurface,
        fontSize: 22,
        fontWeight: FontWeight.w500,
        letterSpacing: 0,
      ),
    ),

    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: amoled ? Colors.black : scheme.surfaceContainer,
      indicatorColor: scheme.secondaryContainer,
      elevation: 0,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
    ),

    // Контур обязателен: в динамической (Monet) палитре уровни поверхностей
    // почти неразличимы, и без него карточки сливаются с фоном.
    cardTheme: CardThemeData(
      color: amoled ? const Color(0xFF121212) : scheme.surfaceContainerLow,
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),

    listTileTheme: ListTileThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    ),

    dialogTheme: DialogThemeData(
      backgroundColor: scheme.surfaceContainerHigh,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
    ),

    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: scheme.surfaceContainerLow,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
    ),

    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      side: BorderSide(color: scheme.outlineVariant),
    ),

    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        side: WidgetStatePropertyAll(BorderSide(color: scheme.outlineVariant)),
      ),
    ),

    floatingActionButtonTheme: FloatingActionButtonThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),

    dividerTheme: DividerThemeData(color: scheme.outlineVariant, space: 1),

    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}
