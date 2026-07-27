// Порт `app/screens/anime-list.tsx`. Постранично по 25 элементов.
import 'package:flutter/material.dart';

import '../models/anime.dart';
import '../services/shikimori_api.dart';
import '../widgets/anime_card.dart';

class AnimeListScreen extends StatefulWidget {
  const AnimeListScreen({super.key, required this.title, required this.type});

  final String title;

  /// popular | latest | ongoing | anons
  final String type;

  @override
  State<AnimeListScreen> createState() => _AnimeListScreenState();
}

class _AnimeListScreenState extends State<AnimeListScreen> {
  final List<ShikimoriInfo> _data = [];
  bool _loading = true;
  int _page = 1;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _load();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients || _loading) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent * 0.5) {
      setState(() => _page += 1);
      _load();
    }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final freshData = await _fetchForType(widget.type, _page);
      if (mounted) setState(() => _data.addAll(freshData));
    } catch (err) {
      // ignore: avoid_print
      print('Error fetching ${widget.type} anime: $err');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<List<ShikimoriInfo>> _fetchForType(String type, int page) {
    switch (type) {
      case 'popular':
        return fetchAnimeList(page: page, limit: 25, order: 'popularity');
      case 'latest':
        return fetchAnimeList(page: page, limit: 25, order: 'ranked_shiki', status: 'latest');
      case 'ongoing':
        return fetchAnimeList(page: page, limit: 25, order: 'ranked', status: 'ongoing');
      case 'anons':
        return fetchAnimeList(page: page, limit: 25, order: 'aired_on', status: 'anons');
      default:
        return fetchAnimeList(page: page, limit: 25, order: 'popularity');
    }
  }

  @override
  Widget build(BuildContext context) {
    final visible = _data.where(canShow).toList();
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: GridView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: kAnimeGridMaxExtent,
                      childAspectRatio: kAnimeGridAspectRatio,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
        itemCount: visible.length + (_loading ? 2 : 0),
        itemBuilder: (context, index) {
          if (index >= visible.length) {
            return const Center(child: CircularProgressIndicator());
          }
          return AnimeCard(anime: visible[index]);
        },
      ),
    );
  }
}
