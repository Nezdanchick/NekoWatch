// Порт `components/ThemeSelector.tsx` через MD3 `SegmentedButton`.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/theme_provider.dart';

const Map<AppThemeMode, IconData> _icons = {
  AppThemeMode.light: Icons.light_mode_outlined,
  AppThemeMode.amoled: Icons.dark_mode_outlined,
  AppThemeMode.monet: Icons.palette_outlined,
};

class ThemeSelector extends ConsumerWidget {
  const ThemeSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeProvider);

    return SegmentedButton<AppThemeMode>(
      showSelectedIcon: false,
      segments: [
        for (final value in AppThemeMode.values)
          ButtonSegment(
            value: value,
            icon: Icon(_icons[value]),
            label: Text(value.label),
          ),
      ],
      selected: {mode},
      onSelectionChanged: (selection) {
        ref.read(themeProvider.notifier).setMode(selection.first);
      },
    );
  }
}
