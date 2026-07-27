// Порт `components/history/WatchHistoryItem.tsx`.
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../models/watch_history_item.dart';

const List<String> _ruShortMonths = [
  'янв',
  'февр',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сент',
  'окт',
  'нояб',
  'дек',
];

String _formatDate(int timestamp) {
  final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
  return '${date.day} ${_ruShortMonths[date.month - 1]}';
}

class WatchHistoryTile extends StatelessWidget {
  const WatchHistoryTile({
    super.key,
    required this.item,
    this.continueWatchingShow = false,
    this.floating = false,
  });

  final WatchHistoryItem item;
  final bool continueWatchingShow;

  /// Плитка висит поверх контента (баннер «продолжить просмотр») — ей нужны
  /// тень и более плотная поверхность, иначе она сливается со списком.
  final bool floating;

  void _openInfo(BuildContext context) => context.push('/anime/${item.animeId}');

  void _continueWatching(BuildContext context) {
    if (item.link == null) return;
    context.push('/player', extra: {'url': item.link, 'animeId': item.animeId});
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      margin: floating
          ? EdgeInsets.zero
          : const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      clipBehavior: Clip.antiAlias,
      elevation: floating ? 6 : 0,
      color: floating ? colorScheme.surfaceContainerHigh : null,
      shadowColor: floating ? Colors.black : null,
      child: IntrinsicHeight(
        child: Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: () => _openInfo(context),
                child: Row(
                  children: [
                    SizedBox(
                      width: 80,
                      height: 80,
                      child: CachedNetworkImage(imageUrl: item.image, fit: BoxFit.cover),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.titleSmall,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatDate(item.lastWatched),
                              style: theme.textTheme.labelSmall
                                  ?.copyWith(color: colorScheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (continueWatchingShow)
              Padding(
                padding: const EdgeInsets.only(right: 12, left: 4),
                child: IconButton.filled(
                  onPressed: item.link != null ? () => _continueWatching(context) : null,
                  icon: const Icon(Icons.play_arrow_rounded),
                  tooltip: 'Продолжить просмотр',
                ),
              ),
          ],
        ),
      ),
    );
  }
}
