// Порт `app/(tabs)/index.tsx`.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/anime_provider.dart';
import '../providers/home_provider.dart';
import '../widgets/anime_carousel.dart';
import '../widgets/history/continue_watching_banner.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _bannerHidden = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final home = ref.watch(homeProvider);
    final watchHistory = ref.watch(animeProvider.select((s) => s.watchHistory));

    return Scaffold(
      body: Stack(
        children: [
          NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              if (notification is ScrollStartNotification && !_bannerHidden) {
                setState(() => _bannerHidden = true);
              } else if (notification is ScrollEndNotification && _bannerHidden) {
                setState(() => _bannerHidden = false);
              }
              return false;
            },
            child: RefreshIndicator(
              onRefresh: () => ref.read(homeProvider.notifier).refresh(),
              child: CustomScrollView(
                slivers: [
                  const SliverAppBar(pinned: true, title: Text('NekoWatch')),
                  if (home.loading && home.isEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  if (home.error != null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Card(
                          color: colorScheme.errorContainer,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Text(
                                  home.error!,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: colorScheme.onErrorContainer),
                                ),
                                const SizedBox(height: 8),
                                FilledButton.tonal(
                                  onPressed: () =>
                                      ref.read(homeProvider.notifier).refresh(),
                                  child: const Text('Повторить'),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: AnimeCarousel(
                        title: 'Популярное аниме',
                        type: 'popular',
                        data: home.popularAnime,
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: AnimeCarousel(
                        title: 'Последние релизы',
                        type: 'latest',
                        data: home.latestAnime,
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: AnimeCarousel(
                        title: 'Онгоинги',
                        type: 'ongoing',
                        data: home.ongoingAnime,
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: AnimeCarousel(
                        title: 'Анонсы',
                        type: 'anons',
                        data: home.anonsAnime,
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 90)),
                ],
              ),
            ),
          ),
          if (watchHistory.isNotEmpty)
            Positioned(
              left: 16,
              right: 16,
              bottom: 8,
              child: AnimatedSlide(
                duration: Duration(milliseconds: _bannerHidden ? 200 : 500),
                offset: _bannerHidden ? const Offset(0, 1.5) : Offset.zero,
                child: AnimatedOpacity(
                  duration: Duration(milliseconds: _bannerHidden ? 200 : 500),
                  opacity: _bannerHidden ? 0 : 1,
                  child: ContinueWatchingBanner(
                    key: ValueKey(watchHistory.first.animeId),
                    item: watchHistory.first,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
