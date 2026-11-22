// База данных приложения
// IndexedDB — это как "коробка с ящиками" в браузере
// Каждый "ящик" (object store) хранит свой тип данных

const DB_NAME = 'FitnessJournalDB';
const DB_VERSION = 1;

// Список "ящиков" (хранилищ) в нашей базе
const STORES = {
    USER: 'user',              // Профиль пользователя
    EXERCISES: 'exercises',    // База упражнений (встроенная)
    CUSTOM_EXERCISES: 'customExercises', // Свои упражнения
    WORKOUTS: 'workouts'       // Тренировки по датам
};

let db = null; // Сюда сохраним подключение к базе

// Инициализация базы данных (создаём "ящики")
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        // Если базы ещё нет — создаём её
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            // Создаём "ящики", если их ещё нет
            if (!database.objectStoreNames.contains(STORES.USER)) {
                database.createObjectStore(STORES.USER, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(STORES.EXERCISES)) {
                database.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(STORES.CUSTOM_EXERCISES)) {
                database.createObjectStore(STORES.CUSTOM_EXERCISES, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(STORES.WORKOUTS)) {
                database.createObjectStore(STORES.WORKOUTS, { keyPath: 'date' });
            }
        };
        
        // Если всё успешно — сохраняем подключение
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        
        // Если ошибка — сообщаем
        request.onerror = (event) => {
            reject('Ошибка подключения к базе: ' + event.target.error);
        };
    });
}

// Универсальная функция: сохранить данные
function saveData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Универсальная функция: получить данные по ключу
function getData(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Универсальная функция: получить все данные из хранилища
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Универсальная функция: удалить данные по ключу
function deleteData(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Экспорт всех данных в JSON (для резервной копии)
async function exportData() {
    const data = {
        user: await getAllData(STORES.USER),
        exercises: await getAllData(STORES.EXERCISES),
        customExercises: await getAllData(STORES.CUSTOM_EXERCISES),
        workouts: await getAllData(STORES.WORKOUTS)
    };
    return JSON.stringify(data, null, 2);
}

// Импорт данных из JSON
async function importData(jsonString) {
    const data = JSON.parse(jsonString);
    
    for (const user of data.user) {
        await saveData(STORES.USER, user);
    }
    for (const exercise of data.exercises) {
        await saveData(STORES.EXERCISES, exercise);
    }
    for (const exercise of data.customExercises) {
        await saveData(STORES.CUSTOM_EXERCISES, exercise);
    }
    for (const workout of data.workouts) {
        await saveData(STORES.WORKOUTS, workout);
    }
}

// Удалить все данные (сброс приложения)
async function clearAllData() {
    const stores = [STORES.USER, STORES.EXERCISES, STORES.CUSTOM_EXERCISES, STORES.WORKOUTS];
    for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}