/// Порт `AnimeStatus` из `types/anime.ts`.
enum AnimeStatus {
  watching,
  planned,
  completed,
  onHold,
  dropped;

  /// Строковый ключ ровно как в RN-хранилище (`on_hold`, а не `onHold`).
  String get storageKey {
    switch (this) {
      case AnimeStatus.watching:
        return 'watching';
      case AnimeStatus.planned:
        return 'planned';
      case AnimeStatus.completed:
        return 'completed';
      case AnimeStatus.onHold:
        return 'on_hold';
      case AnimeStatus.dropped:
        return 'dropped';
    }
  }

  static AnimeStatus? fromStorageKey(String? key) {
    switch (key) {
      case 'watching':
        return AnimeStatus.watching;
      case 'planned':
        return AnimeStatus.planned;
      case 'completed':
        return AnimeStatus.completed;
      case 'on_hold':
        return AnimeStatus.onHold;
      case 'dropped':
        return AnimeStatus.dropped;
      default:
        return null;
    }
  }

  /// Метка дословно как в RN.
  String get label {
    switch (this) {
      case AnimeStatus.watching:
        return 'Смотрю';
      case AnimeStatus.planned:
        return 'В планах';
      case AnimeStatus.completed:
        return 'Просмотрено';
      case AnimeStatus.onHold:
        return 'Отложено';
      case AnimeStatus.dropped:
        return 'Брошено';
    }
  }
}

const List<AnimeStatus> allAnimeStatuses = [
  AnimeStatus.watching,
  AnimeStatus.planned,
  AnimeStatus.completed,
  AnimeStatus.onHold,
  AnimeStatus.dropped,
];
