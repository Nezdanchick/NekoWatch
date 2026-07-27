# NekoWatch (Flutter, Material 3)

Полный переезд UI аниме-приложения NekoWatch с React Native (Expo) на Flutter с
Material Design 3. Логика бэкенда (Shikimori GraphQL, Kodik, Collaps) и плеера
перенесена 1:1 из исходного RN-проекта.

**Документация:**

- `DOCUMENTATION.md` — подробный разбор проекта: архитектура, каждый файл,
  сквозные сценарии, рецепты изменений, отладка. Начните отсюда.
- `AGENTS.md` — сжатая справка для ИИ-ассистентов: инварианты, ловушки,
  список того, что ломать нельзя.

## Стек

- **Flutter** 3.24+, **Dart** 3.5+, `useMaterial3: true`
- **State management** — Riverpod (`flutter_riverpod`, `StateNotifier`)
- **Персистентность** — Hive (`hive_flutter`)
- **Навигация** — `go_router`
- **Плеер** — `webview_flutter` (WebView, не нативный видеоплеер)
- **Тема** — `ColorScheme.fromSeed(seedColor: #7B68EE)` + Material You через `dynamic_color`

## Первый запуск

В этом репозитории уже есть весь код Dart (`lib/`), `pubspec.yaml`,
`analysis_options.yaml` и ассеты (`assets/images/`), но отсутствуют нативные
обвязки `android/` и `ios/` — они генерируются локально командой:

```bash
flutter create --platforms=android,ios --org ru.nekoteam --project-name nekowatch .
```

Эта команда создаст папки `android/` и `ios/` (и служебные файлы вроде
`.metadata`, `.gitignore`), **не трогая** существующий `lib/`, `pubspec.yaml`
и ассеты — flutter create безопасно домержит недостающие нативные проекты в
уже существующий пакет.

После этого:

```bash
flutter pub get
flutter run
```

### Android-манифест

После генерации `android/` убедитесь, что в
`android/app/src/main/AndroidManifest.xml` есть:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

и что у тега `<application>` **не** выставлен
`android:usesCleartextTraffic="true"` (в проекте это не требуется — все
запросы идут по HTTPS): `usesCleartextTraffic="false"` или атрибут вовсе не
указан.

`minSdkVersion 21`, `compileSdk 34` — при необходимости поправьте в
`android/app/build.gradle`.

### Иконка и сплэш

`assets/images/icon.png` и `assets/images/title.png` скопированы из RN-проекта
один в один. Подключение через `flutter_launcher_icons`/`flutter_native_splash`
не входит в этот перенос UI и может быть добавлено отдельно.

## Структура

```
lib/
├── main.dart              — точка входа, инициализация Hive, DynamicColorBuilder
├── router.dart             — go_router: ShellRoute с NavigationBar + маршруты
├── models/                 — ShikimoriInfo, KodikInfo, AnimeStatus, WatchHistoryItem
├── services/                — shikimori_api, kodik_api, collaps_api, local_storage (Hive)
├── providers/                — anime/theme/time/home/search state (Riverpod)
├── theme/                    — MD3-тема, статусные цвета
├── screens/                   — экраны приложения
└── widgets/                    — переиспользуемые виджеты (карточки, карусели, история)
```

## Проверка качества

Код написан вручную с учётом идиом Dart 3 / Flutter 3.24 (const, final,
null-safety, современные MD3-виджеты, `withValues(alpha:)` вместо
`withOpacity`, `surfaceContainer*` вместо `background`/`surfaceVariant`).
Т.к. в песочнице недоступен Flutter SDK, `dart analyze`/`dart format` не
запускались — после `flutter pub get` рекомендуется прогнать:

```bash
dart format .
flutter analyze
```

## Известные места, требующие проверки человеком после генерации нативных проектов

- `AnimeMetaRow` (`lib/widgets/anime/anime_meta_row.dart`) реализован по
  мотивам `AnimeInfo.tsx`, но в `AnimeDetailsScreen` мета-строка (★/KIND/год)
  реализована отдельным набором `Chip` согласно §6.5 плана — виджет
  `AnimeMetaRow` пока не подключён ни к одному экрану напрямую (в RN-версии
  `AnimeInfo` тоже нигде не рендерился в `[id].tsx`, несмотря на импорт).
  Оставлен как самостоятельный виджет на будущее, полностью рабочий.
- Иконка `Icons.code` используется как замена `GithubIcon.tsx` (см. план,
  п. 1.2 — «проще использовать встроенную иконку»).
- Автофокус `SearchBar` на экране поиска выполняется в `initState`
  (`WidgetsBinding.instance.addPostFrameCallback`), так как `go_router`
  с простым `ShellRoute` пересоздаёт экран при каждом переходе на вкладку
  (аналог `useFocusEffect` в RN).
- Если требуется полностью сохранять состояние вкладок между переключениями
  (как во вкладках `expo-router` `Tabs`), стоит заменить `ShellRoute` на
  `StatefulShellRoute.indexedShell` — сейчас вкладки пересоздаются заново
  при каждом переходе, что немного отличается от RN-поведения (там табы
  держат состояние благодаря React Navigation).
