// Логика онбординга (регистрации)

let onboardingData = {};

function renderOnboardingStep1() {
    const container = document.getElementById('main-content') || document.getElementById('view-container');
    container.innerHTML = `
        <div class="card" style="max-width: 500px; margin: 40px auto;">
            <h2>Расскажите о себе</h2>
            <div class="form-group">
                <label>Ваше имя</label>
                <input type="text" id="ob-name" placeholder="Например, Анна" required>
                <div class="field-error" id="error-name"></div>
            </div>
            <div class="form-group">
                <label>Пол</label>
                <select id="ob-gender" onchange="updateNamePlaceholder()">
                    <option value="female">Женский</option>
                    <option value="male">Мужской</option>
                </select>
            </div>
            <div class="form-group">
                <label>Дата рождения</label>
                <input type="date" id="ob-dob" required>
                <div class="field-error" id="error-dob"></div>
            </div>
            <button onclick="goToOnboardingStep2()" style="width: 100%; margin-top: 10px;">Продолжить</button>
        </div>
    `;
}

// Обновление плейсхолдера в зависимости от пола
function updateNamePlaceholder() {
    const gender = document.getElementById('ob-gender').value;
    const nameInput = document.getElementById('ob-name');
    if (gender === 'male') {
        nameInput.placeholder = 'Например, Дмитрий';
    } else {
        nameInput.placeholder = 'Например, Анна';
    }
}

function goToOnboardingStep2() {
    const name = document.getElementById('ob-name').value.trim();
    const gender = document.getElementById('ob-gender').value;
    const dob = document.getElementById('ob-dob').value;

    // Проверяем поля и показываем ошибки
    let hasErrors = false;
    
    const errorName = document.getElementById('error-name');
    const errorDob = document.getElementById('error-dob');
    
    if (errorName) errorName.textContent = '';
    if (errorDob) errorDob.textContent = '';

    if (!name) {
        if (errorName) errorName.textContent = 'Пожалуйста, заполните имя';
        hasErrors = true;
    }

    if (!dob) {
        if (errorDob) errorDob.textContent = 'Пожалуйста, заполните дату рождения';
        hasErrors = true;
    }

    if (hasErrors) return;

    onboardingData = { name, gender, dob };
    renderOnboardingStep2();
}

function renderOnboardingStep2() {
    const container = document.getElementById('main-content') || document.getElementById('view-container');
    container.innerHTML = `
        <div class="card" style="max-width: 500px; margin: 40px auto;">
            <h2>Ваши цели и параметры</h2>
            <div class="form-group">
                <label>Цель</label>
                <select id="ob-goal">
                    <option value="lose">Похудеть</option>
                    <option value="gain">Набрать мышечную массу</option>
                    <option value="unknown">Пока не знаю</option>
                </select>
            </div>
            <div class="form-group">
                <label>Рост (см)</label>
                <input type="number" id="ob-height" placeholder="170" required>
            </div>
            <div class="form-group">
                <label>Текущий вес (кг)</label>
                <input type="number" id="ob-current-weight" placeholder="65" required>
            </div>
            <div class="form-group">
                <label>Целевой вес (кг) <span style="color: var(--text-secondary); font-size: 0.85rem;">(необязательно)</span></label>
                <input type="number" id="ob-target-weight" placeholder="60">
            </div>
            
            <div id="bmi-warning" class="warning" style="display: none;">
                ⚠️ Внимание: ваш целевой ИМТ будет ниже 18.5 (недостаточная масса тела). 
                Пожалуйста, убедитесь, что эта цель безопасна для вашего здоровья. 
                Вы всё равно можете продолжить.
            </div>

            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button onclick="renderOnboardingStep1()" style="flex: 1; background-color: var(--bg-tertiary); color: var(--text-primary);">Назад</button>
                <button onclick="finishOnboarding()" style="flex: 2;">Завершить</button>
            </div>
        </div>
    `;

    document.getElementById('ob-target-weight').addEventListener('input', checkBMI);
    document.getElementById('ob-height').addEventListener('input', checkBMI);
}

function checkBMI() {
    const height = parseFloat(document.getElementById('ob-height').value);
    const targetWeight = parseFloat(document.getElementById('ob-target-weight').value);
    const warningEl = document.getElementById('bmi-warning');

    if (height > 0 && targetWeight > 0) {
        const bmi = calculateBMI(targetWeight, height);
        if (isBMILow(bmi)) {
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }
    } else {
        warningEl.style.display = 'none';
    }
}

async function finishOnboarding() {
    const goal = document.getElementById('ob-goal').value;
    const height = parseFloat(document.getElementById('ob-height').value);
    const currentWeight = parseFloat(document.getElementById('ob-current-weight').value);
    const targetWeightValue = document.getElementById('ob-target-weight').value;
    const targetWeight = targetWeightValue ? parseFloat(targetWeightValue) : null;

    if (!height || !currentWeight) {
        showModal(`
            <h3>Ошибка</h3>
            <p style="color: var(--text-secondary);">Пожалуйста, заполните рост и текущий вес</p>
            <div class="modal-actions">
                <button onclick="closeModal()">Понятно</button>
            </div>
        `);
        return;
    }

    const profile = {
        id: 'profile',
        name: onboardingData.name,
        gender: onboardingData.gender,
        dob: onboardingData.dob,
        age: calculateAge(onboardingData.dob),
        goal: goal,
        height: height,
        currentWeight: currentWeight,
        targetWeight: targetWeight,
        createdAt: new Date().toISOString()
    };

    try {
        await saveData(STORES.USER, profile);
        currentUser = profile;
        showMainApp();
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        showModal(`
            <h3>Ошибка</h3>
            <p style="color: var(--text-secondary);">Не удалось сохранить данные. Попробуйте ещё раз.</p>
            <div class="modal-actions">
                <button onclick="closeModal()">Понятно</button>
            </div>
        `);
    }
}
