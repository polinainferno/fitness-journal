// Главный файл приложения
// Здесь происходит инициализация и навигация между экранами
// Регистрация Service Worker для офлайн-работы
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker зарегистрирован:', registration.scope);
            })
            .catch((error) => {
                console.log('Ошибка регистрации Service Worker:', error);
            });
    }
}

let currentUser = null; // Сюда загрузим данные пользователя

// Запуск приложения
async function initApp() {
    try {
        // Регистрируем Service Worker
        registerServiceWorker();

        // 1. Инициализируем базу данных
        await initDB();
        
        // 2. Загружаем данные пользователя (если есть)
        currentUser = await getData(STORES.USER, 'profile');
        
        // 3. Загружаем тему из localStorage (если сохранена)
        loadTheme();
        
        // 4. Показываем нужный экран
        if (currentUser) {
            // Если пользователь уже зарегистрирован — показываем главное приложение
            showMainApp();
        } else {
            // Если нет — показываем онбординг (регистрацию)
            showOnboarding();
        }
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        alert('Произошла ошибка при загрузке приложения');
    }
}

// Загрузка темы (светлая/тёмная)
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Переключение темы
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    console.log('Тема переключена на:', newTheme); // Для проверки
}

// Показ онбординга (регистрации)
function showOnboarding() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="onboarding">
            <h1>Fitness Journal</h1>
            <p>Ваш персональный тренер и аналитик прогресса</p>
            <button onclick="startOnboarding()">Начать</button>
        </div>
    `;
}

// Начало онбординга (здесь будет форма регистрации)
function startOnboarding() {
    renderOnboardingStep1();
}

// Показ главного приложения (календарь, прогресс, профиль)
function showMainApp() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="app-header">
            <h1>Fitness Journal</h1>
            <button onclick="toggleTheme()" class="theme-toggle">🌓</button>
        </div>
        
        <nav class="tab-nav">
            <button class="tab-button active" data-tab="workouts" onclick="showTab('workouts')">Тренировки</button>
            <button class="tab-button" data-tab="progress" onclick="showTab('progress')">Прогресс</button>
            <button class="tab-button" data-tab="profile" onclick="showTab('profile')">Профиль</button>
        </nav>
        
        <div id="tab-content">
            <p>Здесь будет контент выбранной вкладки</p>
        </div>
    `;
    
    // По умолчанию показываем вкладку "Тренировки"
    showTab('workouts');
}

// Переключение между вкладками
function showTab(tabName) {
    // Проходим по всем кнопкам вкладок
    document.querySelectorAll('.tab-button').forEach(btn => {
        // Активной делаем ту, чья метка data-tab совпадает с нужной вкладкой
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    const tabContent = document.getElementById('tab-content');
    
    // Пока что просто заглушки
    switch(tabName) {
        case 'workouts':
            renderWorkoutsTab();
            break;
        case 'progress':
            renderProgressTab();
            break;
        case 'profile':
            renderProfileTab();
            break;
    }
}

// Запускаем приложение, когда страница загрузилась
document.addEventListener('DOMContentLoaded', initApp);