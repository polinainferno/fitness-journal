// База упражнений

const METRIC_TYPES = {
    WEIGHT_REPS: 'weight_reps',
    TIME: 'time',
    DISTANCE: 'distance',
    TIME_DISTANCE: 'time_distance',
    TIME_WEIGHT: 'time_weight',
    WEIGHT_DISTANCE: 'weight_distance'
};

const DEFAULT_EXERCISES = [
    // Грудь
    { id: 'ex_1', name: 'Жим штанги лёжа', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_2', name: 'Жим штанги на наклонной скамье', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_3', name: 'Жим гантелей лёжа', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_4', name: 'Жим гантелей на наклонной скамье', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_5', name: 'Разведение гантелей лёжа', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_6', name: 'Сведение рук в кроссовере', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_7', name: 'Отжимания на брусьях', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_8', name: 'Отжимания от пола', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_9', name: 'Жим в тренажёре «Хаммер»', muscleGroup: 'Грудь', metricType: METRIC_TYPES.WEIGHT_REPS },

    // Спина
    { id: 'ex_10', name: 'Становая тяга', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_11', name: 'Тяга штанги в наклоне', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_12', name: 'Тяга гантели одной рукой в наклоне', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_13', name: 'Тяга верхнего блока к груди', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_14', name: 'Тяга нижнего блока к поясу', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_15', name: 'Подтягивания', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_16', name: 'Подтягивания в гравитроне', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_17', name: 'Пуловер с гантелью', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_18', name: 'Гиперэкстензия', muscleGroup: 'Спина', metricType: METRIC_TYPES.WEIGHT_REPS },

    // Ноги
    { id: 'ex_19', name: 'Приседания со штангой', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_20', name: 'Приседания с гантелями', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_21', name: 'Жим ногами в тренажёре', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_22', name: 'Выпады с гантелями', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_23', name: 'Болгарские сплит-приседания', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_24', name: 'Разгибание ног в тренажёре', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_25', name: 'Сгибание ног лёжа', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_26', name: 'Приседания в гакк-тренажёре', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },

    // Ягодицы
    { id: 'ex_27', name: 'Ягодичный мост со штангой', muscleGroup: 'Ягодицы', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_28', name: 'Отведение ноги назад в кроссовере', muscleGroup: 'Ягодицы', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_29', name: 'Разведение ног в тренажёре', muscleGroup: 'Ягодицы', metricType: METRIC_TYPES.WEIGHT_REPS },

    // Плечи
    { id: 'ex_30', name: 'Жим гантелей сидя', muscleGroup: 'Плечи', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_31', name: 'Жим штанги стоя', muscleGroup: 'Плечи', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_32', name: 'Махи гантелей в стороны', muscleGroup: 'Плечи', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_33', name: 'Махи гантелей в наклоне', muscleGroup: 'Плечи', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_34', name: 'Тяга штанги к подбородку', muscleGroup: 'Плечи', metricType: METRIC_TYPES.WEIGHT_REPS },

    // Руки
    { id: 'ex_35', name: 'Подъём штанги на бицепс', muscleGroup: 'Руки', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_36', name: 'Подъём гантелей на бицепс', muscleGroup: 'Руки', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_37', name: 'Молотки', muscleGroup: 'Руки', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_38', name: 'Сгибание рук на нижнем блоке', muscleGroup: 'Руки', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_39', name: 'Французский жим', muscleGroup: 'Руки', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_40', name: 'Разгибание рук на верхнем блоке', muscleGroup: 'Руки', metricType: METRIC_TYPES.WEIGHT_REPS },

    // Икры
    { id: 'ex_41', name: 'Подъём на носки стоя', muscleGroup: 'Икры', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_42', name: 'Подъём на носки сидя', muscleGroup: 'Икры', metricType: METRIC_TYPES.WEIGHT_REPS },

    // Кор
    { id: 'ex_43', name: 'Планка', muscleGroup: 'Кор', metricType: METRIC_TYPES.TIME },
    { id: 'ex_44', name: 'Скручивания', muscleGroup: 'Кор', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_45', name: 'Подъём ног в висе', muscleGroup: 'Кор', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_46', name: 'Русская скрутка', muscleGroup: 'Кор', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_47', name: 'Упражнение «Велосипед»', muscleGroup: 'Кор', metricType: METRIC_TYPES.WEIGHT_REPS },

    // Кардио
    { id: 'ex_48', name: 'Бег на дорожке', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME_DISTANCE },
    { id: 'ex_49', name: 'Ходьба в горку', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME_DISTANCE },
    { id: 'ex_50', name: 'Велотренажёр', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME_DISTANCE },
    { id: 'ex_51', name: 'Эллиптический тренажёр', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME_DISTANCE },
    { id: 'ex_52', name: 'Гребной тренажёр', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME_DISTANCE },
    { id: 'ex_53', name: 'Скакалка', muscleGroup: 'Кардио', metricType: METRIC_TYPES.TIME },

    // Функциональный тренинг
    { id: 'ex_54', name: 'Прогулка фермера', muscleGroup: 'Кор', metricType: METRIC_TYPES.WEIGHT_DISTANCE },
    { id: 'ex_55', name: 'Махи гирей', muscleGroup: 'Кор', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_56', name: 'Запрыгивания на тумбу', muscleGroup: 'Ноги', metricType: METRIC_TYPES.WEIGHT_REPS },
    { id: 'ex_57', name: 'Берпи', muscleGroup: 'Кардио', metricType: METRIC_TYPES.WEIGHT_REPS }
];

async function getAllExercises() {
    const customExercises = await getAllData(STORES.CUSTOM_EXERCISES);
    return [...DEFAULT_EXERCISES, ...(customExercises || [])];
}

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
