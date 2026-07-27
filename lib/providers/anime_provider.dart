// Порт `store/anime-store.ts` (zustand) на Riverpod StateNotifier + Hive.
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/anime.dart';
import '../models/anime_status.dart';
import '../models/watch_history_item.dart';
import '../services/local_storage.dart';

class AnimeState {
  const AnimeState({
    this.watchHistory = const [],
    this.bookmarks = const {},
    this.bookmarksData = const {},
  });

  final List<WatchHistoryItem> watchHistory;
  final Map<int, AnimeStatus> bookmarks;
  final Map<int, ShikimoriInfo> bookmarksData;

  /// Аналог `favoritesData` в RN — просто значения `bookmarksData`.
  List<ShikimoriInfo> get favoritesData => bookmarksData.values.toList();

  AnimeState copyWith({
    List<WatchHistoryItem>? watchHistory,
    Map<int, AnimeStatus>? bookmarks,
    Map<int, ShikimoriInfo>? bookmarksData,
  }) {
    return AnimeState(
      watchHistory: watchHistory ?? this.watchHistory,
      bookmarks: bookmarks ?? this.bookmarks,
      bookmarksData: bookmarksData ?? this.bookmarksData,
    );
  }
}

class AnimeNotifier extends StateNotifier<AnimeState> {
  AnimeNotifier() : super(const AnimeState()) {
    _restore();
  }

  static const _watchHistoryKey = 'watchHistory';
  static const _bookmarksKey = 'bookmarks';
  static const _bookmarksDataKey = 'bookmarksData';

  void _restore() {
    final box = LocalStorage.animeStorageBox;

    final historyRaw = box.get(_watchHistoryKey) as List?;
    final watchHistory = historyRaw
            ?.whereType<Map>()
            .map((e) => WatchHistoryItem.fromJson(Map<String, dynamic>.from(e)))
            .toList() ??
        const <WatchHistoryItem>[];

    final bookmarksRaw = box.get(_bookmarksKey) as Map?;
    final bookmarks = <int, AnimeStatus>{};
    bookmarksRaw?.forEach((key, value) {
      final status = AnimeStatus.fromStorageKey(value as String?);
      if (status != null) bookmarks[int.parse(key.toString())] = status;
    });

    final bookmarksDataRaw = box.get(_bookmarksDataKey) as Map?;
    final bookmarksData = <int, ShikimoriInfo>{};
    bookmarksDataRaw?.forEach((key, value) {
      bookmarksData[int.parse(key.toString())] =
          ShikimoriInfo.fromJson(Map<String, dynamic>.from(value as Map));
    });

    state = AnimeState(
      watchHistory: watchHistory,
      bookmarks: bookmarks,
      bookmarksData: bookmarksData,
    );
  }

  Future<void> _persistWatchHistory() async {
    await LocalStorage.animeStorageBox.put(
      _watchHistoryKey,
      state.watchHistory.map((e) => e.toJson()).toList(),
    );
  }

  Future<void> _persistBookmarks() async {
    final box = LocalStorage.animeStorageBox;
    await box.put(
      _bookmarksKey,
      state.bookmarks.map((id, status) => MapEntry(id.toString(), status.storageKey)),
    );
    await box.put(
      _bookmarksDataKey,
      state.bookmarksData.map((id, anime) => MapEntry(id.toString(), anime.toJson())),
    );
  }

  void setAnimeStatus(ShikimoriInfo anime, AnimeStatus? status) {
    final newBookmarks = Map<int, AnimeStatus>.from(state.bookmarks);
    final newBookmarksData = Map<int, ShikimoriInfo>.from(state.bookmarksData);

    if (status == null) {
      newBookmarks.remove(anime.id);
      newBookmarksData.remove(anime.id);
    } else {
      newBookmarks[anime.id] = status;
      newBookmarksData[anime.id] = anime;
    }

    state = state.copyWith(bookmarks: newBookmarks, bookmarksData: newBookmarksData);
    _persistBookmarks();
  }

  AnimeStatus? getAnimeStatus(int animeId) => state.bookmarks[animeId];

  List<ShikimoriInfo> getAnimesByStatus(AnimeStatus status) {
    return state.bookmarks.entries
        .where((e) => e.value == status)
        .map((e) => state.bookmarksData[e.key])
        .whereType<ShikimoriInfo>()
        .toList();
  }

  void addToFavorites(ShikimoriInfo anime) => setAnimeStatus(anime, AnimeStatus.planned);

  void removeFromFavorites(int animeId) {
    final anime = state.bookmarksData[animeId];
    if (anime != null) setAnimeStatus(anime, null);
  }

  bool isFavorite(int animeId) => state.bookmarks.containsKey(animeId);

  void addToWatchHistory(int animeId, String title, String image, [String? link]) {
    final item = WatchHistoryItem(
      animeId: animeId,
      title: title,
      image: image,
      link: link,
      lastWatched: DateTime.now().millisecondsSinceEpoch,
    );

    final filtered = state.watchHistory.where((h) => h.animeId != animeId).toList();
    final updated = [item, ...filtered];
    final trimmed = updated.length > 100 ? updated.sublist(0, 100) : updated;

    state = state.copyWith(watchHistory: trimmed);
    _persistWatchHistory();
  }

  void clearWatchHistory() {
    state = state.copyWith(watchHistory: const []);
    _persistWatchHistory();
  }
}

final animeProvider = StateNotifierProvider<AnimeNotifier, AnimeState>((ref) {
  return AnimeNotifier();
});
