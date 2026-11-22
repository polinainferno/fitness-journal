// Логика календаря и тренировок

let currentCalendarDate = new Date(); // Текущий отображаемый месяц

// Отрисовка вкладки "Тренировки"
async function renderWorkoutsTab() {
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="changeMonth(-1)" style="padding: 8px 12px;">←</button>
                <h3 id="calendar-month-year" style="margin: 0;"></h3>
                <button onclick="changeMonth(1)" style="padding: 8px 12px;">→</button>
            </div>
            <div class="calendar-grid" id="calendar-grid"></div>
        </div>
        <div id="day-workouts-container"></div>
    `;
    await renderCalendar();
}

// Переключение месяца
function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

// Отрисовка сетки календаря
async function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    monthYearLabel.textContent = `${monthNames[month]} ${year}`;
    
    grid.innerHTML = '';
    
    // Дни недели
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    weekDays.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.textContent = day;
        dayEl.style.color = 'var(--text-secondary)';
        dayEl.style.fontSize = '0.8rem';
        dayEl.style.textAlign = 'center';
        dayEl.style.fontWeight = '600';
        grid.appendChild(dayEl);
    });
    
    // Получаем все тренировки из базы
    const allWorkouts = await getAllData(STORES.WORKOUTS);
    const workoutDates = new Set(allWorkouts.map(w => w.date));
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Пустые ячейки до первого дня месяца (с учётом того, что неделя начинается с Пн)
    let startDay = firstDayOfMonth.getDay();
    if (startDay === 0) startDay = 7; // Воскресенье = 7
    for (let i = 1; i < startDay; i++) {
        grid.appendChild(document.createElement('div'));
    }
    
    // Дни месяца
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const dateObj = new Date(year, month, day);
        dateObj.setHours(0, 0, 0, 0);
        const dateStr = formatDate(dateObj);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        // Проверяем, есть ли тренировка в этот день
        if (workoutDates.has(dateStr)) {
            dayEl.classList.add('has-workout');
        }
        
        // Проверяем, сегодня ли это
        if (dateObj.getTime() === today.getTime()) {
            dayEl.classList.add('today');
        }
        
        // Проверяем, не будущий ли это день
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

// Форматирование даты в строку YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Открытие тренировок за конкретный день
async function openDayWorkouts(dateStr) {
    const container = document.getElementById('day-workouts-container');
    
    // Загружаем тренировку за этот день (если есть)
    const workout = await getData(STORES.WORKOUTS, dateStr);
    
    let exercisesHTML = '';
    if (workout && workout.exercises && workout.exercises.length > 0) {
        exercisesHTML = workout.exercises.map((ex, index) => {
            return `
                <div class="card" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <h3 style="margin: 0 0 4px 0;">${ex.exerciseName}</h3>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${ex.muscleGroup}</p>
                        </div>
                        <button onclick="removeExercise('${dateStr}', ${index})" style="padding: 6px 12px; font-size: 0.85rem; background-color: #ff3b30;">Удалить</button>
                    </div>
                    ${renderSets(ex)}
                </div>
            `;
        }).join('');
    } else {
        exercisesHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Нет упражнений. Добавьте первое!</p>';
    }
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>Тренировка: ${dateStr}</h3>
            ${exercisesHTML}
            <button onclick="showExerciseSelector('${dateStr}')" style="width: 100%; margin-top: 16px;">+ Добавить упражнение</button>
        </div>
    `;
}

// Отрисовка подходов
function renderSets(exercise) {
    if (!exercise.sets || exercise.sets.length === 0) return '';
    
    return exercise.sets.map((set, index) => {
        let metricsHTML = '';
        
        if (exercise.metricType === METRIC_TYPES.WEIGHT_REPS) {
            metricsHTML = `${set.sets || 0} × ${set.reps || 0} × ${set.weight || 0} кг`;
        } else if (exercise.metricType === METRIC_TYPES.TIME) {
            metricsHTML = `${set.time || 0} сек`;
        } else if (exercise.metricType === METRIC_TYPES.DISTANCE) {
            metricsHTML = `${set.distance || 0} км`;
        } else if (exercise.metricType === METRIC_TYPES.TIME_DISTANCE) {
            metricsHTML = `${set.time || 0} сек / ${set.distance || 0} км`;
        } else if (exercise.metricType === METRIC_TYPES.TIME_WEIGHT) {
            metricsHTML = `${set.time || 0} сек × ${set.weight || 0} кг`;
        } else if (exercise.metricType === METRIC_TYPES.WEIGHT_DISTANCE) {
            metricsHTML = `${set.weight || 0} кг / ${set.distance || 0} км`;
        }
        
        const ratingText = set.rating === 1 ? 'слишком легко' : set.rating === 2 ? 'идеально' : set.rating === 3 ? 'слишком сложно' : '';
        const ratingClass = set.rating === 1 ? 'rating-easy' : set.rating === 2 ? 'rating-perfect' : set.rating === 3 ? 'rating-hard' : '';
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border);">
                <span style="font-size: 0.9rem;">Подход ${index + 1}: ${metricsHTML}</span>
                <span class="rating-badge ${ratingClass}">${ratingText}</span>
            </div>
        `;
    }).join('');
}

// Удаление упражнения из тренировки
async function removeExercise(dateStr, exerciseIndex) {
    if (!confirm('Удалить это упражнение?')) return;
    
    const workout = await getData(STORES.WORKOUTS, dateStr);
    if (workout && workout.exercises) {
        workout.exercises.splice(exerciseIndex, 1);
        await saveData(STORES.WORKOUTS, workout);
        await openDayWorkouts(dateStr); // Обновляем вид
        await renderCalendar(); // Обновляем календарь
    }
}

// Показ списка упражнений для добавления
async function showExerciseSelector(dateStr) {
    const container = document.getElementById('day-workouts-container');
    const allExercises = await getAllExercises();
    
    // Группируем по мышечным группам
    const grouped = {};
    allExercises.forEach(ex => {
        if (!grouped[ex.muscleGroup]) {
            grouped[ex.muscleGroup] = [];
        }
        grouped[ex.muscleGroup].push(ex);
    });
    
    let listHTML = '';
    for (const group in grouped) {
        listHTML += `<h4 style="margin: 16px 0 8px 0; color: var(--text-secondary);">${group}</h4>`;
        grouped[group].forEach(ex => {
            listHTML += `
                <div class="list-item" onclick="selectExercise('${dateStr}', '${ex.id}')">
                    <span>${ex.name}</span>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">→</span>
                </div>
            `;
        });
    }
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>Выберите упражнение</h3>
            ${listHTML}
            <button onclick="showCustomExerciseForm('${dateStr}')" style="width: 100%; margin-top: 16px; background-color: var(--bg-tertiary); color: var(--text-primary);">+ Создать своё упражнение</button>
            <button onclick="openDayWorkouts('${dateStr}')" style="width: 100%; margin-top: 8px; background-color: var(--bg-tertiary); color: var(--text-primary);">Отмена</button>
        </div>
    `;
}

// Выбор упражнения и показ формы добавления
async function selectExercise(dateStr, exerciseId) {
    const allExercises = await getAllExercises();
    const exercise = allExercises.find(ex => ex.id === exerciseId);
    
    if (!exercise) {
        alert('Упражнение не найдено');
        return;
    }
    
    // Получаем рекомендацию на основе прошлой тренировки
    const lastExercise = await getLastWorkoutWithExercise(exerciseId, dateStr);
    const recommendation = generateRecommendation(lastExercise, exercise.metricType);
    
    showExerciseForm(dateStr, exercise, recommendation);
}

// Показ формы добавления упражнения
function showExerciseForm(dateStr, exercise, recommendation) {
    const container = document.getElementById('day-workouts-container');
    
    let formHTML = '';
    
    if (exercise.metricType === METRIC_TYPES.WEIGHT_REPS) {
        formHTML = `
            <div class="form-group">
                <label>Подходы</label>
                <input type="number" id="set-sets" value="${recommendation ? recommendation[0].sets : 3}" min="1" required>
            </div>
            <div class="form-group">
                <label>Повторения</label>
                <input type="number" id="set-reps" value="${recommendation ? recommendation[0].reps : 10}" min="1" required>
            </div>
            <div class="form-group">
                <label>Вес (кг)</label>
                <input type="number" id="set-weight" value="${recommendation ? recommendation[0].weight : 20}" min="0" step="0.5" required>
            </div>
        `;
    } else if (exercise.metricType === METRIC_TYPES.TIME) {
        formHTML = `
            <div class="form-group">
                <label>Время (сек)</label>
                <input type="number" id="set-time" value="${recommendation ? recommendation[0].time : 60}" min="1" required>
            </div>
        `;
    } else if (exercise.metricType === METRIC_TYPES.DISTANCE) {
        formHTML = `
            <div class="form-group">
                <label>Дистанция (км)</label>
                <input type="number" id="set-distance" value="${recommendation ? recommendation[0].distance : 1}" min="0" step="0.1" required>
            </div>
        `;
    } else if (exercise.metricType === METRIC_TYPES.TIME_DISTANCE) {
        formHTML = `
            <div class="form-group">
                <label>Время (сек)</label>
                <input type="number" id="set-time" value="${recommendation ? recommendation[0].time : 600}" min="1" required>
            </div>
            <div class="form-group">
                <label>Дистанция (км)</label>
                <input type="number" id="set-distance" value="${recommendation ? recommendation[0].distance : 2}" min="0" step="0.1" required>
            </div>
        `;
    } else if (exercise.metricType === METRIC_TYPES.TIME_WEIGHT) {
        formHTML = `
            <div class="form-group">
                <label>Время (сек)</label>
                <input type="number" id="set-time" value="${recommendation ? recommendation[0].time : 60}" min="1" required>
            </div>
            <div class="form-group">
                <label>Вес (кг)</label>
                <input type="number" id="set-weight" value="${recommendation ? recommendation[0].weight : 20}" min="0" step="0.5" required>
            </div>
        `;
    } else if (exercise.metricType === METRIC_TYPES.WEIGHT_DISTANCE) {
        formHTML = `
            <div class="form-group">
                <label>Вес (кг)</label>
                <input type="number" id="set-weight" value="${recommendation ? recommendation[0].weight : 20}" min="0" step="0.5" required>
            </div>
            <div class="form-group">
                <label>Дистанция (км)</label>
                <input type="number" id="set-distance" value="${recommendation ? recommendation[0].distance : 1}" min="0" step="0.1" required>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>${exercise.name}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">${exercise.muscleGroup}</p>
            
            <div id="sets-container">
                ${formHTML}
            </div>
            
            <div class="form-group">
                <label>Оценка сложности</label>
                <select id="set-rating">
                    <option value="1">Слишком легко</option>
                    <option value="2" selected>Идеально</option>
                    <option value="3">Слишком сложно</option>
                </select>
            </div>
            
            <button onclick="addSetToExercise('${dateStr}', '${exercise.id}', '${exercise.name}', '${exercise.muscleGroup}', '${exercise.metricType}')" style="width: 100%; margin-top: 16px;">+ Добавить подход</button>
            <button onclick="openDayWorkouts('${dateStr}')" style="width: 100%; margin-top: 8px; background-color: var(--bg-tertiary); color: var(--text-primary);">Отмена</button>
        </div>
    `;
}

// Добавление подхода к упражнению
async function addSetToExercise(dateStr, exerciseId, exerciseName, muscleGroup, metricType) {
    const newSet = {};
    
    if (metricType === METRIC_TYPES.WEIGHT_REPS) {
        newSet.sets = parseInt(document.getElementById('set-sets').value);
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
    
    // Загружаем или создаём тренировку
    let workout = await getData(STORES.WORKOUTS, dateStr);
    if (!workout) {
        workout = {
            date: dateStr,
            exercises: []
        };
    }
    
    // Ищем это упражнение в тренировке
    let exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
    
    if (!exercise) {
        // Создаём новое упражнение
        exercise = {
            exerciseId: exerciseId,
            exerciseName: exerciseName,
            muscleGroup: muscleGroup,
            metricType: metricType,
            sets: []
        };
        workout.exercises.push(exercise);
    }
    
    // Добавляем подход
    exercise.sets.push(newSet);
    
    // Сохраняем
    await saveData(STORES.WORKOUTS, workout);
    
    // Возвращаемся к просмотру дня
    await openDayWorkouts(dateStr);
    await renderCalendar();
}

// Показ формы создания своего упражнения
function showCustomExerciseForm(dateStr) {
    const container = document.getElementById('day-workouts-container');
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>Создать своё упражнение</h3>
            
            <div class="form-group">
                <label>Название</label>
                <input type="text" id="custom-ex-name" placeholder="Например, Выпады с гантелями" required>
            </div>
            
            <div class="form-group">
                <label>Группа мышц</label>
                <select id="custom-ex-muscle">
                    <option value="Грудь">Грудь</option>
                    <option value="Спина">Спина</option>
                    <option value="Ноги">Ноги</option>
                    <option value="Плечи">Плечи</option>
                    <option value="Руки">Руки</option>
                    <option value="Кор">Кор</option>
                    <option value="Кардио">Кардио</option>
                    <option value="Другое">Другое</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Тип измерения</label>
                <select id="custom-ex-metric">
                    <option value="${METRIC_TYPES.WEIGHT_REPS}">Подходы × повторения × вес</option>
                    <option value="${METRIC_TYPES.TIME}">Время</option>
                    <option value="${METRIC_TYPES.DISTANCE}">Дистанция</option>
                    <option value="${METRIC_TYPES.TIME_DISTANCE}">Время + дистанция</option>
                    <option value="${METRIC_TYPES.TIME_WEIGHT}">Время + вес</option>
                    <option value="${METRIC_TYPES.WEIGHT_DISTANCE}">Вес + дистанция</option>
                </select>
            </div>
            
            <button onclick="createCustomExercise('${dateStr}')" style="width: 100%; margin-top: 16px;">Создать и добавить</button>
            <button onclick="showExerciseSelector('${dateStr}')" style="width: 100%; margin-top: 8px; background-color: var(--bg-tertiary); color: var(--text-primary);">Назад</button>
        </div>
    `;
}

// Создание своего упражнения и переход к добавлению подходов
async function createCustomExercise(dateStr) {
    const name = document.getElementById('custom-ex-name').value.trim();
    const muscleGroup = document.getElementById('custom-ex-muscle').value;
    const metricType = document.getElementById('custom-ex-metric').value;
    
    if (!name) {
        alert('Введите название упражнения');
        return;
    }
    
    try {
        // Создаём упражнение в базе
        const newExercise = await addCustomExercise(name, muscleGroup, metricType);
        
        // Сразу показываем форму добавления подходов для этого упражнения
        showExerciseForm(dateStr, newExercise, null);
    } catch (error) {
        console.error('Ошибка создания упражнения:', error);
        alert('Не удалось создать упражнение');
    }
}