#!/bin/sh

# Установка зависимостей (если требуется)
# sudo npm install -g bun eas-cli expo-cli

# Профиль сборки APK
default_profile="development"
if [ -n "$1" ]; then
  profile="$1"
else
  profile="$default_profile"
fi

if [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "❌ ANDROID_SDK_ROOT не установлен. Установите Android Studio и настройте переменные окружения."
    exit 1
fi

# Версия NDK
NDK_VERSION="26.1.10909125"
NDK_PATH="$ANDROID_SDK_ROOT/ndk/$NDK_VERSION"

# Устанавливаем NDK, если его нет
if [ ! -d "$NDK_PATH" ]; then
    echo "🔍 Установка зависимостей для сборки под Android..."
    sudo $ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager --install "ndk;$NDK_VERSION" --sdk_root=$ANDROID_SDK_ROOT
    sudo $ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager --install "build-tools;35.0.0" "platforms;android-35"
    sudo $ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager --install "build-tools;35.0.0" "platforms;android-35" --channel=2
    sudo $ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager --install "build-tools;34.0.0" "platforms;android-34"
    sudo $ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager --install "cmake;3.22.1"
fi

export ANDROID_NDK_HOME=$NDK_PATH

echo "ANDROID_NDK_HOME установлен в $NDK_PATH"

build_cmd="eas build --platform android --profile $profile"

$build_cmd
