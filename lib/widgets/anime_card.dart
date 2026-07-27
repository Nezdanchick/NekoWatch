// Порт `components/AnimeCard.tsx` в MD3 `Card`.
//
// Карточка не задаёт себе размер — она растягивается под ячейку сетки или под
// SizedBox карусели. Постер занимает всё свободное место, подпись фиксированной
// высоты снизу, поэтому длинные названия больше не вылезают за границу.
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/anime.dart';
import '../providers/anime_provider.dart';
import '../theme/status_colors.dart';
import 'anime/status_selector.dart';

/// Ширина карточки в горизонтальных каруселях.
const double kAnimeCardWidth = 164;

/// Высота карусели = ширина / пропорция постера + место под подпись.
const double kAnimeCarouselHeight = 300;

/// Максимальная ширина ячейки в сетках — при 2 колонках на телефоне и
/// 3–4 на планшете карточки остаются одного размера.
const double kAnimeGridMaxExtent = 190;
const double kAnimeGridAspectRatio = 0.56;

class AnimeCard extends ConsumerStatefulWidget {
  const AnimeCard({super.key, required this.anime});

  final ShikimoriInfo anime;

  @override
  ConsumerState<AnimeCard> createState() => _AnimeCardState();
}

class _AnimeCardState extends ConsumerState<AnimeCard> {
  bool _showLockOverlay = false;

  void _handleTap() {
    final anime = widget.anime;
    if (canOpen(anime)) {
      context.push('/anime/${anime.id}');
      return;
    }
    if (_showLockOverlay) return;
    setState(() => _showLockOverlay = true);
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) setState(() => _showLockOverlay = false);
    });
  }

  /// Долгое нажатие открывает лист выбора статуса — карточке не нужна
  /// отдельная кнопка, а в закладки можно положить с любого экрана.
  void _handleLongPress() {
    HapticFeedback.mediumImpact();
    showAnimeStatusSheet(context, ref, widget.anime);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final anime = widget.anime;
    final status = ref.watch(animeProvider.select((s) => s.bookmarks[anime.id]));

    return Card(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: colorScheme.outlineVariant),
      ),
      child: InkWell(
        onTap: _handleTap,
        onLongPress: _handleLongPress,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: anime.posterUrl ?? missingPosterUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) =>
                        Container(color: colorScheme.surfaceContainerHighest),
                    errorWidget: (context, url, error) => CachedNetworkImage(
                      imageUrl: missingPosterUrl,
                      fit: BoxFit.cover,
                    ),
                  ),
                  AnimatedOpacity(
                    opacity: _showLockOverlay ? 1 : 0,
                    duration: const Duration(milliseconds: 250),
                    child: IgnorePointer(
                      child: Container(
                        color: colorScheme.surfaceContainerLow,
                        alignment: Alignment.center,
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '¯\\_(ツ)_/¯',
                              textAlign: TextAlign.center,
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(color: colorScheme.onSurfaceVariant),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Тайтл еще не вышел',
                              textAlign: TextAlign.center,
                              style: theme.textTheme.labelSmall
                                  ?.copyWith(color: colorScheme.onSurface),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  _MetaBar(anime: anime),
                  // Индикатор статуса: компактный кружок в углу, без текста —
                  // он не спорит с постером и не перехватывает нажатия.
                  if (status != null)
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: IgnorePointer(
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: statusColors(context, status).container,
                          ),
                          child: Icon(
                            Icons.bookmark_rounded,
                            size: 16,
                            color: statusColors(context, status).onContainer,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: SizedBox(
                height: 36,
                child: Text(
                  (anime.russian?.isNotEmpty ?? false)
                      ? anime.russian!
                      : (anime.name.isNotEmpty ? anime.name : 'Без названия'),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: colorScheme.onSurface,
                    height: 1.25,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Плашка с типом, датой и оценкой поверх постера.
class _MetaBar extends StatelessWidget {
  const _MetaBar({required this.anime});

  final ShikimoriInfo anime;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Positioned(
      top: 8,
      left: 8,
      right: 8,
      child: IgnorePointer(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          decoration: BoxDecoration(
            color: colorScheme.surface.withValues(alpha: 0.88),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (anime.kind != null)
                Flexible(
                  child: Text(
                    anime.kind!.replaceAll('_', ' ').toUpperCase(),
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.labelSmall
                        ?.copyWith(color: colorScheme.primary),
                  ),
                ),
              if (anime.airedOnDate != null)
                Flexible(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      anime.airedOnDate!.split('-').first,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall
                          ?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ),
                ),
              Text(
                anime.score != 0 ? anime.score.toStringAsFixed(1) : '—',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: colorScheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
