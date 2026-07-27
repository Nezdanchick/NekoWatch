// Порт `app/(tabs)/search.tsx`: debounce 500 мс, минимум 2 символа,
// пагинация по 50 элементов на страницу.
import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/anime.dart';
import '../services/shikimori_api.dart';

const int minimalQueryLength = 2;
const int _pageSize = 50;

class SearchState {
  const SearchState({
    this.query = '',
    this.debouncedQuery = '',
    this.results = const [],
    this.loading = false,
    this.error,
    this.page = 1,
    this.hasMore = true,
  });

  final String query;
  final String debouncedQuery;
  final List<ShikimoriInfo> results;
  final bool loading;
  final String? error;
  final int page;
  final bool hasMore;

  SearchState copyWith({
    String? query,
    String? debouncedQuery,
    List<ShikimoriInfo>? results,
    bool? loading,
    String? error,
    bool clearError = false,
    int? page,
    bool? hasMore,
  }) {
    return SearchState(
      query: query ?? this.query,
      debouncedQuery: debouncedQuery ?? this.debouncedQuery,
      results: results ?? this.results,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class SearchNotifier extends StateNotifier<SearchState> {
  SearchNotifier() : super(const SearchState());

  Timer? _debounceTimer;

  void setQuery(String value) {
    state = state.copyWith(query: value);
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _applyDebouncedQuery(value);
    });
  }

  void _applyDebouncedQuery(String value) {
    state = state.copyWith(debouncedQuery: value);
    if (value.isNotEmpty) {
      _search(1);
    } else {
      state = state.copyWith(results: const [], page: 1, hasMore: true, clearError: true);
    }
  }

  Future<void> _search(int pageNum) async {
    final q = state.debouncedQuery;
    if (q.isEmpty || q.length < minimalQueryLength) return;

    try {
      state = state.copyWith(loading: true, clearError: true);
      final results = await searchAnime(q, pageNum, _pageSize);

      if (results.isEmpty) {
        state = state.copyWith(hasMore: false, loading: false);
      } else {
        final combined = pageNum == 1 ? results : [...state.results, ...results];
        state = state.copyWith(results: combined, page: pageNum, loading: false);
      }
    } catch (err) {
      state = state.copyWith(error: 'Ошибка при поиске', loading: false);
      // ignore: avoid_print
      print(err);
    }
  }

  void loadMore() {
    if (!state.loading && state.hasMore && state.debouncedQuery.isNotEmpty) {
      _search(state.page + 1);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }
}

final searchProvider = StateNotifierProvider<SearchNotifier, SearchState>((ref) {
  return SearchNotifier();
});
