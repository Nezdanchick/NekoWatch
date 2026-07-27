// Порт `app/(tabs)/search.tsx`.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/anime.dart';
import '../providers/search_provider.dart';
import '../widgets/anime_card.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent * 0.5) {
      ref.read(searchProvider.notifier).loadMore();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final search = ref.watch(searchProvider);
    final results = search.results.where(canShow).toList();

    return Scaffold(
      appBar: AppBar(
        title: SearchBar(
          controller: _controller,
          focusNode: _focusNode,
          hintText: 'Введите название аниме',
          leading: const Icon(Icons.search),
          trailing: search.query.isNotEmpty
              ? [
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      _controller.clear();
                      ref.read(searchProvider.notifier).setQuery('');
                    },
                  ),
                ]
              : null,
          onChanged: (value) => ref.read(searchProvider.notifier).setQuery(value),
        ),
      ),
      body: search.error != null
          ? Center(
              child: Text(
                'Ошибка при поиске',
                style: theme.textTheme.bodyLarge?.copyWith(color: colorScheme.error),
              ),
            )
          : (results.isEmpty && !search.loading)
              ? Center(
                  child: Text(
                    search.debouncedQuery.isEmpty
                        ? '^///^'
                        : (search.debouncedQuery.length < minimalQueryLength
                            ? 'Введите не менее $minimalQueryLength символов'
                            : 'Ничего не найдено'),
                    style: theme.textTheme.bodyLarge?.copyWith(color: colorScheme.onSurfaceVariant),
                    textAlign: TextAlign.center,
                  ),
                )
              : GridView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: kAnimeGridMaxExtent,
                      childAspectRatio: kAnimeGridAspectRatio,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                  itemCount: results.length + (search.loading ? 2 : 0),
                  itemBuilder: (context, index) {
                    if (index >= results.length) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    return AnimeCard(anime: results[index]);
                  },
                ),
    );
  }
}
