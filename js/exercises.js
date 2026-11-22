// База упражнений

// Типы метрик для упражнений
const METRIC_TYPES = {
    WEIGHT_REPS: 'weight_reps',       // Подходы, повторения, вес
    TIME: 'time',                     // Время
    DISTANCE: 'distance',             // Дистанция
    TIME_DISTANCE: 'time_distance',   // Время + дистанция
    TIME_WEIGHT: 'time_weight',       // Время + вес
    WEIGHT_DISTANCE: 'weight_distance' // Вес + дистанция
};

// Предустановленные упражнения
const DEFAULT_EXERCISES = [
    { id: 'ex_1', name: 'Жим лёжа', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_2', name: 'Приседания со штангой', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_3', name: 'Становая тяга', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_4', name: 'Тяга верхнего блока', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_5', name: 'Жим гантелей сидя', muscleGroup: 'Плечи', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_6', name: 'Подъём на бицепс', muscleGroup: 'Руки', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_7', name: 'Французский жим', muscleGroup: 'Руки', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_8', name: 'Планка', muscleGroup: 'Кор', metricType: METRIC_TYPES.TIME },
    { id: 'ex_9', name: 'Бег на дорожке', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME_DISTANCE },
    { id: 'ex_10', name: 'Велотренажёр', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME_DISTANCE },
    { id: 'ex_11', name: 'Эллипс', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME_DISTANCE },
    { id: 'ex_12', name: 'Прогулка фермера', muscleGroup: 'Кор', metricType: METRIC_TYPES.WEIGHT_DISTANCE }
];

// Получить все упражнения (встроенные + свои)
async function getAllExercises() {
    const defaultExercises = DEFAULT_EXERCISES;
    const customExercises = await getAllData(STORES.CUSTOM_EXERCISES);
    return [...defaultExercises, ...(customExercises || [])];
}

// Добавить своё упражнение
async function addCustomExercise(name, muscleGroup, metricType) {
    const newExercise = {
        id: 'custom_' + Date.now(),
        name: name,
        muscleGroup: muscleGroup,
        metricType: metricType,
        isCustom: true
    };
    await saveData(STORES.CUSTOM_EXERCISES, newExercise);
    return newExercise;
}