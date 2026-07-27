// Порт `components/anime/AnimeButtons.tsx`. Логика выбора плееров и запуска
// просмотра — без изменений, изменён только вид.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/anime.dart';
import '../../models/kodik.dart';
import '../../providers/anime_provider.dart';
import '../../services/collaps_api.dart';
import '../../theme/status_colors.dart';
import 'status_selector.dart';

/// Обе кнопки в ряду одной высоты и формы — иначе «Смотреть» выбивается.
const double _actionHeight = 56;
const double _actionRadius = 18;

class _PlayerOption {
  const _PlayerOption({required this.key, required this.title, required this.link});

  final String key;
  final String title;
  final String link;
}

class AnimeActions extends ConsumerStatefulWidget {
  const AnimeActions({
    super.key,
    required this.shikimori,
    this.kodik = const [],
    this.playersLoading = false,
    this.playersFailed = false,
    this.onRetryPlayers,
  });

  final ShikimoriInfo shikimori;
  final List<KodikInfo> kodik;

  /// Идёт запрос списка плееров.
  final bool playersLoading;

  /// Запрос упал — это не то же самое, что «плееров нет».
  final bool playersFailed;
  final VoidCallback? onRetryPlayers;

  @override
  ConsumerState<AnimeActions> createState() => _AnimeActionsState();
}

class _AnimeActionsState extends ConsumerState<AnimeActions> {
  bool _expanded = false;
  String? _collapsUrl;

  @override
  void initState() {
    super.initState();
    _checkCollaps();
  }

  @override
  void didUpdateWidget(covariant AnimeActions oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.shikimori.id != widget.shikimori.id || oldWidget.kodik != widget.kodik) {
      _collapsUrl = null;
      _checkCollaps();
    }
  }

  Future<void> _checkCollaps() async {
    final kpId = widget.kodik.isNotEmpty ? widget.kodik.first.kinopoiskId : null;
    if (kpId == null) return;
    final url = await checkCollapsPlayer(kpId);
    if (mounted && url != null) {
      setState(() => _collapsUrl = url);
    }
  }

  /// Два плеера, как в RN-версии: Kodik (первый результат прокси) и Collaps.
  List<_PlayerOption> get _availablePlayers {
    final players = <_PlayerOption>[];

    if (widget.kodik.isNotEmpty && widget.kodik.first.link.isNotEmpty) {
      players.add(
        _PlayerOption(key: 'kodik', title: 'Kodik', link: widget.kodik.first.link),
      );
    }

    if (_collapsUrl != null) {
      players.add(_PlayerOption(key: 'collaps', title: 'Collaps', link: _collapsUrl!));
    }
    return players;
  }

  String get _imageUrl => widget.shikimori.posterUrl ?? missingPosterUrl;

  void _handleWatchPress(String link) {
    ref.read(animeProvider.notifier).addToWatchHistory(
          widget.shikimori.id,
          widget.shikimori.russian ?? widget.shikimori.name,
          _imageUrl,
          link,
        );
    context.push('/player', extra: {'url': link, 'animeId': widget.shikimori.id});
  }

  void _handlePlay() {
    final players = _availablePlayers;
    if (players.isNotEmpty) _handleWatchPress(players.first.link);
  }

  String _playersLabel(int count) {
    if (count > 0) return 'Доступно плееров: $count';
    if (widget.playersLoading) return 'Ищем плееры…';
    if (widget.playersFailed) return 'Не удалось загрузить плееры';
    return 'Нет доступных плееров';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final players = _availablePlayers;
    final status = ref.watch(animeProvider.select((s) => s.bookmarks[widget.shikimori.id]));
    final statusPalette = status == null ? null : statusColors(context, status);

    final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(_actionRadius));

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              // «Смотреть» — главное действие: залитая кнопка акцентом.
              // Цвет текста не задаём вручную, иначе он перекрывает
              // контрастный onPrimary и в Monet-палитре читается плохо.
              Expanded(
                child: SizedBox(
                  height: _actionHeight,
                  child: FilledButton.icon(
                    onPressed: players.isEmpty ? null : _handlePlay,
                    style: FilledButton.styleFrom(
                      shape: shape,
                      textStyle: theme.textTheme.titleMedium,
                    ),
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: const Text('Смотреть'),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Статус — второстепенное действие: контурная кнопка той же
              // высоты, но другого веса, чтобы не спорила с главной.
              SizedBox(
                height: _actionHeight,
                child: OutlinedButton.icon(
                  onPressed: () => showAnimeStatusSheet(context, ref, widget.shikimori),
                  style: OutlinedButton.styleFrom(
                    shape: shape,
                    foregroundColor: statusPalette?.base ?? colorScheme.onSurfaceVariant,
                    side: BorderSide(
                      color: statusPalette?.base ?? colorScheme.outline,
                      width: status == null ? 1 : 1.5,
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  icon: Icon(
                    status == null ? Icons.bookmark_add_outlined : Icons.bookmark_rounded,
                  ),
                  label: Text(status?.label ?? 'В закладки'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Список плееров живёт внутри той же карточки, что и заголовок,
          // и раскрывается вместе с ней — а не висит отдельным блоком.
          Card(
            color: widget.playersFailed && players.isEmpty
                ? colorScheme.errorContainer
                : null,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                InkWell(
                  onTap: players.isEmpty ? null : () => setState(() => _expanded = !_expanded),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Icon(Icons.video_library_outlined, color: colorScheme.onSurfaceVariant),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            _playersLabel(players.length),
                            style: theme.textTheme.titleMedium,
                          ),
                        ),
                        if (players.isNotEmpty)
                          AnimatedRotation(
                            turns: _expanded ? 0.5 : 0,
                            duration: const Duration(milliseconds: 250),
                            child: Icon(
                              Icons.expand_more,
                              color: colorScheme.onSurfaceVariant,
                            ),
                          )
                        else if (widget.playersLoading)
                          const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        else if (widget.playersFailed && widget.onRetryPlayers != null)
                          IconButton(
                            icon: const Icon(Icons.refresh),
                            onPressed: widget.onRetryPlayers,
                            tooltip: 'Повторить',
                          ),
                      ],
                    ),
                  ),
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  alignment: Alignment.topCenter,
                  child: _expanded && players.isNotEmpty
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Divider(height: 1, color: colorScheme.outlineVariant),
                            for (final player in players)
                              ListTile(
                                shape: const RoundedRectangleBorder(),
                                leading: CircleAvatar(
                                  backgroundColor: colorScheme.secondaryContainer,
                                  foregroundColor: colorScheme.onSecondaryContainer,
                                  child: const Icon(Icons.play_arrow_rounded),
                                ),
                                title: Text(player.title, style: theme.textTheme.titleMedium),
                                trailing: Icon(
                                  Icons.chevron_right,
                                  color: colorScheme.onSurfaceVariant,
                                ),
                                onTap: () => _handleWatchPress(player.link),
                              ),
                          ],
                        )
                      : const SizedBox(width: double.infinity, height: 0),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
