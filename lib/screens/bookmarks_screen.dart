// Порт `app/(tabs)/favorites.tsx`.
// Категории листаются свайпом (PageView), ряд чипов синхронизирован со страницей:
// свайп прокручивает чипы к активному, тап по чипу анимированно листает страницу.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/anime.dart';
import '../models/anime_status.dart';
import '../providers/anime_provider.dart';
import '../theme/status_colors.dart';
import '../widgets/anime_card.dart';

/// `null` — вкладка «Все», далее статусы в порядке `allAnimeStatuses`.
final List<AnimeStatus?> _filters = <AnimeStatus?>[null, ...allAnimeStatuses];

class BookmarksScreen extends ConsumerStatefulWidget {
  const BookmarksScreen({super.key});

  @override
  ConsumerState<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends ConsumerState<BookmarksScreen> {
  final PageController _pageController = PageController();
  final ScrollController _chipsController = ScrollController();
  late final List<GlobalKey> _chipKeys =
      List<GlobalKey>.generate(_filters.length, (_) => GlobalKey());

  int _index = 0;

  @override
  void dispose() {
    _pageController.dispose();
    _chipsController.dispose();
    super.dispose();
  }

  /// Прокручивает ряд чипов так, чтобы активный оказался по центру.
  void _revealChip(int index) {
    final chipContext = _chipKeys[index].currentContext;
    if (chipContext == null) return;
    Scrollable.ensureVisible(
      chipContext,
      alignment: 0.5,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  void _onPageChanged(int index) {
    setState(() => _index = index);
    WidgetsBinding.instance.addPostFrameCallback((_) => _revealChip(index));
  }

  void _onChipTap(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final animeState = ref.watch(animeProvider);

    List<ShikimoriInfo> dataFor(AnimeStatus? filter) {
      final all = animeState.bookmarksData.values;
      final filtered = filter == null
          ? all.toList()
          : all.where((anime) => animeState.bookmarks[anime.id] == filter).toList();
      return filtered.reversed.toList();
    }

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          const SliverAppBar(pinned: true, title: Text('Закладки')),
        ],
        body: Column(
          children: [
            SizedBox(
              height: 56,
              child: ListView.separated(
                controller: _chipsController,
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: _filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final filter = _filters[i];
                  return FilterChip(
                    key: _chipKeys[i],
                    label: Text(filter == null ? 'Все' : filter.label),
                    selected: _index == i,
                    selectedColor: filter == null
                        ? colorScheme.primaryContainer
                        : statusColors(context, filter).container,
                    onSelected: (_) => _onChipTap(i),
                  );
                },
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: _onPageChanged,
                itemCount: _filters.length,
                itemBuilder: (context, i) {
                  final filter = _filters[i];
                  final data = dataFor(filter);

                  if (data.isEmpty) {
                    return CustomScrollView(
                      key: PageStorageKey<int>(i),
                      physics: const AlwaysScrollableScrollPhysics(),
                      slivers: [
                        SliverFillRemaining(
                          hasScrollBody: false,
                          child: Center(
                            child: Text(
                              filter == null
                                  ? 'У вас пока нет закладок'
                                  : 'В этой категории пусто',
                              style: theme.textTheme.bodyLarge
                                  ?.copyWith(color: colorScheme.onSurfaceVariant),
                            ),
                          ),
                        ),
                      ],
                    );
                  }

                  return GridView.builder(
                    key: PageStorageKey<int>(i),
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: kAnimeGridMaxExtent,
                      childAspectRatio: kAnimeGridAspectRatio,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: data.length,
                    itemBuilder: (context, index) =>
                        AnimeCard(anime: data[index]),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
