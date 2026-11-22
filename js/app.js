// Главный файл приложения

let currentUser = null; 

// === УТИЛИТЫ МОДАЛЬНЫХ ОКОН ===

// Показать модальное окно с кастомным контентом
function showModal(htmlContent) {
    // Если модалка уже есть, удаляем её
    closeModal();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal';
    overlay.innerHTML = `
        <div class="modal">
            ${htmlContent}
        </div>
    `;
    
    // Закрытие по клику на фон
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    
    document.body.appendChild(overlay);
}

// Закрыть любое открытое модальное окно
function closeModal() {
    const modal = document.getElementById('active-modal');
    if (modal) modal.remove();
}

// Кастомное окно подтверждения (заменяет стандартный confirm)
function showConfirm(message, onConfirm) {
    const html = `
        <h3>Подтверждение</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
        <div class="modal-actions">
            <button class="secondary" onclick="closeModal()">Отмена</button>
            <button id="confirm-btn">Подтвердить</button>
        </div>
    `;
    
    showModal(html);
    
    document.getElementById('confirm-btn').addEventListener('click', () => {
        closeModal();
        if (typeof onConfirm === 'function') onConfirm();
    });
}

// === ЗАПУСК ПРИЛОЖЕНИЯ ===

async function initApp() {
    try {
        registerServiceWorker();
        await initDB();
        currentUser = await getData(STORES.USER, 'profile');
        loadTheme();
        
        if (currentUser) {
            showMainApp();
        } else {
            showOnboarding();
        }
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

// === ТЕМА ===

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// === НАВИГАЦИЯ И ЭКРАНЫ ===

function showOnboarding() {
    const container = document.getElementById('view-container');
    // Убираем нижнюю панель, если она была
    const nav = document.querySelector('.bottom-nav');
    if (nav) nav.remove();
    
    container.innerHTML = `
        <div class="onboarding">
            <h1>Fitness Journal</h1>
            <p>Ваш персональный тренер и аналитик прогресса</p>
            <button onclick="startOnboarding()">Начать</button>
        </div>
    `;
}

function startOnboarding() {
    renderOnboardingStep1();
}

function showMainApp() {
    const container = document.getElementById('view-container');
    
    // Рисуем шапку и нижнюю навигацию
    container.innerHTML = `
        <header class="app-header">
            <h1>Fitness Journal</h1>
            <button class="theme-toggle" onclick="toggleTheme()" aria-label="Сменить тему">
                <svg viewBox="0 0 24 24" id="theme-icon">
                    <!-- Иконка будет обновляться в зависимости от темы -->
                </svg>
            </button>
        </header>
        
        <main id="main-content" style="padding: 20px 16px;"></main>
        
        <nav class="bottom-nav">
            <button class="bottom-nav-item active" data-tab="workouts" onclick="showTab('workouts')">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
                Тренировки
            </button>
            <button class="bottom-nav-item" data-tab="progress" onclick="showTab('progress')">
                <svg viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
                Прогресс
            </button>
            <button class="bottom-nav-item" data-tab="profile" onclick="showTab('profile')">
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                Профиль
            </button>
        </nav>
    `;
    
    updateThemeIcon();
    showTab('workouts');
}

// Обновление иконки темы (солнце/луна)
function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    const icon = document.getElementById('theme-icon');
    if (theme === 'dark') {
        icon.innerHTML = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';
    } else {
        icon.innerHTML = '<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>';
    }
}

// Переключение вкладок
function showTab(tabName) {
    // Обновляем активный класс на нижней панели
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
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

// Регистрация Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => console.log('SW registered'))
            .catch((error) => console.log('SW error:', error));
    }
}

// Запуск
document.addEventListener('DOMContentLoaded', initApp);
