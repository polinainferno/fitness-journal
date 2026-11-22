// Логика прогресса и графиков

// Получить список всех упражнений, которые пользователь когда-либо выполнял
async function getAllPerformedExercises() {
    const allWorkouts = await getAllData(STORES.WORKOUTS);
    const exerciseMap = new Map();
    
    allWorkouts.forEach(workout => {
        if (workout.exercises) {
            workout.exercises.forEach(ex => {
                if (!exerciseMap.has(ex.exerciseId)) {
                    exerciseMap.set(ex.exerciseId, {
                        id: ex.exerciseId,
                        name: ex.exerciseName,
                        muscleGroup: ex.muscleGroup,
                        metricType: ex.metricType
                    });
                }
            });
        }
    });
    
    return Array.from(exerciseMap.values());
}

// Получить данные для графика по конкретному упражнению
async function getExerciseProgressData(exerciseId) {
    const allWorkouts = await getAllData(STORES.WORKOUTS);
    
    // Сортируем по дате (от старых к новым)
    allWorkouts.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const dataPoints = [];
    
    allWorkouts.forEach(workout => {
        if (workout.exercises) {
            const exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
            if (exercise && exercise.sets && exercise.sets.length > 0) {
                let value = 0;
                
                // Для силовых — максимальный объём (подходы × повторения × вес)
                if (exercise.metricType === METRIC_TYPES.WEIGHT_REPS) {
                    const maxVolume = Math.max(...exercise.sets.map(s => {
                        return (s.sets || 1) * (s.reps || 1) * (s.weight || 0);
                    }));
                    value = maxVolume;
                }
                // Для кардио — максимальная дистанция
                else if (exercise.metricType === METRIC_TYPES.DISTANCE || 
                         exercise.metricType === METRIC_TYPES.TIME_DISTANCE ||
                         exercise.metricType === METRIC_TYPES.WEIGHT_DISTANCE) {
                    value = Math.max(...exercise.sets.map(s => s.distance || 0));
                }
                // Для времени — максимальное время
                else if (exercise.metricType === METRIC_TYPES.TIME || 
                         exercise.metricType === METRIC_TYPES.TIME_WEIGHT) {
                    value = Math.max(...exercise.sets.map(s => s.time || 0));
                }
                
                if (value > 0) {
                    dataPoints.push({
                        date: workout.date,
                        value: value
                    });
                }
            }
        }
    });
    
    return dataPoints;
}

// Отрисовка вкладки "Прогресс"
async function renderProgressTab() {
    const container = document.getElementById('tab-content');
    const exercises = await getAllPerformedExercises();
    
    if (exercises.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 60px 20px;">
                <h2>Пока нет данных</h2>
                <p style="color: var(--text-secondary);">Добавьте первую тренировку, чтобы увидеть прогресс</p>
            </div>
        `;
        return;
    }
    
    let listHTML = exercises.map(ex => `
        <div class="list-item" onclick="showExerciseProgress('${ex.id}', '${ex.name}')">
            <div>
                <div style="font-weight: 500;">${ex.name}</div>
                <div style="color: var(--text-secondary); font-size: 0.85rem;">${ex.muscleGroup}</div>
            </div>
            <span style="color: var(--text-secondary);">→</span>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="card">
            <h2>Прогресс упражнений</h2>
            <div class="list">
                ${listHTML}
            </div>
        </div>
        <div id="exercise-progress-container"></div>
    `;
}

// Показать прогресс конкретного упражнения
async function showExerciseProgress(exerciseId, exerciseName) {
    const container = document.getElementById('exercise-progress-container');
    const dataPoints = await getExerciseProgressData(exerciseId);
    
    if (dataPoints.length === 0) {
        container.innerHTML = '<div class="card"><p>Нет данных для графика</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3>${exerciseName}</h3>
            <div id="progress-chart" style="width: 100%; height: 300px;"></div>
        </div>
    `;
    
    renderProgressChart(dataPoints);
}

// Отрисовка SVG графика
function renderProgressChart(dataPoints) {
    const chartContainer = document.getElementById('progress-chart');
    const width = chartContainer.offsetWidth;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const minValue = Math.min(...dataPoints.map(d => d.value));
    
    const xScale = (index) => padding.left + (index / (dataPoints.length - 1 || 1)) * chartWidth;
    const yScale = (value) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    
    // Создаём SVG
    let svg = `<svg width="${width}" height="${height}" style="overflow: visible;">`;
    
    // Сетка и оси
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (i / gridLines) * chartHeight;
        const value = maxValue - (i / gridLines) * (maxValue - minValue);
        svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4,4"/>`;
        svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="var(--text-secondary)" font-size="11">${Math.round(value)}</text>`;
    }
    
    // Линия графика
    let pathD = '';
    dataPoints.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.value);
        pathD += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    
    svg += `<path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    
    // Точки на графике
    dataPoints.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.value);
        svg += `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)" stroke="var(--bg-primary)" stroke-width="2"/>`;
    });
    
    // Подписи дат (каждая 3-я точка или все, если точек мало)
    const step = dataPoints.length > 10 ? Math.ceil(dataPoints.length / 5) : 1;
    dataPoints.forEach((point, index) => {
        if (index % step === 0 || index === dataPoints.length - 1) {
            const x = xScale(index);
            const date = new Date(point.date);
            const label = `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
            svg += `<text x="${x}" y="${height - 10}" text-anchor="middle" fill="var(--text-secondary)" font-size="11">${label}</text>`;
        }
    });
    
    svg += `</svg>`;
    
    chartContainer.innerHTML = svg;
}