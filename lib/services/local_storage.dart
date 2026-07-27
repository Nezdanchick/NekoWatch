// Обёртка над Hive: боксы-хранилища и утилиты кэша.
// Аналог AsyncStorage-ключей `home_*` и `kodikCache` из RN-версии.
import 'package:hive_flutter/hive_flutter.dart';

import '../models/anime.dart';
import '../models/kodik.dart';

class LocalStorage {
  LocalStorage._();

  static const String animeStorageBoxName = 'anime_storage';
  static const String themeStorageBoxName = 'theme_storage';
  static const String timeStorageBoxName = 'time_storage';
  static const String homeCacheBoxName = 'home_cache';
  static const String kodikCacheBoxName = 'kodik_cache';

  /// Максимальный размер LRU-кэша деталей аниме (как в RN: `slice(-25)`).
  static const int kodikCacheLimit = 25;

  /// Версия схемы кэша. Поднимается, когда старые записи становятся
  /// невалидными — например, при переезде с прокси `neko-kodik.deno.dev`
  /// на официальное API Kodik (в старых записях лежат мёртвые ссылки).
  static const int _cacheSchemaVersion = 3;
  static const String _schemaVersionKey = 'cacheSchemaVersion';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(animeStorageBoxName);
    await Hive.openBox(themeStorageBoxName);
    await Hive.openBox(timeStorageBoxName);
    await Hive.openBox(homeCacheBoxName);
    await Hive.openBox(kodikCacheBoxName);
    await _migrateCaches();
  }

  /// Чистит кэши (но не закладки и не историю), если схема устарела.
  static Future<void> _migrateCaches() async {
    final stored = animeStorageBox.get(_schemaVersionKey) as int? ?? 1;
    if (stored >= _cacheSchemaVersion) return;
    await kodikCacheBox.clear();
    await homeCacheBox.clear();
    await animeStorageBox.put(_schemaVersionKey, _cacheSchemaVersion);
  }

  static Box get animeStorageBox => Hive.box(animeStorageBoxName);
  static Box get themeStorageBox => Hive.box(themeStorageBoxName);
  static Box get timeStorageBox => Hive.box(timeStorageBoxName);
  static Box get homeCacheBox => Hive.box(homeCacheBoxName);
  static Box get kodikCacheBox => Hive.box(kodikCacheBoxName);

  // ---- home_cache ----

  /// Битая запись кэша не должна ронять экран — в худшем случае просто
  /// считаем, что кэша нет, и идём в сеть.
  static List<ShikimoriInfo>? getHomeCache(String key) {
    try {
      final entry = homeCacheBox.get(key);
      if (entry is Map) {
        final data = entry['data'];
        if (data is List) {
          return data.whereType<Map>().map(ShikimoriInfo.fromJson).toList();
        }
      }
    } catch (error) {
      // ignore: avoid_print
      print('Кэш главной повреждён ($key): $error');
      homeCacheBox.delete(key);
    }
    return null;
  }

  static Future<void> setHomeCache(String key, List<ShikimoriInfo> data) async {
    await homeCacheBox.put(key, {
      'data': data.map((e) => e.toJson()).toList(),
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
  }

  static Future<void> clearHomeCache(List<String> keys) async {
    for (final key in keys) {
      await homeCacheBox.delete(key);
    }
  }

  // ---- kodik_cache (LRU, ключ 'entries') ----

  static const String _kodikCacheKey = 'entries';

  /// Возвращает `{kodik, shikimori}` по `animeId`, если есть в кэше, и
  /// перемещает запись в конец (most-recently-used), как в RN.
  static ({List<KodikInfo>? kodik, ShikimoriInfo? shikimori})? getKodikCacheEntry(
    int animeId,
  ) {
    try {
      final list = (kodikCacheBox.get(_kodikCacheKey) as List?)
              ?.whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList() ??
          [];

      final index = list.indexWhere((e) => e['id'] == animeId);
      if (index == -1) return null;

      final found = list.removeAt(index);
      list.add(found);
      kodikCacheBox.put(_kodikCacheKey, list);

      final kodikJson = found['kodik'] as List?;
      final shikimoriJson = found['shikimori'];

      return (
        kodik: kodikJson?.whereType<Map>().map(KodikInfo.fromJson).toList(),
        shikimori: shikimoriJson is Map ? ShikimoriInfo.fromJson(shikimoriJson) : null,
      );
    } catch (error) {
      // ignore: avoid_print
      print('Кэш аниме повреждён: $error');
      kodikCacheBox.delete(_kodikCacheKey);
      return null;
    }
  }

  static Future<void> setKodikCacheEntry(
    int animeId, {
    List<KodikInfo>? kodik,
    ShikimoriInfo? shikimori,
  }) async {
    final list = (kodikCacheBox.get(_kodikCacheKey) as List?)
            ?.whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList() ??
        [];

    final index = list.indexWhere((e) => e['id'] == animeId);
    final Map<String, dynamic> entry =
        index != -1 ? Map<String, dynamic>.from(list[index]) : {'id': animeId};

    if (kodik != null) entry['kodik'] = kodik.map((e) => e.toJson()).toList();
    if (shikimori != null) entry['shikimori'] = shikimori.toJson();

    if (index != -1) list.removeAt(index);
    list.add(entry);

    final trimmed = list.length > kodikCacheLimit
        ? list.sublist(list.length - kodikCacheLimit)
        : list;

    await kodikCacheBox.put(_kodikCacheKey, trimmed);
  }
}
