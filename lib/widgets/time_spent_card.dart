// Порт `components/TimeSpentSection.tsx`.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/time_provider.dart';

class TimeSpentCard extends ConsumerWidget {
  const TimeSpentCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final totalMinutes = ref.watch(timeProvider.select((s) => s.totalMinutes));
    final hours = totalMinutes ~/ 60;
    final minutes = totalMinutes % 60;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.schedule, color: colorScheme.primary, size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Время просмотра',
                    style: theme.textTheme.titleSmall?.copyWith(color: colorScheme.onSurface),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$hours ч $minutes мин',
                    style: theme.textTheme.titleLarge
                        ?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
