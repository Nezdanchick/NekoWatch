// Порт `components/anime/AnimeInfo.tsx` в MD3 Chip-строку.
import 'package:flutter/material.dart';

import '../../models/anime.dart';
import '../../models/kodik.dart';

class AnimeMetaRow extends StatelessWidget {
  const AnimeMetaRow({super.key, required this.shikimori, this.kodik});

  final ShikimoriInfo shikimori;
  final KodikInfo? kodik;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final chips = <Widget>[
      Chip(
        avatar: Icon(Icons.sell, size: 16, color: colorScheme.onSurfaceVariant),
        label: Text(shikimori.kind?.toUpperCase() ?? 'N/A'),
      ),
    ];

    if (canShowSeries(shikimori) && kodik?.materialData != null) {
      final aired = kodik!.materialData!.episodesAired?.toString() ?? '?';
      final total = kodik!.materialData!.episodesTotal?.toString() ?? '?';
      chips.add(
        Chip(
          avatar: Icon(Icons.videocam, size: 16, color: colorScheme.onSurfaceVariant),
          label: Text('$aired/$total'),
        ),
      );
    }

    chips.add(
      Chip(
        avatar: Icon(Icons.calendar_today, size: 16, color: colorScheme.onSurfaceVariant),
        label: Text(shikimori.airedOnDate ?? 'N/A'),
      ),
    );

    chips.add(
      Chip(
        avatar: Icon(Icons.star, size: 16, color: colorScheme.onSurfaceVariant),
        label: Text(shikimori.score != 0 ? shikimori.score.toString() : 'N/A'),
      ),
    );

    return Wrap(spacing: 8, runSpacing: 8, children: chips);
  }
}
