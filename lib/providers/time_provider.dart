// Порт `store/time-store.ts`. Таймер тикает раз в минуту, как в RN.
import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/local_storage.dart';

class TimeState {
  const TimeState({this.totalMinutes = 0, this.isTracking = false});

  final int totalMinutes;
  final bool isTracking;

  TimeState copyWith({int? totalMinutes, bool? isTracking}) {
    return TimeState(
      totalMinutes: totalMinutes ?? this.totalMinutes,
      isTracking: isTracking ?? this.isTracking,
    );
  }
}

class TimeNotifier extends StateNotifier<TimeState> {
  TimeNotifier() : super(const TimeState()) {
    _restore();
  }

  static const _totalMinutesKey = 'totalMinutes';

  Timer? _timer;

  void _restore() {
    final minutes = LocalStorage.timeStorageBox.get(_totalMinutesKey) as int? ?? 0;
    state = state.copyWith(totalMinutes: minutes);
  }

  void startTracking() {
    if (state.isTracking) return;
    _timer = Timer.periodic(const Duration(minutes: 1), (_) => incrementTime());
    state = state.copyWith(isTracking: true);
  }

  void stopTracking() {
    _timer?.cancel();
    _timer = null;
    state = state.copyWith(isTracking: false);
  }

  void incrementTime() {
    state = state.copyWith(totalMinutes: state.totalMinutes + 1);
    LocalStorage.timeStorageBox.put(_totalMinutesKey, state.totalMinutes);
  }

  void resetTime() {
    state = state.copyWith(totalMinutes: 0);
    LocalStorage.timeStorageBox.put(_totalMinutesKey, 0);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final timeProvider = StateNotifierProvider<TimeNotifier, TimeState>((ref) {
  return TimeNotifier();
});
