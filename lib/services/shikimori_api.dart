// Порт `services/shikimori-api.ts`. GraphQL-тела, заголовки, тайминги ретраев
// и лимиты — перенесены 1:1, менять их запрещено.
import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/anime.dart';

const String _graphqlUrl = 'https://shikimori.io/api/graphql';
const String _userAgent = 'NekoWatch (https://github.com/nezdanchick/NekoWatch)';

const String _animesQuery = '''
  id
  name
  russian
  kind
  score
  airedOn { date }
  poster { mainUrl }
''';

Future<void> _delay(int ms) => Future<void>.delayed(Duration(milliseconds: ms));

Map<String, String> _headers() => {
      'User-Agent': _userAgent,
      'Content-Type': 'application/json',
    };

Future<http.Response> _fetchWithRetry(
  Uri url, {
  required String body,
  Map<String, String>? headers,
  int retries = 3,
}) async {
  try {
    final response = await http.post(url, headers: headers, body: body);

    if (response.statusCode == 429 && retries > 0) {
      await _delay(2000);
      return _fetchWithRetry(url, body: body, headers: headers, retries: retries - 1);
    }

    if (response.statusCode >= 500 && retries > 0) {
      await _delay(1000);
      return _fetchWithRetry(url, body: body, headers: headers, retries: retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await _delay(1000);
      return _fetchWithRetry(url, body: body, headers: headers, retries: retries - 1);
    }
    rethrow;
  }
}

Future<Map<String, dynamic>?> _graphqlRequest(
  String query, [
  Map<String, dynamic>? variables,
]) async {
  try {
    final response = await _fetchWithRetry(
      Uri.parse(_graphqlUrl),
      headers: _headers(),
      body: jsonEncode({'query': query, 'variables': variables}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) return null;

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final errors = decoded['errors'];
    if (errors != null) {
      throw Exception(jsonEncode(errors));
    }
    return decoded['data'] as Map<String, dynamic>?;
  } catch (error) {
    // ignore: avoid_print
    print('GraphQL request error: $error');
    return null;
  }
}

List<ShikimoriInfo> _parseAnimes(dynamic raw) {
  if (raw is! List) return [];
  return raw
      .whereType<Map<String, dynamic>>()
      .map(ShikimoriInfo.fromJson)
      .toList();
}

Future<List<ShikimoriInfo>> fetchAnimeList({
  int page = 1,
  int limit = 20,
  String order = 'ranked',
  String? kind,
  String? status,
  String? season,
  int? score,
}) async {
  const query = '''
query(
  \$page: PositiveInt
      \$limit: PositiveInt
      \$order: OrderEnum
      \$kind: AnimeKindString
      \$status: AnimeStatusString
      \$season: SeasonString
      \$score: Int
) {
  animes(
    page: \$page
        limit: \$limit
        order: \$order
        kind: \$kind
        status: \$status
        season: \$season
        score: \$score
  ) {
    $_animesQuery
  }
}
''';

  final variables = {
    'page': page,
    'limit': limit,
    'order': order,
    'kind': kind,
    'status': status,
    'season': season,
    'score': score,
  };
  final data = await _graphqlRequest(query, variables);
  return _parseAnimes(data?['animes']);
}

Future<ShikimoriInfo?> fetchAnimeDetails(int id) async {
  const query = '''
query(\$ids: String!) {
  animes(ids: \$ids) {
    $_animesQuery
  }
}
''';

  try {
    await _delay(300);
    final data = await _graphqlRequest(query, {'ids': id.toString()});
    final animes = _parseAnimes(data?['animes']);
    return animes.isNotEmpty ? animes.first : null;
  } catch (error) {
    // ignore: avoid_print
    print('Error fetching anime details: $error');
    return null;
  }
}

Future<List<ShikimoriInfo>> searchAnime(
  String query, [
  int page = 1,
  int limit = 20,
]) async {
  if (query.trim().isEmpty) return [];

  const gqlQuery = '''
query(\$search: String!, \$page: Int, \$limit: Int) {
  animes(search: \$search, page: \$page, limit: \$limit) {
    $_animesQuery
  }
}
''';

  final variables = {'search': query, 'page': page, 'limit': limit};
  final data = await _graphqlRequest(gqlQuery, variables);
  return _parseAnimes(data?['animes']);
}

Future<List<ShikimoriInfo>> fetchRelatedAnime(int id) async {
  const query = '''
query(\$ids: String!) {
  animes(ids: \$ids) {
    related {
      anime {
        $_animesQuery
      }
    }
  }
}
''';

  try {
    final data = await _graphqlRequest(query, {'ids': id.toString()});
    final animes = data?['animes'] as List<dynamic>?;
    if (animes == null || animes.isEmpty) return [];
    final related = animes.first['related'] as List<dynamic>?;
    if (related == null) return [];
    return related
        .whereType<Map<String, dynamic>>()
        .map((item) => item['anime'])
        .whereType<Map<String, dynamic>>()
        .map(ShikimoriInfo.fromJson)
        .toList();
  } catch (error) {
    // ignore: avoid_print
    print('Error fetching related anime: $error');
    return [];
  }
}
