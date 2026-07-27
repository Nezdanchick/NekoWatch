// Порт `components/history/SwipableHistoryItem.tsx`.
// Свайп в любую сторону скрывает баннер визуально, из истории он не удаляется.
import 'package:flutter/material.dart';

import '../../models/watch_history_item.dart';
import 'watch_history_tile.dart';

class ContinueWatchingBanner extends StatefulWidget {
  const ContinueWatchingBanner({super.key, required this.item});

  final WatchHistoryItem item;

  @override
  State<ContinueWatchingBanner> createState() => _ContinueWatchingBannerState();
}

class _ContinueWatchingBannerState extends State<ContinueWatchingBanner> {
  bool _isRemoved = false;

  @override
  void didUpdateWidget(covariant ContinueWatchingBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.item.animeId != widget.item.animeId) {
      _isRemoved = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isRemoved) return const SizedBox.shrink();

    return Dismissible(
      key: ValueKey(widget.item.animeId),
      direction: DismissDirection.horizontal,
      onDismissed: (_) => setState(() => _isRemoved = true),
      child: WatchHistoryTile(
        item: widget.item,
        continueWatchingShow: true,
        floating: true,
      ),
    );
  }
}
