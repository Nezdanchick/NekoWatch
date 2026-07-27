/// Порт `KodikInfo`/`KodikMaterialData`/`KodikTranslation` из `types/anime.ts`.
library;

// Kodik отдаёт часть полей то строкой, то числом (например `kinopoisk_id`
// и `episodes_*`). Жёсткий каст `as String?` на таком поле бросает
// исключение и роняет весь разбор ответа — отсюда «Нет доступных плееров».
// Поэтому все скаляры читаем через мягкие хелперы.
String? _asString(dynamic value) => value?.toString();

int? _asInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString());
}

List<String> _asStringList(dynamic value) {
  if (value is! List) return const [];
  return value.map((e) => e.toString()).toList();
}

class KodikTranslation {
  const KodikTranslation({required this.title, this.type});

  final String title;

  /// `voice` — озвучка, `subtitles` — субтитры.
  final String? type;

  bool get isSubtitles => type == 'subtitles';

  factory KodikTranslation.fromJson(Map<dynamic, dynamic> json) {
    return KodikTranslation(
      title: _asString(json['title']) ?? '',
      type: _asString(json['type']),
    );
  }

  Map<String, dynamic> toJson() => {'title': title, 'type': type};
}

class KodikMaterialData {
  const KodikMaterialData({
    this.description,
    this.posterUrl,
    this.animePosterUrl,
    this.screenshots = const [],
    this.episodesTotal,
    this.episodesAired,
  });

  final String? description;
  final String? posterUrl;
  final String? animePosterUrl;
  final List<String> screenshots;
  final int? episodesTotal;
  final int? episodesAired;

  factory KodikMaterialData.fromJson(Map<dynamic, dynamic> json) {
    return KodikMaterialData(
      description: _asString(json['description']),
      posterUrl: _asString(json['poster_url']),
      animePosterUrl: _asString(json['anime_poster_url']),
      screenshots: _asStringList(json['screenshots']),
      episodesTotal: _asInt(json['episodes_total']),
      episodesAired: _asInt(json['episodes_aired']),
    );
  }

  Map<String, dynamic> toJson() => {
        'description': description,
        'poster_url': posterUrl,
        'anime_poster_url': animePosterUrl,
        'screenshots': screenshots,
        'episodes_total': episodesTotal,
        'episodes_aired': episodesAired,
      };
}

class KodikInfo {
  const KodikInfo({
    required this.id,
    required this.title,
    required this.link,
    this.kinopoiskId,
    this.translation,
    this.screenshots = const [],
    this.materialData,
  });

  final String id;
  final String title;
  final String link;
  final String? kinopoiskId;
  final KodikTranslation? translation;
  final List<String> screenshots;
  final KodikMaterialData? materialData;

  factory KodikInfo.fromJson(Map<dynamic, dynamic> json) {
    final translationJson = json['translation'];
    final materialJson = json['material_data'];
    return KodikInfo(
      id: _asString(json['id']) ?? '',
      title: _asString(json['title']) ?? '',
      link: _asString(json['link']) ?? '',
      kinopoiskId: _asString(json['kinopoisk_id']),
      translation:
          translationJson is Map ? KodikTranslation.fromJson(translationJson) : null,
      screenshots: _asStringList(json['screenshots']),
      materialData:
          materialJson is Map ? KodikMaterialData.fromJson(materialJson) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'link': link,
        'kinopoisk_id': kinopoiskId,
        'translation': translation?.toJson(),
        'screenshots': screenshots,
        'material_data': materialData?.toJson(),
      };
}
