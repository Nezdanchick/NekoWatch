#!/bin/sh
# Сборка APK для Flutter-версии NekoWatch.
# Использование: ./build-apk.sh [debug|release|split]
#   debug   — быстрый отладочный APK
#   release — релизный APK (по умолчанию)
#   split   — отдельные APK под каждую ABI (меньше вес)

set -e

profile="${1:-release}"

# --- Проверки окружения ---
if ! command -v flutter >/dev/null 2>&1; then
  echo "❌ Flutter SDK не найден. Установите: https://docs.flutter.dev/get-started/install"
  exit 1
fi

if [ -z "$ANDROID_SDK_ROOT" ] && [ -z "$ANDROID_HOME" ]; then
  echo "❌ ANDROID_SDK_ROOT/ANDROID_HOME не установлен. Установите Android Studio и настройте переменные окружения."
  exit 1
fi

# --- Первый запуск: генерация нативных папок ---
if [ ! -d "android" ]; then
  echo "📦 Нативные папки не найдены, генерирую..."
  flutter create --platforms=android,ios --org ru.nekoteam --project-name nekowatch .
fi

echo "📥 Загрузка зависимостей..."
flutter pub get

echo "🔍 Анализ кода..."
flutter analyze || echo "⚠️  Анализатор нашёл замечания, продолжаю сборку."

echo "🔨 Сборка APK (профиль: $profile)..."
case "$profile" in
  debug)
    flutter build apk --debug
    ;;
  split)
    flutter build apk --release --split-per-abi
    ;;
  release)
    flutter build apk --release
    ;;
  *)
    echo "❌ Неизвестный профиль: $profile (ожидается debug, release или split)"
    exit 1
    ;;
esac

echo ""
echo "✅ Готово. APK лежит в:"
ls -lh build/app/outputs/flutter-apk/*.apk 2>/dev/null || true
