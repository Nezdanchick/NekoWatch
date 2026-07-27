import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/theme_provider.dart';
import 'router.dart';
import 'services/local_storage.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalStorage.init();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const ProviderScope(child: NekoWatchApp()));
}

class NekoWatchApp extends ConsumerWidget {
  const NekoWatchApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeProvider);

    return DynamicColorBuilder(
      builder: (lightDynamic, darkDynamic) {
        late final ThemeData light;
        late final ThemeData dark;
        late final ThemeMode themeMode;

        switch (mode) {
          case AppThemeMode.light:
            light = buildTheme(lightScheme());
            dark = light;
            themeMode = ThemeMode.light;
          case AppThemeMode.amoled:
            dark = buildTheme(amoledScheme(), amoled: true);
            light = dark;
            themeMode = ThemeMode.dark;
          case AppThemeMode.monet:
            // Палитра из обоев (если система её отдаёт), светлая/тёмная —
            // по системной настройке.
            light = buildTheme(lightScheme(lightDynamic));
            dark = buildTheme(darkScheme(darkDynamic));
            themeMode = ThemeMode.system;
        }

        return MaterialApp.router(
          title: 'NekoWatch',
          debugShowCheckedModeBanner: false,
          theme: light,
          darkTheme: dark,
          themeMode: themeMode,
          routerConfig: appRouter,
        );
      },
    );
  }
}
