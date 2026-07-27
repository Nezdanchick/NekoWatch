// Порт `components/AnimeList.tsx` (горизонтальный вариант для главной).
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/anime.dart';
import 'anime_card.dart';

class AnimeCarousel extends StatelessWidget {
  const AnimeCarousel({
    super.key,
    required this.title,
    required this.type,
    required this.data,
    this.error,
  });

  final String title;
  final String type;
  final List<ShikimoriInfo> data;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Card(
          color: colorScheme.errorContainer,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Ошибка при загрузке данных',
              style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onErrorContainer),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    final visible = data.where(canShow).toList();
    if (visible.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: theme.textTheme.titleLarge),
              TextButton.icon(
                onPressed: () => context.push('/anime-list', extra: {'title': title, 'type': type}),
                icon: const Icon(Icons.arrow_forward, size: 16),
                label: const Text('Все'),
              ),
            ],
          ),
        ),
        SizedBox(
          height: kAnimeCarouselHeight,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: visible.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) => SizedBox(
              width: kAnimeCardWidth,
              child: AnimeCard(anime: visible[index]),
            ),
          ),
        ),
      ],
    );
  }
}
