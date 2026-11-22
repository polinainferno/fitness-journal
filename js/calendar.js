// Логика календаря и тренировок

let currentCalendarDate = new Date();
let editingState = null; // Состояние открытой формы упражнения

async function renderWorkoutsTab() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="card calendar-card">
            <div class="calendar-header">
                <button onclick="changeMonth(-1)" class="icon-btn">←</button>
                <h3 id="calendar-month-year" style="margin: 0; font-size: 1.1rem;"></h3>
                <button onclick="changeMonth(1)" class="icon-btn">→</button>
            </div>
            <button onclick="goToToday()" class="today-btn">Сегодня</button>
            <div class="calendar-grid" id="calendar-grid"></div>
        </div>
        <div id="day-workouts-container"></div>
    `;
    await renderCalendar();
}

function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function goToToday() {
    currentCalendarDate = new Date();
    renderCalendar();
}

async function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    monthYearLabel.textContent = `${monthNames[month]} ${year}`;
    
    grid.innerHTML = '';
    
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    weekDays.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'weekday';
        dayEl.textContent = day;
        grid.appendChild(dayEl);
    });
    
    const allWorkouts = await getAllData(STORES.WORKOUTS);
    const workoutDates = new Set(allWorkouts.map(w => w.date));
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDay = firstDayOfMonth.getDay();
    if (startDay === 0) startDay = 7;
    for (let i = 1; i < startDay; i++) {
        grid.appendChild(document.createElement('div'));
    }
    
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const dateObj = new Date(year, month, day);
        dateObj.setHours(0, 0, 0, 0);
        const dateStr = formatDateLocal(dateObj);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayEl.appendChild(dayNumber);
        
        if (workoutDates.has(dateStr)) {
            const dot = document.createElement('div');
            dot.className = 'workout-dot';
            dayEl.appendChild(dot);
        }
        
        if (dateObj.getTime() === today.getTime()) {
            dayEl.classList.add('today');
        }
        
        const isFuture = dateObj > today;
        if (!isFuture) {
            dayEl.onclick = () => openDayWorkouts(dateStr);
        } else {
            dayEl.style.opacity = '0.3';
            dayEl.style.cursor = 'not-allowed';
        }
        
        grid.appendChild(dayEl);
    }
}

function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
    const parts = dateStr.split('-');
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

// === СПИСОК УПРАЖНЕНИЙ ЗА ДЕНЬ ===

async function openDayWorkouts(dateStr) {
    const container = document.getElementById('day-workouts-container');
    const workout = await getData(STORES.WORKOUTS, dateStr);
    
    let exercisesHTML = '';
    if (workout && workout.exercises && workout.exercises.length > 0) {
        exercisesHTML = workout.exercises.map((ex, index) => `
            <div class="card exercise-item">
                <div class="exercise-header">
                    <div>
                        <h4 style="margin: 0 0 4px 0;">${ex.exerciseName}</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${ex.muscleGroup}</p>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="editDayExercise('${dateStr}', ${index})" class="edit-btn">Изменить</button>
                        <button onclick="removeExercise('${dateStr}', ${index})" class="delete-btn">Удалить</button>
                    </div>
                </div>
                ${renderSets(ex)}
            </div>
        `).join('');
    } else {
        exercisesHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Нет упражнений</p>';
    }
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3 style="margin-bottom: 16px;">Тренировка: ${formatDateDisplay(dateStr)}</h3>
            ${exercisesHTML}
            <button onclick="openAddExerciseModal('${dateStr}')" style="width: 100%; margin-top: 16px;">+ Добавить упражнение</button>
        </div>
    `;
}

function renderSets(exercise) {
    if (!exercise.sets || exercise.sets.length === 0) return '';
    return exercise.sets.map((set, index) => `
        <div class="set-row">
            <span>Подход ${index + 1}: ${formatSetMetrics(exercise.metricType, set)}</span>
            <span class="rating-badge ${getRatingClass(set.rating)}">${getRatingText(set.rating)}</span>
        </div>
    `).join('');
}

function formatSetMetrics(metricType, set) {
    switch (metricType) {
        case METRIC_TYPES.WEIGHT_REPS: return `${set.reps || 0} повт × ${set.weight || 0} кг`;
        case METRIC_TYPES.TIME: return `${set.time || 0} сек`;
        case METRIC_TYPES.DISTANCE: return `${set.distance || 0} км`;
        case METRIC_TYPES.TIME_DISTANCE: return `${set.time || 0} сек / ${set.distance || 0} км`;
        case METRIC_TYPES.TIME_WEIGHT: return `${set.time || 0} сек × ${set.weight || 0} кг`;
        case METRIC_TYPES.WEIGHT_DISTANCE: return `${set.weight || 0} кг / ${set.distance || 0} км`;
        default: return '';
    }
}

function getRatingText(rating) {
    return rating === 1 ? 'слишком легко' : rating === 2 ? 'идеально' : rating === 3 ? 'слишком сложно' : '';
}

function getRatingClass(rating) {
    return rating === 1 ? 'rating-easy' : rating === 2 ? 'rating-perfect' : rating === 3 ? 'rating-hard' : '';
}

async function removeExercise(dateStr, exerciseIndex) {
    showConfirm('Удалить это упражнение из тренировки?', async () => {
        const workout = await getData(STORES.WORKOUTS, dateStr);
        if (workout && workout.exercises) {
            workout.exercises.splice(exerciseIndex, 1);
            await saveData(STORES.WORKOUTS, workout);
            await openDayWorkouts(dateStr);
            await renderCalendar();
        }
    });
}

// === ДОБАВЛЕНИЕ: АВТОДОПОЛНЕНИЕ (Пункт 4) ===

function openAddExerciseModal(dateStr) {
    showModal(`
        <h3>Добавить упражнение</h3>
        <div class="form-group">
            <label>Начните вводить название</label>
            <div class="autocomplete-wrapper">
                <input type="text" id="ac-input" placeholder="Например, жим..." autocomplete="off">
                <div class="autocomplete-dropdown" id="ac-dropdown"></div>
            </div>
        </div>
        <div class="modal-actions">
            <button class="secondary" onclick="closeModal()">Отмена</button>
        </div>
    `);
    
    const input = document.getElementById('ac-input');
    input.addEventListener('input', () => renderAutocomplete(dateStr));
    input.addEventListener('focus', () => renderAutocomplete(dateStr));
    setTimeout(() => input.focus(), 100);
}

async function renderAutocomplete(dateStr) {
    const input = document.getElementById('ac-input');
    const dropdown = document.getElementById('ac-dropdown');
    if (!input || !dropdown) return;
    
    const query = input.value.trim().toLowerCase();
    const all = await getAllExercises();
    const matches = query
        ? all.filter(ex => ex.name.toLowerCase().includes(query)).slice(0, 10)
        : all.slice(0, 10);
    
    if (query && matches.length === 0) {
        dropdown.innerHTML = `<div class="ac-item ac-create" onclick="startCreateCustom('${dateStr}')">Создать «${input.value.trim()}»</div>`;
        dropdown.style.display = 'block';
        return;
    }
    
    dropdown.innerHTML = matches.map(ex => `
        <div class="ac-item" onclick="pickExercise('${dateStr}', '${ex.id}')">
            <span>${ex.name}</span>
            <span class="ac-group">${ex.muscleGroup}</span>
        </div>
    `).join('');
    dropdown.style.display = 'block';
}

async function pickExercise(dateStr, exerciseId) {
    const all = await getAllExercises();
    const ex = all.find(e => e.id === exerciseId);
    if (!ex) return;
    closeModal();
    
    const last = await getLastWorkoutWithExercise(exerciseId, dateStr);
    const recommendation = generateRecommendation(last, ex.metricType);
    startExerciseForm(dateStr, ex, recommendation, []);
}

function startCreateCustom(dateStr) {
    const name = document.getElementById('ac-input').value.trim();
    closeModal();
    showCustomExerciseForm(dateStr, name);
}

// === СОЗДАНИЕ СВОЕГО УПРАЖНЕНИЯ ===

function showCustomExerciseForm(dateStr, presetName) {
    showModal(`
        <h3>Создать упражнение</h3>
        <div class="form-group">
            <label>Название</label>
            <input type="text" id="custom-ex-name" value="${presetName || ''}" placeholder="Например, Выпады с гантелями">
        </div>
        <div class="form-group">
            <label>Группа мышц</label>
            <select id="custom-ex-muscle">
                <option value="Грудь">Грудь</option>
                <option value="Спина">Спина</option>
                <option value="Ноги">Ноги</option>
                <option value="Ягодицы">Ягодицы</option>
                <option value="Плечи">Плечи</option>
                <option value="Руки">Руки</option>
                <option value="Икры">Икры</option>
                <option value="Кор">Кор</option>
                <option value="Кардио">Кардио</option>
                <option value="Другое">Другое</option>
            </select>
        </div>
        <div class="form-group">
            <label>Тип измерения</label>
            <select id="custom-ex-metric">
                <option value="${METRIC_TYPES.WEIGHT_REPS}">Повторения × вес</option>
                <option value="${METRIC_TYPES.TIME}">Время</option>
                <option value="${METRIC_TYPES.DISTANCE}">Дистанция</option>
                <option value="${METRIC_TYPES.TIME_DISTANCE}">Время + дистанция</option>
                <option value="${METRIC_TYPES.TIME_WEIGHT}">Время + вес</option>
                <option value="${METRIC_TYPES.WEIGHT_DISTANCE}">Вес + дистанция</option>
            </select>
        </div>
        <div class="modal-actions">
            <button class="secondary" onclick="closeModal()">Отмена</button>
            <button onclick="createCustomExercise('${dateStr}')">Создать</button>
        </div>
    `);
}

async function createCustomExercise(dateStr) {
    const name = document.getElementById('custom-ex-name').value.trim();
    const muscleGroup = document.getElementById('custom-ex-muscle').value;
    const metricType = document.getElementById('custom-ex-metric').value;
    
    if (!name) {
        showModal(`<h3>Ошибка</h3><p>Введите название упражнения</p><div class="modal-actions"><button onclick="closeModal()">Ок</button></div>`);
        return;
    }
    
    const ex = await addCustomExercise(name, muscleGroup, metricType);
    closeModal();
    startExerciseForm(dateStr, ex, null, []);
}

// === ФОРМА ПОДХОДОВ (Пункты 4, 5) ===

function startExerciseForm(dateStr, exercise, recommendation, existingSets) {
    editingState = {
        dateStr: dateStr,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        metricType: exercise.metricType,
        sets: existingSets ? JSON.parse(JSON.stringify(existingSets)) : [],
        editingIndex: null
    };
    renderExerciseForm(recommendation);
}

function renderExerciseForm(recommendation) {
    const defaultValues = recommendation ? recommendation[0] : null;
    
    showModal(`
        <h3>${editingState.exerciseName}</h3>
        <p class="ex-form-subtitle">${editingState.muscleGroup}</p>
        
        <div class="sets-list" id="sets-list">${renderSetsList()}</div>
        
        <div class="new-set-block">
            <div id="set-inputs">${renderSetInputs(editingState.metricType, defaultValues)}</div>
            <div class="form-group">
                <label>Оценка сложности</label>
                <select id="set-rating">
                    <option value="1">Слишком легко</option>
                    <option value="2" selected>Идеально</option>
                    <option value="3">Слишком сложно</option>
                </select>
            </div>
            <button id="add-set-btn" onclick="handleSetSubmit()" style="width: 100%;">+ Добавить подход</button>
            ${editingState.editingIndex !== null ? `<button class="secondary" onclick="cancelSetEdit()" style="width: 100%; margin-top: 8px;">Отменить редактирование</button>` : ''}
        </div>
        
        <div class="modal-actions">
            <button class="secondary" onclick="cancelExerciseForm()">Отмена</button>
            <button onclick="finishExerciseForm()">Готово</button>
        </div>
    `);
}

function renderSetInputs(metricType, values) {
    const v = values || {};
    switch (metricType) {
        case METRIC_TYPES.WEIGHT_REPS:
            return `
                <div class="form-group"><label>Повторения</label><input type="number" id="set-reps" value="${v.reps ?? 10}" min="1"></div>
                <div class="form-group"><label>Вес (кг)</label><input type="number" id="set-weight" value="${v.weight ?? 20}" min="0" step="0.5"></div>`;
        case METRIC_TYPES.TIME:
            return `<div class="form-group"><label>Время (сек)</label><input type="number" id="set-time" value="${v.time ?? 60}" min="1"></div>`;
        case METRIC_TYPES.DISTANCE:
            return `<div class="form-group"><label>Дистанция (км)</label><input type="number" id="set-distance" value="${v.distance ?? 1}" min="0" step="0.1"></div>`;
        case METRIC_TYPES.TIME_DISTANCE:
            return `
                <div class="form-group"><label>Время (сек)</label><input type="number" id="set-time" value="${v.time ?? 600}" min="1"></div>
                <div class="form-group"><label>Дистанция (км)</label><input type="number" id="set-distance" value="${v.distance ?? 2}" min="0" step="0.1"></div>`;
        case METRIC_TYPES.TIME_WEIGHT:
            return `
                <div class="form-group"><label>Время (сек)</label><input type="number" id="set-time" value="${v.time ?? 60}" min="1"></div>
                <div class="form-group"><label>Вес (кг)</label><input type="number" id="set-weight" value="${v.weight ?? 20}" min="0" step="0.5"></div>`;
        case METRIC_TYPES.WEIGHT_DISTANCE:
            return `
                <div class="form-group"><label>Вес (кг)</label><input type="number" id="set-weight" value="${v.weight ?? 20}" min="0" step="0.5"></div>
                <div class="form-group"><label>Дистанция (км)</label><input type="number" id="set-distance" value="${v.distance ?? 1}" min="0" step="0.1"></div>`;
        default:
            return '';
    }
}

function renderSetsList() {
    if (editingState.sets.length === 0) {
        return '<p class="sets-empty">Подходы ещё не добавлены</p>';
    }
    return editingState.sets.map((set, index) => `
        <div class="set-row ${editingState.editingIndex === index ? 'editing' : ''}">
            <span>Подход ${index + 1}: ${formatSetMetrics(editingState.metricType, set)}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
                <span class="rating-badge ${getRatingClass(set.rating)}">${getRatingText(set.rating)}</span>
                <button class="tiny-btn" onclick="startSetEdit(${index})">Изменить</button>
                <button class="tiny-btn delete" onclick="deleteSet(${index})">Удалить</button>
            </div>
        </div>
    `).join('');
}

function collectSetFromInputs() {
    const newSet = {};
    const mt = editingState.metricType;
    if (mt === METRIC_TYPES.WEIGHT_REPS) {
        newSet.reps = parseInt(document.getElementById('set-reps').value) || 0;
        newSet.weight = parseFloat(document.getElementById('set-weight').value) || 0;
    } else if (mt === METRIC_TYPES.TIME) {
        newSet.time = parseInt(document.getElementById('set-time').value) || 0;
    } else if (mt === METRIC_TYPES.DISTANCE) {
        newSet.distance = parseFloat(document.getElementById('set-distance').value) || 0;
    } else if (mt === METRIC_TYPES.TIME_DISTANCE) {
        newSet.time = parseInt(document.getElementById('set-time').value) || 0;
        newSet.distance = parseFloat(document.getElementById('set-distance').value) || 0;
    } else if (mt === METRIC_TYPES.TIME_WEIGHT) {
        newSet.time = parseInt(document.getElementById('set-time').value) || 0;
        newSet.weight = parseFloat(document.getElementById('set-weight').value) || 0;
    } else if (mt === METRIC_TYPES.WEIGHT_DISTANCE) {
        newSet.weight = parseFloat(document.getElementById('set-weight').value) || 0;
        newSet.distance = parseFloat(document.getElementById('set-distance').value) || 0;
    }
    newSet.rating = parseInt(document.getElementById('set-rating').value);
    return newSet;
}

function handleSetSubmit() {
    const newSet = collectSetFromInputs();
    
    if (editingState.editingIndex !== null) {
        editingState.sets[editingState.editingIndex] = newSet;
        editingState.editingIndex = null;
    } else {
        editingState.sets.push(newSet);
    }
    
    // Форма НЕ закрывается — обновляем только список подходов (Пункт 4)
    document.getElementById('sets-list').innerHTML = renderSetsList();
    document.getElementById('set-inputs').innerHTML = renderSetInputs(editingState.metricType, null);
    document.getElementById('set-rating').value = '2';
    document.getElementById('add-set-btn').textContent = '+ Добавить подход';
    
    // Убираем кнопку "Отменить редактирование", если она была
    const cancelBtn = document.querySelector('.new-set-block .secondary');
    if (cancelBtn) cancelBtn.remove();
}

function startSetEdit(index) {
    editingState.editingIndex = index;
    const set = editingState.sets[index];
    
    document.getElementById('set-inputs').innerHTML = renderSetInputs(editingState.metricType, set);
    document.getElementById('set-rating').value = set.rating;
    document.getElementById('add-set-btn').textContent = 'Сохранить изменения';
    
    // Добавляем кнопку отмены редактирования
    const block = document.querySelector('.new-set-block');
    if (!block.querySelector('.cancel-edit-btn')) {
        const btn = document.createElement('button');
        btn.className = 'secondary cancel-edit-btn';
        btn.style.cssText = 'width: 100%; margin-top: 8px;';
        btn.textContent = 'Отменить редактирование';
        btn.onclick = cancelSetEdit;
        block.appendChild(btn);
    }
    
    document.getElementById('sets-list').innerHTML = renderSetsList();
}

function cancelSetEdit() {
    editingState.editingIndex = null;
    document.getElementById('set-inputs').innerHTML = renderSetInputs(editingState.metricType, null);
    document.getElementById('set-rating').value = '2';
    document.getElementById('add-set-btn').textContent = '+ Добавить подход';
    const cancelBtn = document.querySelector('.cancel-edit-btn');
    if (cancelBtn) cancelBtn.remove();
    document.getElementById('sets-list').innerHTML = renderSetsList();
}

function deleteSet(index) {
    editingState.sets.splice(index, 1);
    if (editingState.editingIndex === index) {
        cancelSetEdit();
    } else if (editingState.editingIndex !== null && index < editingState.editingIndex) {
        editingState.editingIndex--;
    }
    document.getElementById('sets-list').innerHTML = renderSetsList();
}

async function finishExerciseForm() {
    const { dateStr, exerciseId, exerciseName, muscleGroup, metricType, sets } = editingState;
    
    let workout = await getData(STORES.WORKOUTS, dateStr);
    if (!workout) workout = { date: dateStr, exercises: [] };
    
    let exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
    if (!exercise) {
        exercise = { exerciseId, exerciseName, muscleGroup, metricType, sets: [] };
        workout.exercises.push(exercise);
    }
    exercise.sets = sets;
    
    await saveData(STORES.WORKOUTS, workout);
    
    editingState = null;
    closeModal();
    await openDayWorkouts(dateStr);
    await renderCalendar();
}

function cancelExerciseForm() {
    editingState = null;
    closeModal();
}

// === РЕДАКТИРОВАНИЕ УПРАЖНЕНИЯ В ДНЕ (Пункт 5) ===

async function editDayExercise(dateStr, index) {
    const workout = await getData(STORES.WORKOUTS, dateStr);
    const ex = workout.exercises[index];
    startExerciseForm(
        dateStr,
        { id: ex.exerciseId, name: ex.exerciseName, muscleGroup: ex.muscleGroup, metricType: ex.metricType },
        null,
        ex.sets
    );
}
