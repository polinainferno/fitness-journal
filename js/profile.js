// Логика профиля и настроек

// Правильное склонение возраста (Пункт 9)
function getAgeDeclension(age) {
    const lastTwoDigits = age % 100;
    const lastDigit = age % 10;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'лет';
    if (lastDigit === 1) return 'год';
    if (lastDigit >= 2 && lastDigit <= 4) return 'года';
    return 'лет';
}

async function renderProfileTab() {
    const container = document.getElementById('main-content');
    
    if (!currentUser) {
        container.innerHTML = '<div class="card"><p>Профиль не загружен</p></div>';
        return;
    }
    
    const ageText = `${currentUser.age} ${getAgeDeclension(currentUser.age)}`;
    const goalText = currentUser.goal === 'lose' ? 'Похудеть' : currentUser.goal === 'gain' ? 'Набрать мышечную массу' : 'Пока не знаю';
    
    container.innerHTML = `
        <div class="card">
            <h2>Профиль</h2>
            <div class="profile-info">
                <div class="info-row"><span>Имя</span><span>${currentUser.name}</span></div>
                <div class="info-row"><span>Возраст</span><span>${ageText}</span></div>
                <div class="info-row"><span>Рост</span><span>${currentUser.height} см</span></div>
                <div class="info-row"><span>Цель</span><span>${goalText}</span></div>
                <div class="info-row"><span>Начальный вес</span><span>${currentUser.initialWeight || currentUser.currentWeight} кг</span></div>
                <div class="info-row"><span>Текущий вес</span><span>${currentUser.currentWeight} кг</span></div>
                ${currentUser.targetWeight ? `<div class="info-row"><span>Целевой вес</span><span>${currentUser.targetWeight} кг</span></div>` : ''}
            </div>
            
            <div class="profile-actions">
                <button onclick="showUpdateWeightModal()">Обновить текущий вес</button>
                <button onclick="showEditGoalModal()" class="secondary-btn">Изменить цель</button>
            </div>
        </div>
        
        <div class="card">
            <h3>График веса</h3>
            <div id="weight-chart" style="width: 100%; height: 200px; margin-top: 10px;"></div>
            <p id="no-weight-history" style="display: none; color: var(--text-secondary); text-align: center; font-size: 0.9rem;">Добавьте первое обновление веса, чтобы увидеть график</p>
        </div>
        
        <div class="card">
            <h3>Управление данными</h3>
            <button onclick="exportUserData()" style="width: 100%; margin-bottom: 12px;">Экспорт данных (JSON)</button>
            <button onclick="importUserData()" style="width: 100%; margin-bottom: 12px; background-color: var(--bg-tertiary); color: var(--text-primary);">Импорт данных (JSON)</button>
            <button onclick="clearAllUserData()" style="width: 100%; background-color: #ff3b30;">Удалить все данные</button>
        </div>
    `;
    
    renderWeightChart();
}

// Отрисовка графика веса
function renderWeightChart() {
    const history = currentUser.weightHistory || [];
    const chartContainer = document.getElementById('weight-chart');
    const noHistoryMsg = document.getElementById('no-weight-history');
    
    if (history.length === 0) {
        chartContainer.style.display = 'none';
        noHistoryMsg.style.display = 'block';
        return;
    }
    
    chartContainer.style.display = 'block';
    noHistoryMsg.style.display = 'none';
    
    // Простая отрисовка SVG
    const width = chartContainer.offsetWidth;
    const height = 200;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const weights = history.map(h => h.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const range = maxWeight - minWeight || 1;
    
    let svg = `<svg width="${width}" height="${height}">`;
    let pathD = '';
    
    history.forEach((point, index) => {
        const x = padding + (index / (history.length - 1 || 1)) * chartWidth;
        const y = padding + chartHeight - ((point.weight - minWeight) / range) * chartHeight;
        pathD += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        svg += `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"/>`;
    });
    
    svg += `<path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
    svg += `</svg>`;
    chartContainer.innerHTML = svg;
}

// Модальное окно обновления веса (Пункт 18)
function showUpdateWeightModal() {
    showModal(`
        <h3>Обновить текущий вес</h3>
        <div class="form-group">
            <label>Новый вес (кг)</label>
            <input type="number" id="new-weight" value="${currentUser.currentWeight}" step="0.1" min="20" max="300">
        </div>
        <div class="modal-actions">
            <button class="secondary" onclick="closeModal()">Отмена</button>
            <button onclick="updateWeight()">Сохранить</button>
        </div>
    `);
}

async function updateWeight() {
    const newWeight = parseFloat(document.getElementById('new-weight').value);
    if (!newWeight || newWeight < 20 || newWeight > 300) {
        showModal(`<h3>Ошибка</h3><p>Введите корректный вес</p><div class="modal-actions"><button onclick="closeModal()">Ок</button></div>`);
        return;
    }
    
    currentUser.currentWeight = newWeight;
    
    // Сохраняем историю веса для графика (Пункт 10)
    if (!currentUser.weightHistory) currentUser.weightHistory = [];
    if (!currentUser.initialWeight) currentUser.initialWeight = currentUser.currentWeight;
    
    const today = new Date().toISOString().split('T')[0];
    // Если вес обновляется несколько раз в день, перезаписываем последнюю запись
    const lastRecord = currentUser.weightHistory[currentUser.weightHistory.length - 1];
    if (lastRecord && lastRecord.date === today) {
        lastRecord.weight = newWeight;
    } else {
        currentUser.weightHistory.push({ date: today, weight: newWeight });
    }
    
    await saveData(STORES.USER, currentUser);
    closeModal();
    await renderProfileTab();
}

// Модальное окно изменения цели (Пункт 19)
function showEditGoalModal() {
    showModal(`
        <h3>Изменить цель</h3>
        <div class="form-group">
            <label>Цель</label>
            <select id="edit-goal">
                <option value="lose" ${currentUser.goal === 'lose' ? 'selected' : ''}>Похудеть</option>
                <option value="gain" ${currentUser.goal === 'gain' ? 'selected' : ''}>Набрать мышечную массу</option>
                <option value="unknown" ${currentUser.goal === 'unknown' ? 'selected' : ''}>Пока не знаю</option>
            </select>
        </div>
        <div class="form-group">
            <label>Целевой вес (кг) <span style="color: var(--text-secondary); font-size: 0.85rem;">(необязательно)</span></label>
            <input type="number" id="edit-target-weight" value="${currentUser.targetWeight || ''}" step="0.1">
        </div>
        <div class="modal-actions">
            <button class="secondary" onclick="closeModal()">Отмена</button>
            <button onclick="updateGoal()">Сохранить</button>
        </div>
    `);
}

async function updateGoal() {
    const newGoal = document.getElementById('edit-goal').value;
    const targetWeightVal = document.getElementById('edit-target-weight').value;
    const newTargetWeight = targetWeightVal ? parseFloat(targetWeightVal) : null;
    
    currentUser.goal = newGoal;
    currentUser.targetWeight = newTargetWeight;
    await saveData(STORES.USER, currentUser);
    closeModal();
    await renderProfileTab();
}

// Экспорт, импорт и удаление (с новыми модалками)
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
    }
}

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
                await importData(event.target.result);
                currentUser = await getData(STORES.USER, 'profile');
                showModal(`<h3>Успех</h3><p>Данные успешно импортированы!</p><div class="modal-actions"><button onclick="closeModal()">Ок</button></div>`);
                await renderProfileTab();
            } catch (error) {
                showModal(`<h3>Ошибка</h3><p>Не удалось импортировать данные</p><div class="modal-actions"><button onclick="closeModal()">Ок</button></div>`);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function clearAllUserData() {
    showConfirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.', async () => {
        showConfirm('Хотите сохранить резервную копию перед удалением?', async () => {
            await exportUserData();
            await performClear();
        }, async () => {
            await performClear();
        });
    });
}

async function performClear() {
    await clearAllData();
    currentUser = null;
    showOnboarding();
}
