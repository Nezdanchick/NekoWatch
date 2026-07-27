/// Порт `types/anime.ts`. Значения констант и логика — без изменений.
library;

/// Заглушка постера, когда у аниме нет своей картинки.
const String missingPosterUrl =
    'https://shikimori.io/assets/globals/missing_preview.jpg';

/// Приоритет вида (kind) при сортировке связанных тайтлов.
const Map<String, int> kindPriority = {
  'tv': 0,
  'movie': 1,
  'ova': 2,
  'ona': 3,
  'special': 4,
  'tv_special': 5,
  'web': 6,
  'pv': 7,
};

const List<String> _hideKinds = ['music', 'cm'];
const List<String> _singleKinds = ['movie', 'special'];

/// Модель тайтла Shikimori.
///
/// JSON от Shikimori содержит вложенные объекты `poster: { mainUrl }`
/// и `airedOn: { date }`, каждый из которых может быть `null`.
class ShikimoriInfo {
  const ShikimoriInfo({
    required this.id,
    required this.name,
    this.russian,
    this.posterUrl,
    this.kind,
    this.score = 0,
    this.airedOnDate,
  });

  final int id;
  final String name;
  final String? russian;
  final String? posterUrl;
  final String? kind;
  final double score;
  final String? airedOnDate;

  /// Принимает любой `Map`, а не только `Map<String, dynamic>`.
  ///
  /// Hive возвращает вложенные объекты как `Map<dynamic, dynamic>`, а
  /// `Map<String, dynamic>.from()` копирует лишь верхний уровень. Жёсткий каст
  /// вложенного `poster` из-за этого падал при чтении кэша — приложение
  /// открывалось пустым экраном до очистки данных.
  factory ShikimoriInfo.fromJson(Map<dynamic, dynamic> json) {
    final poster = json['poster'];
    final airedOn = json['airedOn'];
    final rawScore = json['score'];
    return ShikimoriInfo(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      name: json['name']?.toString() ?? '',
      russian: json['russian']?.toString(),
      posterUrl: poster is Map ? poster['mainUrl']?.toString() : null,
      kind: json['kind']?.toString(),
      score: rawScore == null
          ? 0
          : (rawScore is num ? rawScore.toDouble() : double.tryParse('$rawScore') ?? 0),
      airedOnDate: airedOn is Map ? airedOn['date']?.toString() : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'russian': russian,
        'poster': {'mainUrl': posterUrl},
        'kind': kind,
        'score': score,
        'airedOn': {'date': airedOnDate},
      };

  ShikimoriInfo copyWith({
    int? id,
    String? name,
    String? russian,
    String? posterUrl,
    String? kind,
    double? score,
    String? airedOnDate,
  }) {
    return ShikimoriInfo(
      id: id ?? this.id,
      name: name ?? this.name,
      russian: russian ?? this.russian,
      posterUrl: posterUrl ?? this.posterUrl,
      kind: kind ?? this.kind,
      score: score ?? this.score,
      airedOnDate: airedOnDate ?? this.airedOnDate,
    );
  }
}

bool canShow(ShikimoriInfo anime) =>
    anime.kind != null && !_hideKinds.contains(anime.kind);

bool canShowSeries(ShikimoriInfo anime) => !_singleKinds.contains(anime.kind);

bool canOpen(ShikimoriInfo anime) => anime.score != 0;
