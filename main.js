// Content script для расширения Page Rotator
// Этот скрипт обрабатывает поворот страницы при вызове из popup окна

// Функция для поворота страницы (вызывается из popup окна)
function rotatePage(rotation) {
    try {
        // Проверяем, что body существует
        if (!document.body) {
            console.error('Body не найден, страница еще не загружена');
            return;
        }
        
        // Применяем поворот к странице с плавной анимацией
        document.body.style.transition = 'transform 1s ease-in-out';
        document.body.style.transform = `rotate(${rotation}deg)`;
        
        console.log(`Страница повернута на ${rotation} градусов`);
    } catch (error) {
        console.error('Ошибка при повороте страницы:', error);
    }
}

// Слушаем сообщения от popup окна
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    try {
        if (request.action === 'rotate') {
            rotatePage(request.rotation);
            sendResponse({success: true, rotation: request.rotation});
        }
    } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);
        sendResponse({success: false, error: error.message});
    }
    
    // Всегда отправляем ответ, чтобы избежать ошибок
    return true;
});

// Уведомляем, что content script загружен и готов
console.log('Page Rotator content script загружен и готов к работе');
