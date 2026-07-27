// Порт `app/(tabs)/profile.tsx`.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/anime_provider.dart';
import '../widgets/theme_selector.dart';
import '../widgets/time_spent_card.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  String? _version;

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) setState(() => _version = info.version);
  }

  Future<void> _openUrl(String url) async {
    try {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } catch (err) {
      // ignore: avoid_print
      print('Не удалось открыть ссылку: $err');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final watchHistoryLength = ref.watch(animeProvider.select((s) => s.watchHistory.length));

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SliverAppBar(pinned: true, title: Text('Профиль')),
          SliverList(
            delegate: SliverChildListDelegate([
              _SectionTitle('Ваша активность'),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: TimeSpentCard(),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Card(
                  child: ListTile(
                    leading: Icon(Icons.history, color: colorScheme.primary),
                    title: Text(
                      watchHistoryLength > 0 ? 'История просмотров' : 'История пуста',
                    ),
                    subtitle: Text(
                      watchHistoryLength > 0
                          ? 'Просмотренные аниме'
                          : 'Вы ещё не смотрели аниме',
                    ),
                    trailing: watchHistoryLength > 0
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Badge(label: Text('$watchHistoryLength')),
                              const SizedBox(width: 8),
                              const Icon(Icons.chevron_right),
                            ],
                          )
                        : null,
                    onTap: watchHistoryLength > 0 ? () => context.push('/history') : null,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              _SectionTitle('Оформление'),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: ThemeSelector(),
              ),
              const SizedBox(height: 8),
              _SectionTitle('О нас'),
              _SectionSubtitle('Разработчики', theme, colorScheme),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: _DeveloperCard(
                        name: 'Nezdanchick',
                        role: 'Разработчик',
                        onTap: () => _openUrl('https://github.com/Nezdanchick'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _DeveloperCard(
                        name: 'W1neus',
                        role: 'UI/UX дизайнер',
                        onTap: () => _openUrl('https://github.com/W1neus'),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              _SectionSubtitle('Связь', theme, colorScheme),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Card(
                  child: ListTile(
                    leading: Icon(Icons.send, color: colorScheme.primary),
                    title: const Text('Telegram канал'),
                    subtitle: const Text('Подписывайтесь на обновления'),
                    onTap: () => _openUrl('https://t.me/NekoWatch_App'),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Card(
                  child: ListTile(
                    leading: Icon(Icons.code, color: colorScheme.primary),
                    title: const Text('Страница проекта'),
                    subtitle: const Text('Открыть на GitHub'),
                    onTap: () => _openUrl('https://github.com/Nezdanchick/NekoWatch'),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Text(
                    'NekoWatch v${_version ?? ''}',
                    style: theme.textTheme.labelMedium
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        text,
        style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary),
      ),
    );
  }
}

class _SectionSubtitle extends StatelessWidget {
  const _SectionSubtitle(this.text, this.theme, this.colorScheme);

  final String text;
  final ThemeData theme;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Text(
        text.toUpperCase(),
        style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.onSurfaceVariant),
      ),
    );
  }
}

class _DeveloperCard extends StatelessWidget {
  const _DeveloperCard({required this.name, required this.role, required this.onTap});

  final String name;
  final String role;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            children: [
              Icon(Icons.code, size: 32, color: colorScheme.primary),
              const SizedBox(height: 12),
              Text(name, style: theme.textTheme.titleSmall, textAlign: TextAlign.center),
              const SizedBox(height: 4),
              Text(
                role,
                style: theme.textTheme.labelSmall?.copyWith(color: colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
