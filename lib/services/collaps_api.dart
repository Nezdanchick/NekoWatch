// Порт проверки Collaps-плеера из `components/anime/AnimeButtons.tsx`.
import 'package:http/http.dart' as http;

const String collapsProxyUrl = 'https://neko-collaps.nezdanchick.deno.net';

/// Возвращает URL плеера Collaps, если по `kinopoiskId` найден рабочий плеер
/// (сервер отвечает 200), иначе `null`.
Future<String?> checkCollapsPlayer(String kinopoiskId) async {
  final url = '$collapsProxyUrl/?kinopoisk_id=$kinopoiskId';
  try {
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) return url;
    return null;
  } catch (_) {
    return null;
  }
}
