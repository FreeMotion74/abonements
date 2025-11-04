// js/firebase-init.js

// ✅ Импорт актуальной версии Firebase SDK (v11)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ⚙️ ВСТАВЬ СВОЙ КОНФИГ ИЗ FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBZl87TG7E7wZjDKKGxuEFXT1-vh8tR3VY",
  authDomain: "abonement-393b3.firebaseapp.com",
  databaseURL: "https://abonement-393b3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "abonement-393b3",
  storageBucket: "abonement-393b3.firebasestorage.app",
  messagingSenderId: "468918536237",
  appId: "1:468918536237:web:fba38820e6fb43532890a4"
};

// 🔹 Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔹 Получить данные
export async function loadData(path) {
  const snapshot = await get(ref(db, path));
  if (snapshot.exists()) return snapshot.val();
  console.warn("Нет данных по пути:", path);
  return {};
}

// 🔹 Сохранить данные
export async function saveData(path, data) {
  try {
    await set(ref(db, path), data);
    console.log("✅ Данные сохранены:", path);
    return true;
  } catch (err) {
    console.error("❌ Ошибка сохранения:", err);
    return false;
  }
}
