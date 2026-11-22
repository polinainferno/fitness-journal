// Вспомогательные функции

// Расчёт возраста по дате рождения (только полные годы)
function calculateAge(birthDateStr) {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Если день рождения ещё не наступил в этом году, вычитаем 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Расчёт ИМТ (Индекс массы тела) = вес (кг) / (рост (м) * рост (м))
function calculateBMI(weight, heightCm) {
    const heightM = heightCm / 100;
    return (weight / (heightM * heightM)).toFixed(1);
}

// Проверка, является ли ИМТ опасно низким (менее 18.5)
function isBMILow(bmi) {
    return bmi < 18.5;
}