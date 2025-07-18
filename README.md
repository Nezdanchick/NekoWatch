<span style="display:block;text-align:center">![alt text](./assets/images/title.png)</span>

Приложение для просмотра аниме, разработанное на React Native, позволяет пользователям удобно просматривать любимые тайты с мобильных устройств. Оно предлагает интуитивно понятный интерфейс, быструю загрузку контента и возможность выбора субтитров или дубляжа.

## Содержание
- [Содержание](#содержание)
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
