// Порт секций главного экрана из `app/(tabs)/index.tsx`.
// Данные, порядок запросов и лимиты — без изменений: 4 параллельных запроса
// по 25 элементов, кэш в Hive, сеть дёргается только если кэша ещё нет.
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/anime.dart';
import '../services/local_storage.dart';
import '../services/shikimori_api.dart';

const int animeCount = 25;

const Map<String, String> _cacheKeys = {
  'popular': 'home_popularAnime',
  'latest': 'home_latestAnime',
  'ongoing': 'home_ongoingAnime',
  'anons': 'home_anonsAnime',
};

class HomeState {
  const HomeState({
    this.popularAnime = const [],
    this.latestAnime = const [],
    this.ongoingAnime = const [],
    this.anonsAnime = const [],
    this.error,
    this.refreshing = false,
    this.loading = true,
  });

  final List<ShikimoriInfo> popularAnime;
  final List<ShikimoriInfo> latestAnime;
  final List<ShikimoriInfo> ongoingAnime;
  final List<ShikimoriInfo> anonsAnime;
  final String? error;
  final bool refreshing;
  final bool loading;

  /// Ни одна секция не отдала данных — экран будет пустым.
  bool get isEmpty =>
      popularAnime.isEmpty &&
      latestAnime.isEmpty &&
      ongoingAnime.isEmpty &&
      anonsAnime.isEmpty;

  HomeState copyWith({
    List<ShikimoriInfo>? popularAnime,
    List<ShikimoriInfo>? latestAnime,
    List<ShikimoriInfo>? ongoingAnime,
    List<ShikimoriInfo>? anonsAnime,
    String? error,
    bool clearError = false,
    bool? refreshing,
    bool? loading,
  }) {
    return HomeState(
      popularAnime: popularAnime ?? this.popularAnime,
      latestAnime: latestAnime ?? this.latestAnime,
      ongoingAnime: ongoingAnime ?? this.ongoingAnime,
      anonsAnime: anonsAnime ?? this.anonsAnime,
      error: clearError ? null : (error ?? this.error),
      refreshing: refreshing ?? this.refreshing,
      loading: loading ?? this.loading,
    );
  }
}

class HomeNotifier extends StateNotifier<HomeState> {
  HomeNotifier() : super(const HomeState()) {
    loadData();
  }

  Future<void> _loadSection(
    String cacheKey,
    void Function(List<ShikimoriInfo>) setData,
    Future<List<ShikimoriInfo>> Function() fetch,
  ) async {
    final cached = LocalStorage.getHomeCache(cacheKey);

    if (cached != null) {
      setData(cached);
      return;
    }

    try {
      final freshData = await fetch();
      if (freshData.isNotEmpty) {
        setData(freshData);
        await LocalStorage.setHomeCache(cacheKey, freshData);
      }
    } catch (err) {
      state = state.copyWith(error: 'Ошибка при загрузке данных');
      // ignore: avoid_print
      print('Error fetching $cacheKey: $err');
    }
  }

  Future<void> loadData() async {
    state = state.copyWith(loading: true);
    await Future.wait([
      _loadSection(
        _cacheKeys['popular']!,
        (data) => state = state.copyWith(popularAnime: data),
        () => fetchAnimeList(page: 1, limit: animeCount, order: 'popularity'),
      ),
      _loadSection(
        _cacheKeys['latest']!,
        (data) => state = state.copyWith(latestAnime: data),
        () => fetchAnimeList(
          page: 1,
          limit: animeCount,
          order: 'ranked_shiki',
          status: 'latest',
        ),
      ),
      _loadSection(
        _cacheKeys['ongoing']!,
        (data) => state = state.copyWith(ongoingAnime: data),
        () => fetchAnimeList(
          page: 1,
          limit: animeCount,
          order: 'ranked',
          status: 'ongoing',
        ),
      ),
      _loadSection(
        _cacheKeys['anons']!,
        (data) => state = state.copyWith(anonsAnime: data),
        () => fetchAnimeList(
          page: 1,
          limit: animeCount,
          order: 'aired_on',
          status: 'anons',
        ),
      ),
    ]);

    // Shikimori-клиент глушит сетевые ошибки и возвращает пустой список,
    // поэтому пустой экран трактуем как ошибку загрузки — иначе пользователь
    // видит просто чёрный экран без объяснений.
    state = state.copyWith(
      loading: false,
      error: state.isEmpty ? 'Ошибка при загрузке данных' : null,
      clearError: !state.isEmpty,
    );
  }

  Future<void> refresh() async {
    state = state.copyWith(refreshing: true, clearError: true);
    await LocalStorage.clearHomeCache(_cacheKeys.values.toList());
    await loadData();
    state = state.copyWith(refreshing: false);
  }
}

final homeProvider = StateNotifierProvider<HomeNotifier, HomeState>((ref) {
  return HomeNotifier();
});
