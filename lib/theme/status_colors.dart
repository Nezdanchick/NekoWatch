// Цвета статусов закладок. В RN были захардкожены (#4CAF50 и т.д.).
//
// В MD3 сырой hue брать нельзя: в динамической (Monet) палитре он выбивается
// из общей гаммы. Поэтому каждый цвет гармонизируется с акцентом текущей темы —
// оттенок остаётся узнаваемым, но попадает в палитру приложения.
import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';

import '../models/anime_status.dart';

Color _seedFor(AnimeStatus status) {
  switch (status) {
    case AnimeStatus.watching:
      return const Color(0xFF4CAF50);
    case AnimeStatus.planned:
      return const Color(0xFF2196F3);
    case AnimeStatus.completed:
      return const Color(0xFF9C27B0);
    case AnimeStatus.onHold:
      return const Color(0xFFFF9800);
    case AnimeStatus.dropped:
      return const Color(0xFFF44336);
  }
}

typedef StatusColorSet = ({Color container, Color onContainer, Color base});

StatusColorSet statusColors(BuildContext context, AnimeStatus status) {
  final scheme = Theme.of(context).colorScheme;
  final statusScheme = ColorScheme.fromSeed(
    seedColor: _seedFor(status).harmonizeWith(scheme.primary),
    brightness: scheme.brightness,
  );
  return (
    container: statusScheme.primaryContainer,
    onContainer: statusScheme.onPrimaryContainer,
    base: statusScheme.primary,
  );
}
