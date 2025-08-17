<span style="display:block;text-align:center">![logo](./assets/images/title.png)</span>
<span style="display:block;text-align:center">[![telegram](https://img.shields.io/badge/Nezdanchick-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/nezdanchickchannel)</span>

Приложение для просмотра аниме, разработанное на React Native, позволяет пользователям удобно просматривать любимые тайты с мобильных устройств. Оно предлагает интуитивно понятный интерфейс, быструю загрузку контента и возможность выбора субтитров или дубляжа.

## Скриншоты
<table>
  <tr style="display: flex; flex-wrap: wrap; justify-content: center;">
    <td style="padding: 5px;"><img src="https://github.com/Nezdanchick/NekoWatch/blob/master/assets/images/photo_1_2025-08-17_22-02-29.jpg" width="250"></td>
    <td style="padding: 5px;"><img src="https://github.com/Nezdanchick/NekoWatch/blob/master/assets/images/photo_2_2025-08-17_22-02-29.jpg" width="250"></td>
    <td style="padding: 5px;"><img src="https://github.com/Nezdanchick/NekoWatch/blob/master/assets/images/photo_3_2025-08-17_22-02-29.jpg" width="250"></td>
    <td style="padding: 5px;"><img src="https://github.com/Nezdanchick/NekoWatch/blob/master/assets/images/photo_4_2025-08-17_22-02-29.jpg" width="250"></td>
    <td style="padding: 5px;"><img src="https://github.com/Nezdanchick/NekoWatch/blob/master/assets/images/photo_5_2025-08-17_22-02-29.jpg" width="250"></td>
    <td style="padding: 5px;"><img src="https://github.com/Nezdanchick/NekoWatch/blob/master/assets/images/photo_6_2025-08-17_22-02-29.jpg" width="250"></td>
  </tr>
</table>


## Содержание
- [Содержание](#содержание)
- [Скриншоты](#скриншоты)
- [Технологии](#технологии)
- [Использование](#использование)
- [TODO](#todo)
- [Команда проекта](#команда-проекта)
  - [Зачем вы разработали этот проект?](#зачем-вы-разработали-этот-проект)
- [Как собрать?](#как-собрать)
  - [Получите и замените Kodik токен в файле types/kodik-token.ts](#получите-и-замените-kodik-токен-в-файле-typeskodik-tokents)
  - [Установите зависимости](#установите-зависимости)
  - [Запустите сборку](#запустите-сборку)

## Технологии
- [React Native](https://reactnative.dev/)
- [Shikimori API](https://shikimori.one/api/doc)
- Kodik API

## Использование
1) Скачать
2) Установить 
3) Пользоваться

## TODO
- [x] Добавление списка просмотренных аниме
- [x] Скрытие свайпом плашки с последним просмотренным аниме
- [x] Починка описаний серий
- [x] Квадратная кнопка просмотра справа от смотреть (без выбора озвучки)
- [x] Скрытие навбара и статус бара
- [x] Добавить темы
- [ ] Кнопка "все" для показа большого списка тайтлов
- [ ] Добавить плеер хентая
- [ ] Добавить фильтры поиска
- [ ] Добавить веб версию

## Команда проекта
- https://github.com/Nezdanchick
- https://github.com/W1neus

### Зачем вы разработали этот проект?
Делать было нехуй

## Как собрать?

### Получите и замените Kodik токен в файле types/kodik-token.ts

### Установите зависимости

> sudo npm install -g @expo/ngrok@^4.1.0   
  sudo npm install -g bun   
  sudo npx expo install react-native-web   
  sudo npm install -g eas-cli   
  sudo npx expo install expo-dev-client   
  sudo npm install -g expo-dev-launcher   
  sudo npm install -g react-native-vector-icons  
 
### Запустите сборку

> ./build-apk.sh # для debug сборки

> ./build-apk.sh preview # для release сборки 
