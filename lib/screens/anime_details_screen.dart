// Порт `app/anime/[id].tsx`. Логика кэша/сети/ретраев — без изменений:
// LRU-кэш на 25 записей, fetchWithRetry(maxAttempts: 10, delayMs: 2000),
// параллельная (не блокирующая) загрузка связанных тайтлов.
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/anime.dart';
import '../models/kodik.dart';
import '../services/kodik_api.dart';
import '../services/local_storage.dart';
import '../services/shikimori_api.dart';
import '../widgets/anime/anime_actions.dart';
import '../widgets/anime_card.dart';

const String _descriptionPlaceholder = 'Описание отсутствует.';

// Убирает CDN-поддомены (nyaa./dere.) и приводит хост к shikimori.io.
// В RN-версии нормализация была только для .one — .io добавлен, т.к. API переехал.
String _normalizeScreenshotUrl(String url) {
  return url.replaceAll(
    RegExp(r'https?://(nyaa|dere)\.shikimori\.(one|io)'),
    'https://shikimori.io',
  );
}

Future<T?> _fetchWithRetry<T>(
  Future<T> Function() fetchFn, {
  int maxAttempts = 10,
  int delayMs = 2000,
}) async {
  var attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await fetchFn();
    } catch (_) {
      attempt++;
      await Future<void>.delayed(Duration(milliseconds: delayMs));
    }
  }
  return null;
}

class AnimeDetailsScreen extends ConsumerStatefulWidget {
  const AnimeDetailsScreen({super.key, required this.animeId});

  final int animeId;

  @override
  ConsumerState<AnimeDetailsScreen> createState() => _AnimeDetailsScreenState();
}

class _AnimeDetailsScreenState extends ConsumerState<AnimeDetailsScreen> {
  ShikimoriInfo? _shikimori;
  List<KodikInfo> _kodik = [];
  List<ShikimoriInfo> _relatedAnime = [];
  List<String> _screenshots = [];
  bool _loading = true;
  String? _error;
  String? _description;
  int _currentScreenshotIndex = 0;
  bool _titleExpanded = false;
  bool _showCached = false;

  /// Запрос к Kodik завершился ошибкой (в отличие от «плееров правда нет»).
  bool _playersFailed = false;
  bool _playersLoading = false;

  final PageController _screenshotsController = PageController();
  final ScrollController _scrollController = ScrollController();

  /// Шапка схлопнулась — показываем название в самой панели.
  bool _headerCollapsed = false;

  static const double _headerHeight = 360;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _load();
  }

  /// Бесконечная листалка строится вперёд от нулевой страницы, поэтому
  /// стартуем с середины — тогда работает свайп и назад тоже.
  void _centerScreenshotLoop() {
    if (_screenshots.isEmpty) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_screenshotsController.hasClients) {
        _screenshotsController.jumpToPage(_screenshots.length * 1000);
      }
    });
  }

  void _onScroll() {
    final collapsed = _scrollController.hasClients &&
        _scrollController.offset > _headerHeight - kToolbarHeight - 24;
    if (collapsed != _headerCollapsed) {
      setState(() => _headerCollapsed = collapsed);
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _screenshotsController.dispose();
    super.dispose();
  }

  Future<({List<KodikInfo>? kodik, ShikimoriInfo? shikimori})> _loadFromCache() async {
    final cached = LocalStorage.getKodikCacheEntry(widget.animeId);
    if (cached == null) return (kodik: null, shikimori: null);

    if (cached.shikimori != null) setState(() => _shikimori = cached.shikimori);
    if (cached.kodik != null) {
      var description = '';
      var screenshots = <String>[];
      if (cached.kodik!.isNotEmpty && cached.kodik!.first.materialData != null) {
        description = cached.kodik!.first.materialData!.description ?? _descriptionPlaceholder;
        screenshots =
            cached.kodik!.first.materialData!.screenshots.map(_normalizeScreenshotUrl).toList();
      }
      setState(() {
        _kodik = cached.kodik!;
        _screenshots = screenshots;
        _description = description;
      });
        _centerScreenshotLoop();
    }
    setState(() {
      _showCached = true;
      _loading = false;
    });
    return cached;
  }

  Future<void> _loadFromNetwork(
    ({List<KodikInfo>? kodik, ShikimoriInfo? shikimori}) cached,
  ) async {
    setState(() {
      _loading = true;
      _error = null;
      _relatedAnime = [];
    });

    ShikimoriInfo? shikimoriResults = cached.shikimori;
    List<KodikInfo>? kodikResults = cached.kodik;

    if (shikimoriResults == null) {
      shikimoriResults =
          await _fetchWithRetry<ShikimoriInfo?>(() => fetchAnimeDetails(widget.animeId));
      if (shikimoriResults != null) {
        setState(() => _shikimori = shikimoriResults);
        await LocalStorage.setKodikCacheEntry(widget.animeId, shikimori: shikimoriResults);
      }
    } else {
      setState(() => _shikimori = shikimoriResults);
    }

    fetchRelatedAnime(widget.animeId).then((related) {
      if (mounted) setState(() => _relatedAnime = related);
    }).catchError((Object err) {
      // ignore: avoid_print
      print('Error fetching related anime: $err');
    });

    if (kodikResults == null) {
      setState(() {
        _playersLoading = true;
        _playersFailed = false;
      });
      kodikResults = await _fetchWithRetry(
        () => searchKodikByShikimoriId(widget.animeId, withMaterialData: true),
      );
      setState(() {
        _playersLoading = false;
        _playersFailed = kodikResults == null;
      });
      if (kodikResults != null) {
        var description = '';
        var screenshots = <String>[];
        if (kodikResults.isNotEmpty && kodikResults.first.materialData != null) {
          description = kodikResults.first.materialData!.description ?? _descriptionPlaceholder;
          screenshots =
              kodikResults.first.materialData!.screenshots.map(_normalizeScreenshotUrl).toList();
        }
        setState(() {
          _kodik = kodikResults!;
          _screenshots = screenshots;
          _description = description;
        });
          _centerScreenshotLoop();
        await LocalStorage.setKodikCacheEntry(widget.animeId, kodik: kodikResults);
      }
    } else {
      var description = '';
      var screenshots = <String>[];
      if (kodikResults.isNotEmpty && kodikResults.first.materialData != null) {
        description = kodikResults.first.materialData!.description ?? _descriptionPlaceholder;
        screenshots =
            kodikResults.first.materialData!.screenshots.map(_normalizeScreenshotUrl).toList();
      }
      setState(() {
        _kodik = kodikResults!;
        _screenshots = screenshots;
        _description = description;
      });
        _centerScreenshotLoop();
    }

    if (shikimoriResults == null && kodikResults == null) {
      setState(() {
        _error = 'Ошибка при загрузке информации об аниме';
        _loading = false;
      });
      return;
    }
    setState(() => _loading = false);
  }

  Future<void> _load() async {
    final cached = await _loadFromCache();
    await _loadFromNetwork(cached);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (_loading && !_showCached) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text('Загрузка...', style: theme.textTheme.bodyLarge),
            ],
          ),
        ),
      );
    }

    if (_error != null || _shikimori == null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              _error ?? 'Ошибка загрузки',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge,
            ),
          ),
        ),
      );
    }

    final shikimori = _shikimori!;
    final imageUrl = shikimori.posterUrl ?? missingPosterUrl;
    final relatedSorted = _relatedAnime.where(canShow).toList()
      ..sort((a, b) => (kindPriority[a.kind] ?? 99).compareTo(kindPriority[b.kind] ?? 99));

    final title = shikimori.russian?.isNotEmpty == true
        ? shikimori.russian!
        : (shikimori.name.isNotEmpty ? shikimori.name : 'Название отсутствует');

    return Scaffold(
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverAppBar(
            expandedHeight: _headerHeight,
            pinned: true,
            stretch: true,
            backgroundColor: colorScheme.surface,
            // Пока картинка развёрнута — название не дублируем, оно и так
            // крупно написано ниже; показываем только когда шапка схлопнулась.
            title: AnimatedOpacity(
              opacity: _headerCollapsed ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
            // Поверх картинки кнопка нужна с тёмной подложкой, на схлопнутой
            // панели она лишняя — плавно убираем только подложку.
            leading: IconButton(
              onPressed: () => Navigator.of(context).maybePop(),
              icon: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _headerCollapsed
                      ? Colors.transparent
                      : Colors.black.withValues(alpha: 0.4),
                ),
                child: Icon(
                  Icons.arrow_back,
                  color: _headerCollapsed ? colorScheme.onSurface : Colors.white,
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.parallax,
              stretchModes: const [StretchMode.zoomBackground],
              background: Stack(
                fit: StackFit.expand,
                children: [
                  _screenshots.isNotEmpty
                      // itemCount не задаём — листалка бесконечная в обе
                      // стороны, индекс сворачивается по модулю.
                      ? PageView.builder(
                          controller: _screenshotsController,
                          onPageChanged: (index) => setState(
                            () => _currentScreenshotIndex = index % _screenshots.length,
                          ),
                          itemBuilder: (context, index) => CachedNetworkImage(
                            imageUrl: _screenshots[index % _screenshots.length],
                            fit: BoxFit.cover,
                          ),
                        )
                      : CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.cover),
                  IgnorePointer(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.center,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, colorScheme.surface],
                        ),
                      ),
                    ),
                  ),
                  if (_screenshots.length > 1)
                    Positioned(
                      bottom: 24,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          for (var i = 0; i < _screenshots.length; i++)
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              height: 6,
                              width: _currentScreenshotIndex == i ? 24 : 8,
                              decoration: BoxDecoration(
                                color: _currentScreenshotIndex == i
                                    ? colorScheme.primary
                                    : Colors.white.withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    onTap: () => setState(() => _titleExpanded = !_titleExpanded),
                    child: Text(
                      shikimori.russian ?? shikimori.name,
                      maxLines: _titleExpanded ? null : 2,
                      overflow: _titleExpanded ? null : TextOverflow.ellipsis,
                      style: theme.textTheme.headlineMedium,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    shikimori.name,
                    style: theme.textTheme.bodyLarge?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Chip(
                        avatar: Icon(Icons.star, size: 14, color: colorScheme.primary),
                        label: Text(shikimori.score.toString()),
                      ),
                      Chip(label: Text((shikimori.kind ?? '').toUpperCase())),
                      Chip(label: Text(shikimori.airedOnDate?.split('-').first ?? '?')),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: AnimeActions(
              shikimori: shikimori,
              kodik: _kodik,
              playersLoading: _playersLoading,
              playersFailed: _playersFailed,
              onRetryPlayers: () => _loadFromNetwork(
                (kodik: null, shikimori: _shikimori),
              ),
            ),
          ),
          if (_description != null && _description!.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Описание', style: theme.textTheme.titleLarge),
                        const SizedBox(height: 12),
                        Text(
                          _description!,
                          style: theme.textTheme.bodyMedium
                              ?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          if (relatedSorted.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 20, bottom: 16),
                      child: Text('Связанное', style: theme.textTheme.titleLarge),
                    ),
                    SizedBox(
                      height: kAnimeCarouselHeight,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: relatedSorted.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) => SizedBox(
                          width: kAnimeCardWidth,
                          child: AnimeCard(anime: relatedSorted[index]),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }
}
