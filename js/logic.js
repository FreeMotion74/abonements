import { loadData } from "./firebase-init.js";
import { saveData } from "./firebase-init.js";
document.addEventListener("DOMContentLoaded", async () => {

    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) return;

    const users = await (await fetch("./users.json")).json();

    const user = users.find(u => u.Логин === currentUser);
    if (!user || !user.Данные) return;

 const rawPath = user.Данные || "";
const cleanPath = rawPath
  .replace(/^\.?\/*/, "")    // убирает "./" или "/"
  .replace(/^data\//, "")    // убирает "data/"
  .replace(/\.json$/i, "");  // убирает ".json"

const data = await loadData(`data/${cleanPath}`);


    function fillTable(selector, section) {
        const table = document.querySelector(selector);
        const values = data[section] || {};

        const ths = table.querySelectorAll("thead th");
        const tds = ths.length > 0
            ? table.querySelectorAll("tbody td")
            : table.querySelectorAll("tbody tr td");

        const num = v => parseFloat(String(v).replace(/[^\d.-]/g, "")) || 0;

        tds.forEach((td, i) => {
            const key = ths.length > 0
                ? ths[i]?.textContent.trim()
                : td.previousElementSibling?.textContent.trim();

            let value = values[key] ?? "";


            const rd = window.recalcData || {};

            // Итоги
            if (key === "Учеников") value = rd.ученики || 0;
            if (key === "Уже оплачено") { value = rd.оплачено; }
            if (key === "Осталось") { value = rd.осталось; }
            if (key === "Задолженность") { value = rd.задолженность; }
            if (key === "Выручка") { value = (rd.цена || 0) + (rd.задолженность || 0); }
            if (key === "Расходы") value = num(data["Расходы"]["Налог 4%"]) + num(data["Расходы"]["Аренда и Ремонт"]) + num(data["Расходы"]["Роялти и Управляющий"]);
            if (key === "Чистый доход") value = num(values["Выручка"]) - num(values["Расходы"]);
            if (key === "Доход с учётом долга") value = num(values["Чистый доход"]) + num(values["Задолженность"]);

            // Расходы
            if (key === "Налог 4%") value = num(data["Итоги"]["Уже оплачено"]) * 0.04;
            // if (key === "Аренда") value
            // if (key === "Ремонт") value
            if (key === "Аренда и Ремонт") value = num(values["Аренда"]) + num(values["Ремонт"]);
            if (key === "Роялти 5%") value = num(data["Итоги"]["Уже оплачено"]) * 0.05;
            if (key === "Управляющий 5%") value = num(data["Итоги"]["Уже оплачено"]) * 0.05;
            if (key === "Роялти и Управляющий") value = num(values["Роялти 5%"]) + num(values["Управляющий 5%"]);



            if (!isNaN(value) && value !== "" && !td.hasAttribute("nor")) value = Math.round(value) + " ₽";
            td.textContent = value;
            values[key] = num(value);
        });
    }

    fillTable(".results-table:first-of-type", "Итоги");
    fillTable(".expenses-table", "Расходы");
    fillTable(".results-table:nth-of-type(2)", "Итоги");

    document.addEventListener("tableRecalculated", () => {
        fillTable(".results-table:first-of-type", "Итоги");
        fillTable(".expenses-table", "Расходы");
        fillTable(".results-table:nth-of-type(2)", "Итоги");
    });









// ---- Автосохранение состояния страницы педагога (устойчиво) ----
(function () {
    // безопасный парсер числа (из "1 234 ₽" -> 1234)
    function parseNumber(s) {
        if (s === null || s === undefined) return 0;
        const t = String(s).replace(/[^\d\-.,]/g, "").replace(",", ".");
        const n = parseFloat(t);
        return isNaN(n) ? 0 : n;
    }

    // --- чтение данных (как было) ---
    function readItogi() {
        const itogi = {};
        const table = document.querySelector(".results-table");
        if (!table) return itogi;
        const headers = Array.from(table.querySelectorAll("thead th")).map(h => h.textContent.trim());
        const cells = Array.from(table.querySelectorAll("tbody tr td"));
        headers.forEach((h, i) => {
            const text = cells[i]?.textContent?.trim() || "";
            const num = parseNumber(text);
            itogi[h] = text === "" ? 0 : (isNaN(num) ? text : num);
        });
        return itogi;
    }

    function readItogiSecond() {
        const second = {};
        const tables = document.querySelectorAll(".results-table");
        if (tables.length < 2) return second;
        const table = tables[1];
        const headers = Array.from(table.querySelectorAll("thead th")).map(h => h.textContent.trim());
        const cells = Array.from(table.querySelectorAll("tbody tr td"));
        headers.forEach((h, i) => {
            const text = cells[i]?.textContent?.trim() || "";
            const num = parseNumber(text);
            second[h] = text === "" ? 0 : (isNaN(num) ? text : num);
        });
        return second;
    }

    function readExpenses() {
        const expenses = {};
        const table = document.querySelector(".expenses-table");
        if (!table) return expenses;
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
            const th = row.querySelector("th")?.textContent?.trim() || "";
            const td = row.querySelector("td")?.textContent?.trim() || "";
            if (th && td !== "") {
                const num = parseNumber(td);
                expenses[th] = isNaN(num) ? td : num;
            }
        });
        return expenses;
    }

    function readGroups() {
        const groups = [];
        const left = document.querySelector(".left");
        if (!left) return groups;
        const cards = left.querySelectorAll(".card");
        cards.forEach(card => {
            const title = card.querySelector(".card-head h3")?.textContent?.trim() || "";
            const abon = [];
            const rows = card.querySelectorAll(".card-table tbody tr");
            rows.forEach((tr, idx) => {
                const fio = tr.querySelector(".fio")?.textContent?.trim() || "";
                const inputs = Array.from(tr.querySelectorAll("input"));
                // Если есть contenteditable ячейки, добавим их тоже
                const ceds = Array.from(tr.querySelectorAll('[contenteditable]'));
                const hasValue = fio || inputs.some(i => (i.value || "").toString().trim() !== "") || ceds.some(c => (c.textContent || "").toString().trim() !== "");
                if (!hasValue) return;
                const getInput = i => inputs[i] ? inputs[i].value : "";
                abon.push({
                    "№": tr.querySelector(".number")?.textContent?.trim() || (idx + 1),
                    "ФИО": fio,
                    "Активен": getInput(0),
                    "Цена": parseNumber(getInput(1)),
                    "Оплачено": parseNumber(getInput(2)),
                    "Осталось": parseNumber(getInput(3)),
                    "Дата текущего": getInput(4),
                    "Задолженность": parseNumber(getInput(5)),
                    "Дата долга": getInput(6),
                    "Оплата далее": parseNumber(getInput(7))
                });
            });
           if (title || abon.length > 0) {
  groups.push({ "Название": title || "Новая группа", "Абонементы": abon });
}
        });
        return groups;
    }

    function buildFullDataObject() {
        const itogi1 = readItogi();
        const itogi2 = readItogiSecond();
        const expenses = readExpenses();
        const Итоги = Object.assign({}, itogi1, itogi2);
        const Расходы = Object.assign({}, expenses);
        const Группы = readGroups();
        return { "Итоги": Итоги, "Расходы": Расходы, "Группы": Группы };
    }



async function saveFullState() {
  const state = buildFullDataObject(); // собираем всё из таблиц
  const rawPath = user.Данные || "";
  const cleanPath = rawPath
    .replace(/^\.?\/*/, "")
    .replace(/^data\//, "")
    .replace(/\.json$/i, "")
    .replace(/^./, s => s.toUpperCase()); // если нужно, делает первую букву большой

  const ok = await saveData(`data/${cleanPath}`, state);
  if (ok) {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const el = document.getElementById("save-time");
    if (el) el.textContent = `Последнее сохранение: ${time}`;
  } else {
    console.error("❌ Ошибка сохранения в Firebase");
  }
}





    // --- Debounce / schedule helper ---
    let saveTimer = null;
    function scheduleSave(delay = 800) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveFullState().catch(()=>{/*silent*/});
        }, delay);
    }

    // --- Слушатели событий: input/change/blur/keyup (Enter) ---
    document.addEventListener("input", (e) => {
        // реагируем только на поля ввода, textarea или contenteditable
        const t = e.target;
        if (!t) return;
        if (t.matches && (t.matches("input, textarea") || t.isContentEditable || t.hasAttribute && t.hasAttribute("contenteditable"))) {
            scheduleSave(1000);
        }
    }, { passive: true });

    document.addEventListener("change", (e) => {
        const t = e.target;
        if (!t) return;
        if (t.matches && (t.matches("input, select, textarea") || t.isContentEditable)) {
            scheduleSave(600);
        }
    }, { passive: true });

    // blur — на случай ухода фокуса
    document.addEventListener("blur", (e) => {
        const t = e.target;
        if (!t) return;
        if (t.matches && (t.matches("input, textarea") || t.isContentEditable)) {
            scheduleSave(400);
        }
    }, true); // useCapture=true чтобы ловить blur

    // Enter в текстовых полях
    document.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            const t = e.target;
            if (!t) return;
            if (t.matches && (t.matches("input, textarea") || t.isContentEditable)) {
                scheduleSave(300);
            }
        }
    });

    // --- Клики по кнопкам (дел/адд/логаут) ---
    document.addEventListener("click", (e) => {
        const btn = e.target.closest && e.target.closest("button, .delbtn, .addbtn, .logout-btn");
        if (!btn) return;
        // проверяем классы на ближайшей кнопке/элементе
        if (btn.classList && (btn.classList.contains("delbtn") || btn.classList.contains("addbtn") || btn.classList.contains("logout-btn"))) {
            // даём небольшую задержку, чтобы DOM-операция (удаление/добавление) успела выполниться
            scheduleSave(500);
        }
    });

    // --- MutationObserver: ловим добавление/удаление строк/карточек ---
    const mutationTargets = [];
    const left = document.querySelector(".left");
    if (left) mutationTargets.push(left);
    const resultsTables = document.querySelectorAll(".results-table, .expenses-table");
    resultsTables.forEach(t => mutationTargets.push(t));

    if (mutationTargets.length > 0) {
        const mo = new MutationObserver((mutations) => {
            // если что-то добавлено/удалено/изменено в структуре — планируем сохранение
            for (const m of mutations) {
                if (m.type === "childList" || m.type === "subtree" || m.type === "attributes") {
                    scheduleSave(500);
                    break;
                }
            }
        });
        mutationTargets.forEach(node => {
            mo.observe(node, { childList: true, subtree: true, attributes: true });
        });
    }

    // Экспорт на случай ручного вызова
    window.saveFullState = saveFullState;
})();







});

