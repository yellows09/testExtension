// Скрипт popup окна для расширения Page Rotator
document.addEventListener('DOMContentLoaded', function() {
    const rotateBtn = document.getElementById('rotateBtn');
    const rotationInfo = document.getElementById('rotationInfo');
    
    // Получаем текущий поворот для конкретной вкладки из хранилища
    let currentRotation = 0;
    
    // Загружаем текущий поворот для активной вкладки
    function loadRotationForTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            if (activeTab) {
                // Проверяем, можно ли загружать content script на этой вкладке
                if (activeTab.url.startsWith('chrome://') || 
                    activeTab.url.startsWith('chrome-extension://') ||
                    activeTab.url.startsWith('edge://') ||
                    activeTab.url.startsWith('about:')) {
                    rotationInfo.textContent = 'Расширение не работает на этой вкладке';
                    rotateBtn.disabled = true;
                    return;
                }
                
                const tabKey = `rotation_${activeTab.id}`;
                chrome.storage.local.get([tabKey], function(result) {
                    currentRotation = result[tabKey] || 0;
                    updateRotationInfo();
                });
            }
        });
    }
    
    // Обновляем отображение информации о повороте
    function updateRotationInfo() {
        rotationInfo.textContent = `Current rotation: ${currentRotation}°`;
    }
    
    // Обработчик клика по кнопке поворота
    rotateBtn.addEventListener('click', function() {
        // Получаем активную вкладку
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            
            if (activeTab) {
                // Проверяем, можно ли загружать content script на этой вкладке
                if (activeTab.url.startsWith('chrome://') || 
                    activeTab.url.startsWith('chrome-extension://') ||
                    activeTab.url.startsWith('edge://') ||
                    activeTab.url.startsWith('about:')) {
                    console.error('Невозможно повернуть страницу на этой вкладке:', activeTab.url);
                    return;
                }
                
                // Вычисляем следующий поворот (бесконечный поворот только вправо)
                // Каждый клик добавляет 90 градусов: 0° → 90° → 180° → 270° → 360° → 450° → 540° → 630° → 720° → ...
                currentRotation = currentRotation + 90;
                
                // Сохраняем поворот для этой конкретной вкладки
                const tabKey = `rotation_${activeTab.id}`;
                chrome.storage.local.set({[tabKey]: currentRotation});
                
                // Обновляем отображение
                updateRotationInfo();
                
                // Отправляем сообщение в content script для поворота страницы
                chrome.tabs.sendMessage(activeTab.id, {
                    action: 'rotate',
                    rotation: currentRotation
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Ошибка при повороте страницы:', chrome.runtime.lastError.message);
                        
                        // Пытаемся загрузить content script, если его нет
                        if (chrome.runtime.lastError.message.includes('Could not establish connection')) {
                            console.log('Content script не найден, пытаемся загрузить...');
                            chrome.scripting.executeScript({
                                target: {tabId: activeTab.id},
                                files: ['main.js']
                            }, function() {
                                if (chrome.runtime.lastError) {
                                    console.error('Не удалось загрузить content script:', chrome.runtime.lastError.message);
                                } else {
                                    console.log('Content script загружен, повторяем поворот...');
                                    // Повторяем попытку поворота
                                    setTimeout(() => {
                                        chrome.tabs.sendMessage(activeTab.id, {
                                            action: 'rotate',
                                            rotation: currentRotation
                                        });
                                    }, 100);
                                }
                            });
                        }
                    }
                });
            }
        });
    });
    
    // Загружаем поворот при открытии popup окна
    loadRotationForTab();
    
    // Инициализируем информацию о повороте
    updateRotationInfo();
});
