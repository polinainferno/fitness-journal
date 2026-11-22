let currentCalendarDate = new Date();

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
        
        // ИСПРАВЛЕНИЕ БАГА ДАТ (Пункт 15): используем локальное время
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

// Новая функция для локальной даты (Пункт 15)
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Формат для отображения (Пункт 3)
function formatDateDisplay(dateStr) {
    const parts = dateStr.split('-');
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

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
                    <button onclick="removeExercise('${dateStr}', ${index})" class="delete-btn">Удалить</button>
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
            <button onclick="showExerciseSelector('${dateStr}')" style="width: 100%; margin-top: 16px;">+ Добавить упражнение</button>
        </div>
    `;
}

function renderSets(exercise) {
    if (!exercise.sets || exercise.sets.length === 0) return '';
    return exercise.sets.map((set, index) => {
        let metricsHTML = '';
        if (exercise.metricType === METRIC_TYPES.WEIGHT_REPS) metricsHTML = `${set.sets || 0} × ${set.reps || 0} × ${set.weight || 0} кг`;
        else if (exercise.metricType === METRIC_TYPES.TIME) metricsHTML = `${set.time || 0} сек`;
        else if (exercise.metricType === METRIC_TYPES.DISTANCE) metricsHTML = `${set.distance || 0} км`;
        else if (exercise.metricType === METRIC_TYPES.TIME_DISTANCE) metricsHTML = `${set.time || 0} сек / ${set.distance || 0} км`;
        else if (exercise.metricType === METRIC_TYPES.TIME_WEIGHT) metricsHTML = `${set.time || 0} сек × ${set.weight || 0} кг`;
        else if (exercise.metricType === METRIC_TYPES.WEIGHT_DISTANCE) metricsHTML = `${set.weight || 0} кг / ${set.distance || 0} км`;
        
        const ratingText = set.rating === 1 ? 'слишком легко' : set.rating === 2 ? 'идеально' : set.rating === 3 ? 'слишком сложно' : '';
        const ratingClass = set.rating === 1 ? 'rating-easy' : set.rating === 2 ? 'rating-perfect' : set.rating === 3 ? 'rating-hard' : '';
        
        return `
            <div class="set-row">
                <span>Подход ${index + 1}: ${metricsHTML}</span>
                <span class="rating-badge ${ratingClass}">${ratingText}</span>
            </div>
        `;
    }).join('');
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

async function showExerciseSelector(dateStr) {
    const container = document.getElementById('day-workouts-container');
    const allExercises = await getAllExercises();
    const grouped = {};
    allExercises.forEach(ex => {
        if (!grouped[ex.muscleGroup]) grouped[ex.muscleGroup] = [];
        grouped[ex.muscleGroup].push(ex);
    });
    
    let listHTML = '';
    for (const group in grouped) {
        listHTML += `<h4 style="margin: 16px 0 8px 0; color: var(--text-secondary); font-size: 0.9rem;">${group}</h4>`;
        grouped[group].forEach(ex => {
            listHTML += `<div class="list-item" onclick="selectExercise('${dateStr}', '${ex.id}')"><span>${ex.name}</span><span style="color: var(--text-secondary);">→</span></div>`;
        });
    }
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>Выберите упражнение</h3>
            ${listHTML}
            <button onclick="showCustomExerciseForm('${dateStr}')" style="width: 100%; margin-top: 16px; background-color: var(--bg-tertiary); color: var(--text-primary);">+ Создать своё</button>
            <button onclick="openDayWorkouts('${dateStr}')" style="width: 100%; margin-top: 8px; background-color: var(--bg-tertiary); color: var(--text-primary);">Отмена</button>
        </div>
    `;
}

async function selectExercise(dateStr, exerciseId) {
    const allExercises = await getAllExercises();
    const exercise = allExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    const lastExercise = await getLastWorkoutWithExercise(exerciseId, dateStr);
    const recommendation = generateRecommendation(lastExercise, exercise.metricType);
    showExerciseForm(dateStr, exercise, recommendation);
}

function showExerciseForm(dateStr, exercise, recommendation) {
    const container = document.getElementById('day-workouts-container');
    let formHTML = '';
    
    if (exercise.metricType === METRIC_TYPES.WEIGHT_REPS) {
        formHTML = `
            <div class="form-group"><label>Повторения</label><input type="number" id="set-reps" value="${recommendation ? recommendation[0].reps : 10}" min="1"></div>
            <div class="form-group"><label>Вес (кг)</label><input type="number" id="set-weight" value="${recommendation ? recommendation[0].weight : 20}" min="0" step="0.5"></div>
        `;
    } else if (exercise.metricType === METRIC_TYPES.TIME) {
        formHTML = `<div class="form-group"><label>Время (сек)</label><input type="number" id="set-time" value="${recommendation ? recommendation[0].time : 60}" min="1"></div>`;
    } else if (exercise.metricType === METRIC_TYPES.DISTANCE) {
        formHTML = `<div class="form-group"><label>Дистанция (км)</label><input type="number" id="set-distance" value="${recommendation ? recommendation[0].distance : 1}" min="0" step="0.1"></div>`;
    } else if (exercise.metricType === METRIC_TYPES.TIME_DISTANCE) {
        formHTML = `
            <div class="form-group"><label>Время (сек)</label><input type="number" id="set-time" value="${recommendation ? recommendation[0].time : 600}" min="1"></div>
            <div class="form-group"><label>Дистанция (км)</label><input type="number" id="set-distance" value="${recommendation ? recommendation[0].distance : 2}" min="0" step="0.1"></div>
        `;
    } else if (exercise.metricType === METRIC_TYPES.TIME_WEIGHT) {
        formHTML = `
            <div class="form-group"><label>Время (сек)</label><input type="number" id="set-time" value="${recommendation ? recommendation[0].time : 60}" min="1"></div>
            <div class="form-group"><label>Вес (кг)</label><input type="number" id="set-weight" value="${recommendation ? recommendation[0].weight : 20}" min="0" step="0.5"></div>
        `;
    } else if (exercise.metricType === METRIC_TYPES.WEIGHT_DISTANCE) {
        formHTML = `
            <div class="form-group"><label>Вес (кг)</label><input type="number" id="set-weight" value="${recommendation ? recommendation[0].weight : 20}" min="0" step="0.5"></div>
            <div class="form-group"><label>Дистанция (км)</label><input type="number" id="set-distance" value="${recommendation ? recommendation[0].distance : 1}" min="0" step="0.1"></div>
        `;
    }
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>${exercise.name}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">${exercise.muscleGroup}</p>
            <div id="sets-container">${formHTML}</div>
            <div class="form-group">
                <label>Оценка сложности</label>
                <select id="set-rating">
                    <option value="1">Слишком легко</option>
                    <option value="2" selected>Идеально</option>
                    <option value="3">Слишком сложно</option>
                </select>
            </div>
            <button onclick="addSetToExercise('${dateStr}', '${exercise.id}', '${exercise.name}', '${exercise.muscleGroup}', '${exercise.metricType}')" style="width: 100%; margin-top: 16px;">+ Добавить подход</button>
            <button onclick="openDayWorkouts('${dateStr}')" style="width: 100%; margin-top: 8px; background-color: var(--bg-tertiary); color: var(--text-primary);">Готово</button>
        </div>
    `;
}

async function addSetToExercise(dateStr, exerciseId, exerciseName, muscleGroup, metricType) {
    const newSet = {};
    if (metricType === METRIC_TYPES.WEIGHT_REPS) {
        newSet.sets = 1; // Всегда 1 подход за раз
        newSet.reps = parseInt(document.getElementById('set-reps').value);
        newSet.weight = parseFloat(document.getElementById('set-weight').value);
    } else if (metricType === METRIC_TYPES.TIME) {
        newSet.time = parseInt(document.getElementById('set-time').value);
    } else if (metricType === METRIC_TYPES.DISTANCE) {
        newSet.distance = parseFloat(document.getElementById('set-distance').value);
    } else if (metricType === METRIC_TYPES.TIME_DISTANCE) {
        newSet.time = parseInt(document.getElementById('set-time').value);
        newSet.distance = parseFloat(document.getElementById('set-distance').value);
    } else if (metricType === METRIC_TYPES.TIME_WEIGHT) {
        newSet.time = parseInt(document.getElementById('set-time').value);
        newSet.weight = parseFloat(document.getElementById('set-weight').value);
    } else if (metricType === METRIC_TYPES.WEIGHT_DISTANCE) {
        newSet.weight = parseFloat(document.getElementById('set-weight').value);
        newSet.distance = parseFloat(document.getElementById('set-distance').value);
    }
    newSet.rating = parseInt(document.getElementById('set-rating').value);
    
    let workout = await getData(STORES.WORKOUTS, dateStr);
    if (!workout) workout = { date: dateStr, exercises: [] };
    
    let exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
    if (!exercise) {
        exercise = { exerciseId: exerciseId, exerciseName: exerciseName, muscleGroup: muscleGroup, metricType: metricType, sets: [] };
        workout.exercises.push(exercise);
    }
    exercise.sets.push(newSet);
    await saveData(STORES.WORKOUTS, workout);
    await openDayWorkouts(dateStr);
    await renderCalendar();
}

function showCustomExerciseForm(dateStr) {
    const container = document.getElementById('day-workouts-container');
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>Создать своё упражнение</h3>
            <div class="form-group"><label>Название</label><input type="text" id="custom-ex-name" placeholder="Например, Выпады"></div>
            <div class="form-group">
                <label>Группа мышц</label>
                <select id="custom-ex-muscle">
                    <option value="Грудь">Грудь</option><option value="Спина">Спина</option><option value="Ноги">Ноги</option>
                    <option value="Плечи">Плечи</option><option value="Руки">Руки</option><option value="Кор">Кор</option>
                    <option value="Кардио">Кардио</option><option value="Другое">Другое</option>
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
            <button onclick="createCustomExercise('${dateStr}')" style="width: 100%; margin-top: 16px;">Создать</button>
            <button onclick="showExerciseSelector('${dateStr}')" style="width: 100%; margin-top: 8px; background-color: var(--bg-tertiary); color: var(--text-primary);">Назад</button>
        </div>
    `;
}

async function createCustomExercise(dateStr) {
    const name = document.getElementById('custom-ex-name').value.trim();
    const muscleGroup = document.getElementById('custom-ex-muscle').value;
    const metricType = document.getElementById('custom-ex-metric').value;
    if (!name) {
        showModal(`<h3>Ошибка</h3><p>Введите название</p><div class="modal-actions"><button onclick="closeModal()">Ок</button></div>`);
        return;
    }
    const newExercise = await addCustomExercise(name, muscleGroup, metricType);
    showExerciseForm(dateStr, newExercise, null);
}
