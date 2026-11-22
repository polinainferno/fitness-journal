// Логика онбординга (регистрации)

let onboardingData = {}; // Временное хранилище данных между шагами

// Показываем первый шаг онбординга
function renderOnboardingStep1() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="card" style="max-width: 500px; margin: 40px auto;">
            <h2>Расскажите о себе</h2>
            <div class="form-group">
                <label>Ваше имя</label>
                <input type="text" id="ob-name" placeholder="Например, Анна" required>
            </div>
            <div class="form-group">
                <label>Пол</label>
                <select id="ob-gender">
                    <option value="female">Женский</option>
                    <option value="male">Мужской</option>
                </select>
            </div>
            <div class="form-group">
                <label>Дата рождения</label>
                <input type="date" id="ob-dob" required>
            </div>
            <button onclick="goToOnboardingStep2()" style="width: 100%; margin-top: 10px;">Продолжить</button>
        </div>
    `;
}

// Переход ко второму шагу с проверкой первого
function goToOnboardingStep2() {
    const name = document.getElementById('ob-name').value.trim();
    const gender = document.getElementById('ob-gender').value;
    const dob = document.getElementById('ob-dob').value;

    if (!name || !dob) {
        alert('Пожалуйста, заполните имя и дату рождения');
        return;
    }

    onboardingData = { name, gender, dob };
    renderOnboardingStep2();
}

// Показываем второй шаг онбординга
function renderOnboardingStep2() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="card" style="max-width: 500px; margin: 40px auto;">
            <h2>Ваши цели и параметры</h2>
            <div class="form-group">
                <label>Цель</label>
                <select id="ob-goal">
                    <option value="lose">Похудеть</option>
                    <option value="gain">Набрать мышечную массу</option>
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
                <label>Целевой вес (кг)</label>
                <input type="number" id="ob-target-weight" placeholder="60" required>
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

    // Добавляем слушатель для живой проверки ИМТ при вводе целевого веса
    document.getElementById('ob-target-weight').addEventListener('input', checkBMI);
    document.getElementById('ob-height').addEventListener('input', checkBMI);
}

// Проверка ИМТ в реальном времени
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

// Завершение онбординга и сохранение в базу
async function finishOnboarding() {
    const goal = document.getElementById('ob-goal').value;
    const height = parseFloat(document.getElementById('ob-height').value);
    const currentWeight = parseFloat(document.getElementById('ob-current-weight').value);
    const targetWeight = parseFloat(document.getElementById('ob-target-weight').value);

    if (!height || !currentWeight || !targetWeight) {
        alert('Пожалуйста, заполните все поля с параметрами');
        return;
    }

    const profile = {
        id: 'profile', // Ключ для хранилища
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
        currentUser = profile; // Обновляем глобальную переменную
        showMainApp(); // Переходим в главное приложение
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        alert('Не удалось сохранить данные. Попробуйте ещё раз.');
    }
}