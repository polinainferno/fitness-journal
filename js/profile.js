// Логика профиля и настроек

// Отрисовка вкладки "Профиль"
async function renderProfileTab() {
    const container = document.getElementById('tab-content');
    
    if (!currentUser) {
        container.innerHTML = '<div class="card"><p>Профиль не загружен</p></div>';
        return;
    }
    
    const age = calculateAge(currentUser.dob);
    const goalText = currentUser.goal === 'lose' ? 'Похудеть' : 'Набрать мышечную массу';
    
    container.innerHTML = `
        <div class="card">
            <h2>Профиль</h2>
            
            <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-secondary);">Имя</span>
                    <span style="font-weight: 500;">${currentUser.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-secondary);">Возраст</span>
                    <span style="font-weight: 500;">${age} лет</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-secondary);">Рост</span>
                    <span style="font-weight: 500;">${currentUser.height} см</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-secondary);">Цель</span>
                    <span style="font-weight: 500;">${goalText}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-secondary);">Начальный вес</span>
                    <span style="font-weight: 500;">${currentUser.currentWeight} кг</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-secondary);">Текущий вес</span>
                    <span style="font-weight: 500;">${currentUser.currentWeight} кг</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                    <span style="color: var(--text-secondary);">Целевой вес</span>
                    <span style="font-weight: 500;">${currentUser.targetWeight} кг</span>
                </div>
            </div>
            
            <button onclick="showUpdateWeightForm()" style="width: 100%; margin-bottom: 12px;">Обновить текущий вес</button>
            <button onclick="showEditGoalForm()" style="width: 100%; margin-bottom: 24px; background-color: var(--bg-tertiary); color: var(--text-primary);">Изменить цель и целевой вес</button>
        </div>
        
        <div class="card">
            <h3>Управление данными</h3>
            <button onclick="exportUserData()" style="width: 100%; margin-bottom: 12px;">Экспорт данных (JSON)</button>
            <button onclick="importUserData()" style="width: 100%; margin-bottom: 12px; background-color: var(--bg-tertiary); color: var(--text-primary);">Импорт данных (JSON)</button>
            <button onclick="clearAllUserData()" style="width: 100%; background-color: #ff3b30;">Удалить все данные</button>
        </div>
        
        <div id="profile-action-container"></div>
    `;
}

// Показать форму обновления веса
function showUpdateWeightForm() {
    const container = document.getElementById('profile-action-container');
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>Обновить текущий вес</h3>
            <div class="form-group">
                <label>Новый вес (кг)</label>
                <input type="number" id="new-weight" value="${currentUser.currentWeight}" step="0.1" min="20" max="300" required>
            </div>
            <button onclick="updateWeight()" style="width: 100%;">Сохранить</button>
            <button onclick="document.getElementById('profile-action-container').innerHTML = ''" style="width: 100%; margin-top: 8px; background-color: var(--bg-tertiary); color: var(--text-primary);">Отмена</button>
        </div>
    `;
}

// Обновление веса
async function updateWeight() {
    const newWeight = parseFloat(document.getElementById('new-weight').value);
    
    if (!newWeight || newWeight < 20 || newWeight > 300) {
        alert('Введите корректный вес (от 20 до 300 кг)');
        return;
    }
    
    currentUser.currentWeight = newWeight;
    await saveData(STORES.USER, currentUser);
    
    document.getElementById('profile-action-container').innerHTML = '';
    await renderProfileTab();
}

// Показать форму изменения цели
function showEditGoalForm() {
    const container = document.getElementById('profile-action-container');
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>Изменить цель</h3>
            <div class="form-group">
                <label>Цель</label>
                <select id="edit-goal">
                    <option value="lose" ${currentUser.goal === 'lose' ? 'selected' : ''}>Похудеть</option>
                    <option value="gain" ${currentUser.goal === 'gain' ? 'selected' : ''}>Набрать мышечную массу</option>
                </select>
            </div>
            <div class="form-group">
                <label>Целевой вес (кг)</label>
                <input type="number" id="edit-target-weight" value="${currentUser.targetWeight}" step="0.1" min="20" max="300" required>
            </div>
            <button onclick="updateGoal()" style="width: 100%;">Сохранить</button>
            <button onclick="document.getElementById('profile-action-container').innerHTML = ''" style="width: 100%; margin-top: 8px; background-color: var(--bg-tertiary); color: var(--text-primary);">Отмена</button>
        </div>
    `;
}

// Обновление цели и целевого веса
async function updateGoal() {
    const newGoal = document.getElementById('edit-goal').value;
    const newTargetWeight = parseFloat(document.getElementById('edit-target-weight').value);
    
    if (!newTargetWeight || newTargetWeight < 20 || newTargetWeight > 300) {
        alert('Введите корректный целевой вес (от 20 до 300 кг)');
        return;
    }
    
    currentUser.goal = newGoal;
    currentUser.targetWeight = newTargetWeight;
    await saveData(STORES.USER, currentUser);
    
    document.getElementById('profile-action-container').innerHTML = '';
    await renderProfileTab();
}

// Экспорт всех данных в JSON
async function exportUserData() {
    try {
        const jsonData = await exportData();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        alert('Не удалось экспортировать данные');
    }
}

// Импорт данных из JSON
function importUserData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonData = event.target.result;
                await importData(jsonData);
                
                // Перезагружаем профиль
                currentUser = await getData(STORES.USER, 'profile');
                alert('Данные успешно импортированы!');
                await renderProfileTab();
            } catch (error) {
                console.error('Ошибка импорта:', error);
                alert('Не удалось импортировать данные. Проверьте формат файла.');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Удаление всех данных
async function clearAllUserData() {
    if (!confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        return;
    }
    
    // Предлагаем сохранить данные перед удалением
    if (confirm('Хотите сохранить резервную копию перед удалением?')) {
        await exportUserData();
    }
    
    try {
        await clearAllData();
        currentUser = null;
        alert('Все данные удалены');
        showOnboarding();
    } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Не удалось удалить данные');
    }
}