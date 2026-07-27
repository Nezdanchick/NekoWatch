# NekoWatch (Flutter) — документация для ИИ-агента

Документ описывает проект целиком: архитектуру, потоки данных, договорённости,
неочевидные ловушки и историю уже исправленных багов. Прочитайте его до того,
как менять код — половина описанных здесь мест выглядит безобидно, но ломает
приложение при перезапуске или в release-сборке.

---

## 1. Что это

Android/iOS-приложение для просмотра аниме. Это **порт существующего
React Native (Expo) приложения на Flutter + Material Design 3**.

- Оригинал (только для чтения, менять нельзя): `../` — папки `app/`,
  `components/`, `services/`, `store/`, `types/`, `constants/`.
- Flutter-версия: эта папка, `nekowatch_flutter/`.

**Ключевой принцип порта:** слой данных и логика плееров перенесены 1:1.
Переписан только UI. Если вы меняете URL, GraphQL-запрос, тайминг ретраев,
размер страницы или лимит кэша — вы нарушаете контракт порта. Сверяйтесь
с оригиналом в `../services/` и `../store/`.

Приложение целиком на русском языке. Все строки интерфейса перенесены
из RN-версии дословно; не переписывайте их «чтобы лучше звучало».

---

## 2. Быстрый старт

```bash
flutter pub get
flutter analyze
flutter run                    # отладка
./build-apk.sh                 # release APK
./build-apk.sh split           # отдельные APK под ABI
```

Если нет папки `android/` — сначала:

```bash
flutter create --platforms=android,ios --org ru.nekoteam --project-name nekowatch .
```

**Важно про release-сборку:** Flutter кладёт разрешение INTERNET только
в `android/app/src/debug/AndroidManifest.xml` и `profile/`. В главный манифест
оно добавлено вручную. Если вы регенерируете `android/`, проверьте, что
в `android/app/src/main/AndroidManifest.xml` осталось:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

Без него debug работает, а release молча показывает пустые экраны.

---

## 3. Стек

| Слой | Решение | Заметка |
|---|---|---|
| Состояние | `flutter_riverpod` (`StateNotifier`) | ближайший аналог zustand из RN-версии |
| Персистентность | `hive` + `hive_flutter` | замена AsyncStorage |
| Навигация | `go_router` | аналог expo-router |
| Сеть | `http` | без Dio, запросы простые |
| Изображения | `cached_network_image` | |
| Плеер | `webview_flutter` | плееры сторонние, это iframe |
| Тема | `dynamic_color` | Material You |
| Прочее | `url_launcher`, `package_info_plus` | |

SDK: Dart `^3.5.0`, Flutter 3.24+, `useMaterial3: true`.

---

## 4. Карта каталогов

```
lib/
├── main.dart                  точка входа, сборка ThemeData, DynamicColorBuilder
├── router.dart                все маршруты go_router
├── models/                    чистые модели + правила отображения
│   ├── anime.dart             ShikimoriInfo, canShow/canOpen/canShowSeries, kindPriority
│   ├── anime_status.dart      enum AnimeStatus + метки и ключи хранения
│   ├── kodik.dart             KodikInfo / KodikMaterialData / KodikTranslation
│   └── watch_history_item.dart
├── services/                  внешний мир
│   ├── shikimori_api.dart     GraphQL: списки, поиск, детали, связанное
│   ├── kodik_api.dart         прокси Kodik: озвучки и ссылка на плеер
│   ├── collaps_api.dart       проверка доступности плеера Collaps
│   └── local_storage.dart     обёртка Hive: боксы, кэши, миграция схемы
├── providers/                 состояние
│   ├── anime_provider.dart    закладки + история просмотров
│   ├── home_provider.dart     4 секции главной + их кэш
│   ├── search_provider.dart   поиск с debounce и пагинацией
│   ├── theme_provider.dart    режим темы
│   └── time_provider.dart     счётчик времени просмотра
├── theme/
│   ├── app_theme.dart         seed-цвет, три схемы, ThemeData
│   └── status_colors.dart     цвета статусов, гармонизированные с темой
├── screens/                   по экрану на файл
└── widgets/                   переиспользуемые куски UI
```

---

## 5. Слой данных

### 5.1 Shikimori — `services/shikimori_api.dart`

Единственный эндпоинт для главной, поиска, деталей и связанных тайтлов:

```
POST https://shikimori.io/api/graphql
User-Agent: NekoWatch (https://github.com/nezdanchick/NekoWatch)
Content-Type: application/json
```

`User-Agent` обязателен — без него Shikimori режет запросы.

Ретраи (`_fetchWithRetry`, 3 попытки): `429` → пауза 2000 мс,
`5xx` → 1000 мс, сетевая ошибка → 1000 мс. Значения перенесены из RN, не меняйте.

Публичные функции:

| Функция | Назначение |
|---|---|
| `fetchAnimeList({page, limit, order, kind, status, season, score})` | списки для главной и «Все» |
| `fetchAnimeDetails(id)` | карточка тайтла, с `_delay(300)` перед запросом |
| `searchAnime(query, page, limit)` | поиск |
| `fetchRelatedAnime(id)` | блок «Связанное» |

Общий набор полей вынесен в `_animesQuery`:
`id name russian kind score airedOn { date } poster { mainUrl }`.

**Важно:** `_graphqlRequest` глушит любую ошибку и возвращает `null`, а функции
выше превращают это в пустой список. То есть **сетевой сбой неотличим от
«ничего не найдено»**. Именно поэтому `HomeNotifier` трактует полностью пустой
результат как ошибку — иначе пользователь видит чёрный экран без объяснений.

### 5.2 Kodik — `services/kodik_api.dart`

```
GET https://neko-kodik.nezdanchick.deno.net/api/anime/?shikimori_id=<id>[&with_material_data=true]
```

Это **прокси автора проекта**, а не официальное API Kodik. Токен не нужен.
Ссылка на плеер собирается вручную из id результата:

```dart
withLink['link'] = '$kodikProxyUrl/api/player/?id=${result['id']}';
```

`with_material_data=true` добавляет `material_data` с описанием, скриншотами
и числом серий — из него берутся описание и галерея на экране аниме.

Функция бросает исключение при ошибке HTTP или разбора; вызывающий код
(`anime_details_screen`) оборачивает её в `_fetchWithRetry` (10 попыток × 2 с).

### 5.3 Collaps — `services/collaps_api.dart`

```
GET https://neko-collaps.nezdanchick.deno.net/?kinopoisk_id=<id>
```

Если ответ 200 — URL считается рабочим плеером и добавляется вторым пунктом.
`kinopoisk_id` берётся **из ответа Kodik**, поэтому Collaps полностью зависит
от Kodik: нет Kodik → нет и Collaps.

### 5.4 Исторический контекст

Раньше прокси жили на `*.deno.dev` — деплой истёк, оба домена умерли.
Был промежуточный вариант с прямым API Kodik по токену; он удалён.
Если прокси снова умрут, восстановить прямой доступ можно так:
`POST https://kodik-api.com/search?token=<token>&shikimori_id=<id>&limit=100&with_material_data=true`,
плюс ссылки надо нормализовать (`//kodik.info/...` → `https://kodik.info/...`).

---

## 6. Хранилище — `services/local_storage.dart`

Пять боксов Hive:

| Бокс | Содержимое | Аналог в RN |
|---|---|---|
| `anime_storage` | закладки, история, версия схемы | `anime-storage` |
| `theme_storage` | выбранный режим темы | `theme-storage` |
| `time_storage` | суммарные минуты просмотра | `time-storage` |
| `home_cache` | 4 секции главной | ключи `home_*` |
| `kodik_cache` | LRU на 25 записей деталей | `kodikCache` |

`LocalStorage.init()` вызывается из `main()` **до** `runApp` и в конце
запускает `_migrateCaches()`.

### Миграция схемы

```dart
static const int _cacheSchemaVersion = 3;
```

Если сохранённая версия меньше — `kodik_cache` и `home_cache` очищаются,
закладки и история сохраняются. **Поднимайте версию всякий раз, когда меняется
формат кэша или адреса, зашитые в закэшированные данные** (например, ссылки
на плеер). Иначе у пользователей останутся мёртвые записи.

### ⚠️ Главная ловушка Hive

`Map<String, dynamic>.from(e)` копирует **только верхний уровень**. Вложенные
объекты остаются `Map<dynamic, dynamic>`, и жёсткий каст вида
`json['poster'] as Map<String, dynamic>?` бросает `TypeError`.

Это ровно тот баг, из-за которого приложение при первом запуске работало
(данные из сети), а после перезахода открывалось пустым белым экраном
и чинилось только очисткой данных приложения.

Поэтому:

- все `fromJson` принимают `Map<dynamic, dynamic>`, а не `Map<String, dynamic>`;
- вложенные объекты читаются через проверку `is Map`;
- скаляры — через мягкие хелперы (`_asString`, `_asInt`, `_asStringList` в `kodik.dart`);
- чтение кэша обёрнуто в `try/catch` с удалением битой записи.

**Не возвращайте жёсткие касты в модели.** Kodik к тому же отдаёт часть полей
то строкой, то числом (`kinopoisk_id`, `episodes_total`).

---

## 7. Состояние

Все провайдеры — `StateNotifierProvider`. Восстановление из Hive происходит
в конструкторе нотифаера (`_restore()`), запись — при каждом изменении.

### `animeProvider` → `AnimeState`

```dart
List<WatchHistoryItem> watchHistory;
Map<int, AnimeStatus> bookmarks;      // animeId → статус
Map<int, ShikimoriInfo> bookmarksData; // animeId → сам тайтл
```

Инварианты, перенесённые из RN:

- `addToWatchHistory` удаляет предыдущую запись с тем же `animeId`,
  вставляет новую **в начало** и обрезает список до **100** элементов;
- `setAnimeStatus(anime, null)` удаляет тайтл из обеих карт;
- `addToFavorites` — это просто статус `planned`;
- в списке закладок порядок обратный (`reversed`) — новые сверху.

### `homeProvider` → `HomeState`

Четыре секции, все грузятся параллельно по 25 элементов:

| Секция | Параметры | Заголовок |
|---|---|---|
| popular | `order: 'popularity'` | Популярное аниме |
| latest | `order: 'ranked_shiki', status: 'latest'` | Последние релизы |
| ongoing | `order: 'ranked', status: 'ongoing'` | Онгоинги |
| anons | `order: 'aired_on', status: 'anons'` | Анонсы |

Кэш: если запись в `home_cache` есть — сеть **не дёргается вообще**
(так было в RN). Обновление — только через pull-to-refresh, который сначала
чистит кэш. Флаги `loading` / `error` / `refreshing` — надстройка Flutter-версии
поверх RN-логики, чтобы пустой экран не выглядел как «просто ничего нет».

### `searchProvider` → `SearchState`

Debounce 500 мс, минимум **2** символа (`minimalQueryLength`), страница 50,
догрузка при достижении половины прокрутки. Пустой ответ → `hasMore = false`.

### `themeProvider` → `AppThemeMode`

`enum AppThemeMode { light, amoled, monet }`. Ключ старого режима `dark`
из ранних сборок маппится на `amoled`.

### `timeProvider` → `TimeState`

`Timer.periodic` на минуту. Запускается в `initState` плеера,
останавливается в `dispose`. Значение персистится при каждом инкременте.

---

## 8. Тема

`theme/app_theme.dart`:

```dart
const Color seedColor = Color(0xFF7B68EE);   // фирменный фиолетовый
```

Три режима:

| Режим | Метка в UI | Как строится |
|---|---|---|
| `light` | Светлая | `ColorScheme.fromSeed(seed, light)` |
| `amoled` | Тёмная | dark-схема с поверхностями, выведенными в чистый чёрный |
| `monet` | Монет | палитра из обоев (`dynamic_color`), светлая/тёмная по системе |

В `main.dart` режим раскладывается в пару `theme` / `darkTheme` + `themeMode`.
Для `monet` это `ThemeMode.system`; если система не отдаёт динамическую
палитру (Android < 12), происходит откат на seed-схемы.

### Контуры обязательны

У карточек, чипов и сегментов задан `side: BorderSide(color: outlineVariant)`.
Это не украшение: в динамической палитре уровни `surfaceContainer*` почти
неразличимы, и без контура карточки полностью сливаются с фоном.

### `theme/status_colors.dart`

Цвета статусов закладок пришли из RN хардкодом (зелёный, синий, фиолетовый,
оранжевый, красный). Брать их напрямую нельзя — в Monet они выбиваются из гаммы.
Каждый цвет прогоняется через `harmonizeWith(colorScheme.primary)` и уже потом
через `ColorScheme.fromSeed`. Возвращается запись
`({Color container, Color onContainer, Color base})`.

### ⚠️ Ловушка контраста

Не передавайте `textTheme.*` в `label` кнопки:

```dart
// ПЛОХО: у titleMedium свой цвет (onSurface), он перекроет onPrimary
label: Text('Смотреть', style: theme.textTheme.titleMedium)

// ХОРОШО: цвет остаётся кнопочным
style: FilledButton.styleFrom(textStyle: theme.textTheme.titleMedium),
label: const Text('Смотреть')
```

Из-за этого текст на залитой кнопке был нечитаемым в Monet-палитре.

---

## 9. Навигация — `router.dart`

```
ShellRoute (NavigationBar, 4 вкладки)
  /            HomeScreen
  /search      SearchScreen
  /bookmarks   BookmarksScreen
  /profile     ProfileScreen

/anime/:id     AnimeDetailsScreen     slide справа
/player        PlayerScreen           fade, fullscreenDialog, extra: {url, animeId}
/history       HistoryScreen
/anime-list    AnimeListScreen        extra: {title, type}
```

`ShellRoute` (а не `StatefulShellRoute.indexedStack`) — вкладки
пересоздаются при переключении. Если понадобится сохранять их состояние
и позицию прокрутки, менять надо именно здесь.

Ориентация: глобально `portraitUp` в `main()`, плеер сам переключается
в landscape и возвращает портрет в `dispose`.

---

## 10. Экраны

### `home_screen.dart`
Четыре карусели + pull-to-refresh. Внизу поверх контента — баннер
«продолжить просмотр» (последняя запись истории), он прячется при прокрутке
и свайпается в стороны (`Dismissible`; из истории при этом **не удаляется**,
только скрывается визуально — так было в RN).

### `search_screen.dart`
MD3 `SearchBar` с автофокусом, сетка результатов, бесконечная догрузка.

### `bookmarks_screen.dart`
`NestedScrollView` + горизонтальный ряд `FilterChip` + `PageView` из сеток.
Свайп листает категории, чипы автоматически подкручиваются к активному
(`Scrollable.ensureVisible`, `alignment: 0.5`), тап по чипу анимированно
листает страницу. Категории: Все, Смотрю, В планах, Просмотрено, Отложено, Брошено.

### `profile_screen.dart`
Время просмотра, история, переключатель тем (`SegmentedButton`),
разработчики и ссылки (`url_launcher`), версия из `package_info_plus`.

### `anime_details_screen.dart`
Самый сложный экран.

1. Читает LRU-кэш и сразу рисует, что есть.
2. Параллельно грузит из сети: детали Shikimori и озвучки Kodik, каждое
   через `_fetchWithRetry(maxAttempts: 10, delayMs: 2000)`.
3. Отдельно, не блокируя экран, грузит «Связанное».
4. Скриншоты из `material_data.screenshots`, каждый URL нормализуется:
   поддомены `nyaa.` / `dere.` приводятся к `shikimori.io`.
5. Шапка: `SliverAppBar` 360 px, параллакс, бесконечная листалка скриншотов.
   Название проявляется в панели, когда шапка схлопнулась.

Бесконечность галереи сделана так: `PageView.builder` **без** `itemCount`,
индекс по модулю длины, а `_centerScreenshotLoop()` прыгает на
`length * 1000`, чтобы работал свайп и назад тоже. Вызывайте этот метод
после любого присвоения `_screenshots`.

### `player_screen.dart`
WebView с iframe стороннего плеера. Логика перенесена буквально:
5 попыток перезагрузки с паузой 3000 мс, чёрный фон, скрытый системный UI,
landscape, инжект JS против `touchmove`. Счётчик времени включается здесь.

**Не заменяйте WebView на нативный видеоплеер** — это принципиальное
ограничение порта.

### `anime_list_screen.dart` / `history_screen.dart`
Постраничный список по типу секции; история с подтверждением очистки
через `AlertDialog`.

---

## 11. Виджеты

### `anime_card.dart`
Карточка **не задаёт себе размер** — растягивается под ячейку сетки или под
`SizedBox` карусели. Постер в `Expanded`, подпись фиксированных 36 px под
две строки. Раньше были жёсткие 160×260, из-за чего длинные названия
обрезались, а сетка выглядела рвано.

Константы раскладки экспортируются отсюда и используются всеми сетками:

```dart
const double kAnimeCardWidth = 164;        // ширина в карусели
const double kAnimeCarouselHeight = 300;   // высота карусели
const double kAnimeGridMaxExtent = 190;    // максимальная ширина ячейки
const double kAnimeGridAspectRatio = 0.56;
```

Сетки используют `SliverGridDelegateWithMaxCrossAxisExtent`, а не фиксированное
число колонок — на телефоне выходит 2 колонки, на планшете 3–4 без правок.

Взаимодействие: тап открывает экран аниме; **долгое нажатие** открывает лист
выбора статуса (с виброоткликом). Отдельной кнопки «в избранное» нет.
Если тайтл в закладках, в углу постера кружок с иконкой закладки в цвете
статуса. Если `canOpen(anime) == false` (оценка 0), тап вместо перехода
на 1.2 секунды показывает оверлей `¯\_(ツ)_/¯` / «Тайтл еще не вышел».

### `anime/anime_actions.dart`
Ряд из двух кнопок одной высоты (56) и формы (радиус 18), но разного веса:
«Смотреть» — `FilledButton`, «В закладки» — `OutlinedButton` с цветом статуса
в рамке. Ниже — карточка со списком плееров, которая раскрывается
`AnimatedSize` внутри себя же (не отдельным блоком).

Три различимых состояния списка: «Ищем плееры…» со спиннером,
«Не удалось загрузить плееры» на `errorContainer` с кнопкой повтора,
и настоящее «Нет доступных плееров».

### `anime/status_selector.dart`
Экспортирует `showAnimeStatusSheet(context, ref, anime)` — используется
и карточкой, и экраном аниме. У листа обязательно `useSafeArea: true`,
`isScrollControlled: true` и нижний отступ по `viewPadding`, иначе последние
пункты уезжают под полоску жестов.

### Остальное
`anime_carousel.dart` — заголовок секции + кнопка «Все» + горизонтальный список.
`history/watch_history_tile.dart` — плитка истории; флаг `floating` включает
тень и более плотную поверхность для баннера на главной.
`anime/anime_meta_row.dart` — написан, но нигде не подключён; так же было
в RN (`AnimeInfo.tsx` импортировался, но не рендерился).

---

## 12. Договорённости по коду

- Только MD3-компоненты: `NavigationBar`, `SearchBar`, `FilterChip`,
  `SegmentedButton`, `Card`, `FilledButton`, `ListTile`, `Badge`,
  `AlertDialog`, `showModalBottomSheet(showDragHandle: true)`, `SliverAppBar`.
- Цвета — только из `Theme.of(context).colorScheme`, размеры текста — из
  `textTheme`. Исключения: чёрный фон плеера и полупрозрачные подложки
  поверх постеров.
- Не используйте устаревшее: `withOpacity` → `withValues(alpha:)`,
  `background`/`onBackground` → `surface`/`onSurface`,
  `surfaceVariant` → `surfaceContainerHighest`.
- Русские строки не переписывать.
- `InkWell` требует предка `Material`. Если заменяете `Card` на `Container`,
  ripple исчезнет — используйте `Material` (он к тому же сам анимирует
  смену формы через `animationDuration`).

---

## 13. Чего не делать

| Нельзя | Почему |
|---|---|
| Менять URL, GraphQL-тела, заголовки, тайминги ретраев, лимиты страниц | Контракт порта 1:1 с RN |
| Возвращать `as Map<String, dynamic>` в `fromJson` | Роняет приложение при чтении Hive |
| Менять формат кэша без поднятия `_cacheSchemaVersion` | У пользователей останутся битые записи |
| Заменять WebView на нативный плеер | Плееры — сторонние iframe |
| Убирать INTERNET из главного манифеста | Release-сборка теряет сеть |
| Передавать цветной `TextStyle` в `label` кнопки | Ломает контраст в Monet |
| Убирать контуры у карточек | В Monet всё сливается в один цвет |
| Трогать что-либо за пределами `nekowatch_flutter/` | RN-проект — референс только для чтения |

---

## 14. История уже исправленных багов

Не воспроизводите их заново:

1. **Пустая главная в release.** Не было INTERNET в главном манифесте.
2. **Белый экран при перезаходе.** Поверхностный `Map.from` + жёсткий каст
   вложенного `poster` при чтении Hive.
3. **«Нет доступных плееров».** Умер прокси на `deno.dev`; плюс жёсткие касты
   полей Kodik, которые приходят то строкой, то числом.
4. **Нечитаемый текст кнопки в Monet.** `textTheme` в `label` перекрывал
   `onPrimary`.
5. **Обрезанные названия и рваная сетка.** Карточка с жёстким размером внутри
   ячейки другого размера.
6. **Синяя кнопка в фиолетовой теме.** Статусные цвета без гармонизации.
7. **Лист статусов под полоской жестов.** Не было `useSafeArea`.
8. **Заголовки экранов слишком низко.** Был `SliverAppBar.large`; заменён
   на обычный закреплённый.

---

## 15. Ограничения окружения

- Проверить внешние API из песочницы обычно нельзя — Shikimori, Kodik
  и Collaps не в списке разрешённых доменов. Полагайтесь на логи
  `flutter run` с реального устройства.
- Flutter SDK в песочнице может отсутствовать; тогда `dart analyze`
  недоступен и код надо перечитывать особенно внимательно.

---

## 16. Рецепты типовых задач

**Добавить поле из Shikimori.** Расширьте `_animesQuery` в `shikimori_api.dart`,
добавьте поле в `ShikimoriInfo` (парсинг через мягкие проверки),
обновите `toJson`, поднимите `_cacheSchemaVersion`.

**Добавить плеер.** Новый сервис в `services/`, затем `_availablePlayers`
в `anime_actions.dart` — это единственное место, где собирается список.

**Добавить статус закладки.** `AnimeStatus` в `models/anime_status.dart`
(`storageKey` — строка как в RN), цвет в `status_colors.dart`;
`allAnimeStatuses` автоматически подхватят и закладки, и лист выбора.

**Поменять раскладку карточек.** Только константы в начале `anime_card.dart` —
все сетки и карусели ссылаются на них.

**Добавить экран.** Файл в `screens/`, маршрут в `router.dart`.
Для вкладки — ещё и `_tabPaths` + `destinations` в `shell_screen.dart`
(порядок должен совпадать).
