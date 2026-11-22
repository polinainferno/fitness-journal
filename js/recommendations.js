// Логика рекомендаций на основе прошлых тренировок

// Получить последнюю тренировку с данным упражнением
async function getLastWorkoutWithExercise(exerciseId, currentDateStr) {
    const allWorkouts = await getAllData(STORES.WORKOUTS);
    
    // Сортируем по дате (от новых к старым)
    allWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Ищем последнюю тренировку до текущей даты, где есть это упражнение
    for (const workout of allWorkouts) {
        if (workout.date < currentDateStr && workout.exercises) {
            const exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
            if (exercise) {
                return exercise;
            }
        }
    }
    
    return null;
}

// Генерация рекомендации на основе прошлой оценки
function generateRecommendation(lastExercise, metricType) {
    if (!lastExercise || !lastExercise.sets || lastExercise.sets.length === 0) {
        return null; // Нет данных для рекомендации
    }
    
    // Анализируем оценки подходов
    const ratings = lastExercise.sets.map(s => s.rating);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    
    // Копируем последние показатели
    const recommended = JSON.parse(JSON.stringify(lastExercise.sets));
    
    // Если средняя оценка "слишком легко" (1)
    if (avgRating < 1.5) {
        recommended.forEach(set => {
            if (metricType === METRIC_TYPES.WEIGHT_REPS) {
                set.weight = Math.round(set.weight * 1.075); // +7.5% к весу
            } else if (metricType === METRIC_TYPES.TIME) {
                set.time = set.time + 15; // +15 секунд
            } else if (metricType === METRIC_TYPES.TIME_DISTANCE || 
                       metricType === METRIC_TYPES.WEIGHT_DISTANCE) {
                if (set.distance) set.distance = Math.round(set.distance * 1.05); // +5% к дистанции
            }
        });
    }
    // Если средняя оценка "идеально" (2) — оставляем как есть
    // Если средняя оценка "слишком сложно" (3)
    else if (avgRating > 2.5) {
        recommended.forEach(set => {
            if (metricType === METRIC_TYPES.WEIGHT_REPS) {
                set.weight = Math.round(set.weight * 0.925); // -7.5% к весу
            } else if (metricType === METRIC_TYPES.TIME) {
                set.time = Math.max(15, set.time - 15); // -15 секунд (минимум 15 сек)
            } else if (metricType === METRIC_TYPES.TIME_DISTANCE || 
                       metricType === METRIC_TYPES.WEIGHT_DISTANCE) {
                if (set.distance) set.distance = Math.round(set.distance * 0.95); // -5% к дистанции
            }
        });
    }
    
    return recommended;
}