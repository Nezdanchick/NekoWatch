// Порт `services/kodik-api.ts`. Параметры запроса — как в RN-версии,
// сменился только хост прокси (у старого деплоя на Deno кончился срок).
import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/kodik.dart';

const String kodikProxyUrl = 'https://neko-kodik.nezdanchick.deno.net';

Future<List<KodikInfo>> searchKodikByShikimoriId(
  int shikimoriId, {
  bool withMaterialData = false,
}) async {
  try {
    // ignore: avoid_print
    print('Searching anime in Kodik by Shikimori ID: $shikimoriId');

    final url = Uri.parse(
      '$kodikProxyUrl/api/anime/?shikimori_id=$shikimoriId'
      '${withMaterialData ? '&with_material_data=true' : ''}',
    );

    final response = await http.get(url);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('HTTP error! status: ${response.statusCode}');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final results = data['results'];

    if (results is List && results.isNotEmpty) {
      return results.whereType<Map<String, dynamic>>().map((result) {
        final withLink = Map<String, dynamic>.from(result);
        withLink['link'] = '$kodikProxyUrl/api/player/?id=${result['id']}';
        return KodikInfo.fromJson(withLink);
      }).toList();
    }

    // ignore: avoid_print
    print('No results found for this Shikimori ID');
    return [];
  } catch (error) {
    // ignore: avoid_print
    print('Request error Kodik API: $error');
    throw Exception('Request error Kodik API: $error');
  }
}
