# Page Rotator - Chrome Extension

Простое расширение для поворота веб-страниц на 90 градусов.

## Как работает Chrome Extensions API

### Архитектура расширения

```
[popup.js] → [Chrome Extensions API] → [main.js (content script)]
     ↓              ↓                           ↓
Клик кнопки → sendMessage() → onMessage.addListener → rotatePage()
```

### Компоненты и их взаимодействие

#### 1. **Popup (popup.js)**
- **Роль**: Пользовательский интерфейс и координация действий
- **Функции**: 
  - Получение активной вкладки через `chrome.tabs.query()`
  - Отправка команд через `chrome.tabs.sendMessage()`
  - Управление состоянием через `chrome.storage.local`

#### 2. **Content Script (main.js)**
- **Роль**: Выполнение действий на веб-странице
- **Функции**:
  - Слушание сообщений через `chrome.runtime.onMessage.addListener`
  - Манипуляция DOM страницы
  - Отправка ответов через `sendResponse()`

#### 3. **Chrome Extensions API**
- **Роль**: Мост между popup и content script
- **Функции**:
  - Передача сообщений между компонентами
  - Управление жизненным циклом расширения
  - Обеспечение безопасности и изоляции

### Ключевые API методы

#### **chrome.tabs.query()**
```javascript
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const activeTab = tabs[0]; // Получаем активную вкладку
    const tabId = activeTab.id; // Уникальный ID вкладки
});
```

#### **chrome.tabs.sendMessage()**
```javascript
chrome.tabs.sendMessage(tabId, {
    action: 'rotate',
    rotation: 90
}, function(response) {
    // Обработка ответа
});
```

#### **chrome.runtime.onMessage.addListener()**
```javascript
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'rotate') {
        // Выполнение действия
        sendResponse({success: true});
    }
    return true; // Важно для асинхронных ответов
});
```

## Структура проекта

```
testExtension/
├── manifest.json      # Конфигурация расширения
├── popup.html        # HTML для popup окна
├── popup.js          # Логика popup (отправка команд)
├── main.js           # Content script (выполнение действий)
├── style.css         # Стили для popup
└── README.md         # Документация
```

### manifest.json - ключевые разрешения

```json
{
  "permissions": [
    "activeTab",    // Доступ к активной вкладке
    "storage",      // Сохранение данных
    "scripting"     // Выполнение скриптов
  ],
  "host_permissions": [
    "<all_urls>"    // Работа на всех сайтах
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],  // Внедрение на все страницы
      "js": ["main.js"]           // Content script
    }
  ]
}
```

## Как расширить функционал

### Подход 1: Добавить функции в существующий main.js

```javascript
// В main.js добавить новую функцию
function zoomPage(scale) {
    document.body.style.transform = `scale(${scale})`;
}

// Расширить обработчик сообщений
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'rotate') {
        rotatePage(request.rotation);
        sendResponse({success: true, action: 'rotate'});
    }
    else if (request.action === 'zoom') {  // ← Новая логика
        zoomPage(request.scale);
        sendResponse({success: true, action: 'zoom'});
    }
    return true;
});
```

### Подход 2: Модульная архитектура

#### Создать новый файл `effects.js`:
```javascript
// effects.js - модуль эффектов
class PageEffects {
    zoom(scale) {
        document.body.style.transform = `scale(${scale})`;
    }
    
    fade(opacity) {
        document.body.style.opacity = opacity;
    }
    
    reset() {
        document.body.style.transform = '';
        document.body.style.opacity = '';
    }
}

window.pageEffects = new PageEffects();
```

#### Обновить main.js:
```javascript
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const actions = {
        'rotate': () => rotatePage(request.rotation),
        'zoom': () => window.pageEffects.zoom(request.scale),
        'fade': () => window.pageEffects.fade(request.opacity),
        'reset': () => window.pageEffects.reset()
    };
    
    if (actions[request.action]) {
        actions[request.action]();
        sendResponse({success: true, action: request.action});
    }
    
    return true;
});
```

#### Обновить manifest.json:
```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["effects.js", "main.js"]  // effects.js загружается первым
    }
  ]
}
```

### Подход 3: Продвинутая модульная архитектура

```
testExtension/
├── modules/
│   ├── effects.js      # Эффекты страницы
│   ├── navigation.js   # Навигация
│   └── utils.js        # Вспомогательные функции
├── main.js             # Основной координатор
├── popup.js            # Пользовательский интерфейс
└── manifest.json       # Конфигурация
```

## Принципы архитектуры

### 1. **Разделение ответственности**
- **popup.js** - только UI и координация
- **main.js** - только обработка сообщений
- **modules/** - только бизнес-логика

### 2. **Централизованная обработка**
```javascript
// В main.js - единая точка входа для всех действий
const actionHandlers = {
    'rotate': rotatePage,
    'zoom': window.pageEffects.zoom,
    'fade': window.pageEffects.fade
};
```

### 3. **Единообразный API**
```javascript
// Все сообщения имеют одинаковую структуру
{
    action: 'actionName',    // Тип действия
    params: {...},           // Параметры
    callback: function()     // Callback (опционально)
}
```

### 4. **Обработка ошибок**
```javascript
try {
    const result = actionHandlers[request.action](request.params);
    sendResponse({success: true, result});
} catch (error) {
    sendResponse({success: false, error: error.message});
}
```

## Отладка и разработка

### Полезные console.log места:
```javascript
// В popup.js
console.log('Отправляем команду:', {action: 'rotate', rotation: 90});

// В main.js
console.log('Получена команда:', request);
console.log('Выполняем действие:', request.action);
```

### Проверка загрузки content script:
```javascript
// В popup.js
chrome.tabs.sendMessage(tabId, {action: 'ping'}, function(response) {
    if (chrome.runtime.lastError) {
        console.log('Content script не загружен');
    } else {
        console.log('Content script готов');
    }
});
```

## Лучшие практики

1. **Всегда возвращайте `true`** в `onMessage.addListener` для асинхронных ответов
2. **Проверяйте существование элементов** перед манипуляцией DOM
3. **Используйте try-catch** для обработки ошибок
4. **Группируйте связанные функции** в модули
5. **Документируйте API** сообщений между компонентами
6. **Тестируйте на разных типах страниц** (обычные сайты, SPA, системные страницы)

## Примеры расширений

- **Эффекты**: масштабирование, прозрачность, фильтры
- **Навигация**: быстрые ссылки, история, закладки
- **Контент**: извлечение данных, форматирование, перевод
- **Инструменты**: калькулятор, заметки, таймер
