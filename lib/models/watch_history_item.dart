/// Порт `WatchHistoryItem` из `types/anime.ts`.
class WatchHistoryItem {
  const WatchHistoryItem({
    required this.animeId,
    required this.title,
    required this.image,
    this.link,
    required this.lastWatched,
  });

  final int animeId;
  final String title;
  final String image;
  final String? link;

  /// millisecondsSinceEpoch
  final int lastWatched;

  factory WatchHistoryItem.fromJson(Map<String, dynamic> json) {
    return WatchHistoryItem(
      animeId: json['animeId'] as int,
      title: json['title'] as String? ?? '',
      image: json['image'] as String? ?? '',
      link: json['link'] as String?,
      lastWatched: json['lastWatched'] as int,
    );
  }

  Map<String, dynamic> toJson() => {
        'animeId': animeId,
        'title': title,
        'image': image,
        'link': link,
        'lastWatched': lastWatched,
      };
}
