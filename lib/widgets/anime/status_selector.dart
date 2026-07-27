// Порт `components/anime/StatusSelector.tsx` через MD3 bottom sheet.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/anime.dart';
import '../../models/anime_status.dart';
import '../../providers/anime_provider.dart';
import '../../theme/status_colors.dart';

/// Открывает лист выбора статуса. Вынесен наружу, чтобы его можно было
/// вызывать не только с экрана аниме, но и по долгому нажатию на карточку.
Future<void> showAnimeStatusSheet(
  BuildContext context,
  WidgetRef ref,
  ShikimoriInfo anime,
) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    // Без этого нижние пункты списка уезжают под полоску жестов.
    useSafeArea: true,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (sheetContext) {
      final currentStatus = ref.read(animeProvider.notifier).getAnimeStatus(anime.id);
      final theme = Theme.of(sheetContext);
      return SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            24,
            0,
            24,
            16 + MediaQuery.viewPaddingOf(sheetContext).bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                anime.russian?.isNotEmpty == true ? anime.russian! : anime.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleMedium
                    ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 2),
              Text('Статус просмотра', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 8),
              for (final status in allAnimeStatuses)
                _StatusOption(
                  status: status,
                  selected: currentStatus == status,
                  onTap: () {
                    ref.read(animeProvider.notifier).setAnimeStatus(anime, status);
                    Navigator.of(sheetContext).pop();
                  },
                ),
              if (currentStatus != null)
                ListTile(
                  leading: Icon(
                    Icons.bookmark_remove_outlined,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  title: Text(
                    'Убрать из списка',
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                  ),
                  onTap: () {
                    ref.read(animeProvider.notifier).setAnimeStatus(anime, null);
                    Navigator.of(sheetContext).pop();
                  },
                ),
            ],
          ),
        ),
      );
    },
  );
}

class _StatusOption extends StatelessWidget {
  const _StatusOption({
    required this.status,
    required this.selected,
    required this.onTap,
  });

  final AnimeStatus status;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = statusColors(context, status);
    final onBase = ThemeData.estimateBrightnessForColor(colors.base) == Brightness.dark
        ? Colors.white
        : Colors.black;
    return ListTile(
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tileColor: selected ? colors.container : null,
      leading: Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: colors.base, width: 2),
          color: selected ? colors.base : Colors.transparent,
        ),
        child: selected ? Icon(Icons.check, size: 14, color: onBase) : null,
      ),
      title: Text(status.label),
    );
  }
}
