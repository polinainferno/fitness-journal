// Логика прогресса и графиков

// Храним данные текущего графика для тултипа
let currentChartState = { dataPoints: [], metricType: '' };

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

// Получить данные для графика (теперь сохраняем и сами подходы для тултипа)
async function getExerciseProgressData(exerciseId, metricType) {
    const allWorkouts = await getAllData(STORES.WORKOUTS);
    allWorkouts.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const dataPoints = [];
    
    allWorkouts.forEach(workout => {
        if (workout.exercises) {
            const exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
            if (exercise && exercise.sets && exercise.sets.length > 0) {
                let value = 0;
                
                if (metricType === METRIC_TYPES.WEIGHT_REPS) {
                    const maxVolume = Math.max(...exercise.sets.map(s => (s.sets || 1) * (s.reps || 1) * (s.weight || 0)));
                    value = maxVolume;
                } else if (metricType === METRIC_TYPES.DISTANCE || metricType === METRIC_TYPES.TIME_DISTANCE || metricType === METRIC_TYPES.WEIGHT_DISTANCE) {
                    value = Math.max(...exercise.sets.map(s => s.distance || 0));
                } else if (metricType === METRIC_TYPES.TIME || metricType === METRIC_TYPES.TIME_WEIGHT) {
                    value = Math.max(...exercise.sets.map(s => s.time || 0));
                }
                
                if (value > 0) {
                    dataPoints.push({
                        date: workout.date,
                        value: value,
                        sets: exercise.sets // Сохраняем сырые данные для тултипа
                    });
                }
            }
        }
    });
    
    return dataPoints;
}

async function renderProgressTab() {
    const container = document.getElementById('main-content');
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
        <div class="list-item" onclick="showExerciseProgress('${ex.id}', '${ex.name}', '${ex.metricType}')">
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
            <div class="list">${listHTML}</div>
        </div>
        <div id="exercise-progress-container"></div>
    `;
}

async function showExerciseProgress(exerciseId, exerciseName, metricType) {
    const container = document.getElementById('exercise-progress-container');
    const dataPoints = await getExerciseProgressData(exerciseId, metricType);
    
    // Сохраняем состояние для тултипа
    currentChartState = { dataPoints: dataPoints, metricType: metricType };
    
    if (dataPoints.length === 0) {
        container.innerHTML = '<div class="card"><p>Нет данных для графика</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <h3 style="margin-bottom: 16px;">${exerciseName}</h3>
            <div id="progress-chart" style="width: 100%; height: 300px; position: relative;"></div>
            <div id="chart-tooltip" class="chart-tooltip"></div>
        </div>
    `;
    
    renderProgressChart();
}

// Отрисовка SVG графика без цифр на оси Y
function renderProgressChart() {
    const chartContainer = document.getElementById('progress-chart');
    const tooltip = document.getElementById('chart-tooltip');
    tooltip.style.display = 'none';
    
    const width = chartContainer.offsetWidth;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 20 }; // Убрали отступ слева, так как нет цифр
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const dataPoints = currentChartState.dataPoints;
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const minValue = Math.min(...dataPoints.map(d => d.value));
    
    const xScale = (index) => padding.left + (index / (dataPoints.length - 1 || 1)) * chartWidth;
    const yScale = (value) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    
    let svg = `<svg width="${width}" height="${height}" style="overflow: visible;">`;
    
    // Сетка (БЕЗ ПОДПИСЕЙ)
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (i / gridLines) * chartHeight;
        svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4,4"/>`;
    }
    
    // Линия графика
    let pathD = '';
    dataPoints.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.value);
        pathD += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    
    svg += `<path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    
    // Точки на графике (кликабельные)
    dataPoints.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.value);
        svg += `<circle cx="${x}" cy="${y}" r="6" fill="var(--accent)" stroke="var(--bg-primary)" stroke-width="2" style="cursor: pointer;" onclick="showPointTooltip(${index})"/>`;
    });
    
    // Подписи дат на оси X
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

// Показ подробной информации при нажатии на точку
function showPointTooltip(index) {
    const point = currentChartState.dataPoints[index];
    const tooltip = document.getElementById('chart-tooltip');
    const metricType = currentChartState.metricType;
    
    const date = new Date(point.date);
    const dateStr = `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    let detailsHTML = `<strong>${dateStr}</strong>`;
    
    point.sets.forEach((set, i) => {
        let metrics = '';
        if (metricType === METRIC_TYPES.WEIGHT_REPS) metrics = `${set.reps} повт × ${set.weight} кг`;
        else if (metricType === METRIC_TYPES.TIME) metrics = `${set.time} сек`;
        else if (metricType === METRIC_TYPES.DISTANCE) metrics = `${set.distance} км`;
        else if (metricType === METRIC_TYPES.TIME_DISTANCE) metrics = `${set.time} сек / ${set.distance} км`;
        else if (metricType === METRIC_TYPES.TIME_WEIGHT) metrics = `${set.time} сек × ${set.weight} кг`;
        else if (metricType === METRIC_TYPES.WEIGHT_DISTANCE) metrics = `${set.weight} кг / ${set.distance} км`;
        
        detailsHTML += `<div style="margin-top: 4px; color: var(--text-secondary);">Подход ${i + 1}: ${metrics}</div>`;
    });
    
    tooltip.innerHTML = detailsHTML;
    tooltip.style.display = 'block';
}
