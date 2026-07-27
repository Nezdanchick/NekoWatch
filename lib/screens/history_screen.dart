// Порт `app/screens/history.tsx`.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/anime_provider.dart';
import '../widgets/history/watch_history_tile.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  Future<void> _confirmClear(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Подтверждение'),
        content: const Text('Вы уверены, что хотите очистить историю?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Отмена'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(dialogContext).colorScheme.error,
              foregroundColor: Theme.of(dialogContext).colorScheme.onError,
            ),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Очистить'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      ref.read(animeProvider.notifier).clearWatchHistory();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final watchHistory = ref.watch(animeProvider.select((s) => s.watchHistory));

    return Scaffold(
      appBar: AppBar(
        title: Text(watchHistory.isNotEmpty ? 'История просмотров' : 'История пуста'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 16),
        itemCount: watchHistory.length,
        itemBuilder: (context, index) => WatchHistoryTile(item: watchHistory[index]),
      ),
      bottomNavigationBar: watchHistory.isNotEmpty
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: FilledButton.tonal(
                  onPressed: () => _confirmClear(context, ref),
                  child: const Text('Очистить историю'),
                ),
              ),
            )
          : null,
    );
  }
}
