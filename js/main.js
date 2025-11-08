document.addEventListener("cardsReady", () => {

    // === Создание строки ===
    function createRowHtml() {
        return `
      <td class="number"></td>
      <td contenteditable="true" class="fio" required></td>
      <td><input type="date" required></td>
      <td><input type="number" inputmode="numeric" pattern="[0-9]*" required name="Цена"></td>
      <td><input type="number" inputmode="numeric" pattern="[0-9]*" required name="Оплачено"></td>
      <td><input type="number" inputmode="numeric" pattern="[0-9]*" required name="Осталось" readonly></td>
      <td><input type="date" required></td>
      <td><input type="number" inputmode="numeric" pattern="[0-9]*" required></td>
      <td><input type="date" required></td>
      <td><input type="number" inputmode="numeric" pattern="[0-9]*" required></td>
      <td><button class="delbtn">✖</button></td>
    `;
    }

    // === Автонумерация строк ===
    function updateRowNumbers(tableBody) {
        if (!tableBody) return; // безопасно, если tableBody = null
        tableBody.querySelectorAll("tr").forEach((row, index) => {
            const numCell = row.querySelector(".number");
            if (numCell) {
                numCell.textContent = index + 1;
                numCell.style.cursor = "grab"; // установка cursor по умолчанию
            }
        });
    }

    // === Модальное окно (одинаковое поведение, без накопления слушателей) ===
    function showModal(title, message, showConfirm = false, onConfirm = null) {
        const modal = document.getElementById("confirmModal");
        const modalTitle = document.getElementById("modalTitle");
        const modalMessage = document.getElementById("modalMessage");
        const yesBtn = document.getElementById("confirmYes");
        const noBtn = document.getElementById("confirmNo");



        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.style.display = "flex";

        yesBtn.textContent = "Да";
        noBtn.textContent = "Нет";

        if (showConfirm) {
            yesBtn.style.display = "inline-block";
            noBtn.style.display = "inline-block";
        } else {
            yesBtn.style.display = "none";
            noBtn.textContent = "Понятно";
            noBtn.style.display = "inline-block";
        }

        // заменяем слушатели назначением handler'ов (не накапливаются)
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = "none";
        };

        // назначаем кнопки (перезаписываем предыдущие)
        yesBtn.onclick = () => {
            if (showConfirm && typeof onConfirm === "function") {
                onConfirm();
            }
            modal.style.display = "none";
        };

        noBtn.onclick = () => {
            modal.style.display = "none";
        };
    }

    // === Основная логика для каждой таблицы ===
    document.querySelectorAll(".card").forEach(card => {
        const addBtn = card.querySelector(".addbtn");
        const tableBody = card.querySelector(".card-table tbody");

        // Защита: если у карточки нет таблицы — пропускаем
        if (!tableBody) {
            return;
        }

        // Инициализация нумерации
        updateRowNumbers(tableBody);

        // Добавление новой строки
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                const newRow = document.createElement("tr");
                newRow.innerHTML = createRowHtml();
                tableBody.appendChild(newRow);
                updateRowNumbers(tableBody);
                // навешиваем drag на только что добавленную строку
                enableRowDragging(newRow, tableBody);
            });
        } else {
            console.warn("У карточки нет .addbtn:", card);
        }

        // Удаление строки с подтверждением (делегирование)
        tableBody.addEventListener("click", e => {
            if (e.target.classList.contains("delbtn")) {
                const rows = tableBody.querySelectorAll("tr");
                const row = e.target.closest("tr");

                if (!row) return;

                if (rows.length === 1) {
                    showModal("Удаление запрещено", "Нельзя удалить последнюю строку!");
                } else {
                    showModal("Удалить строку?", "Вы действительно хотите удалить эту строку?", true, () => {
                        row.remove();
                        updateRowNumbers(tableBody);
                        document.dispatchEvent(new CustomEvent("recalcNeeded"));
                    });
                }
            }
        });


        const logoutUser = () => {
            localStorage.removeItem("loggedInUser");
            location.href = "./index.html";
        };

        const logmob = document.querySelector(".logmob");
        logmob.addEventListener("click", (e) => {
            showModal(
                "Выход из системы",
                "Вы действительно хотите выйти?",
                true, // показываем кнопки "Да"/"Нет"
                () => {
                    logoutUser(); // Вызываем функцию выхода (были пропущены скобки!)
                }
            );
        });

        const logoutBtn = document.querySelector(".logout-btn");
        logoutBtn.addEventListener("click", (e) => {
            showModal(
                "Выход из системы",
                "Вы действительно хотите выйти?",
                true, // показываем кнопки "Да"/"Нет"
                () => {
                    logoutUser(); // Вызываем функцию выхода (были пропущены скобки!)
                }
            );
        });






        // Активация drag & drop для всех текущих строк
        tableBody.querySelectorAll("tr").forEach(row => enableRowDragging(row, tableBody));
    });

    // === Функция drag & drop (только за номер) ===
    function enableRowDragging(row, tableBody) {
        if (!row || !tableBody) return;
        const numberCell = row.querySelector(".number");
        if (!numberCell) return;

        let draggedRow = null;
        let isMouseDown = false;

        // mousedown только на клетке с номером
        numberCell.addEventListener("mousedown", e => {
            isMouseDown = true;
            draggedRow = row;
            row.classList.add("dragging");
            numberCell.style.cursor = "grabbing";
            // предотвращаем выделение текста
            e.preventDefault();
        });

        // mouseup на документе — завершение drag
        document.addEventListener("mouseup", () => {
            if (!isMouseDown) return;
            isMouseDown = false;
            if (draggedRow) {
                draggedRow.classList.remove("dragging");
                const nc = draggedRow.querySelector(".number");
                if (nc) nc.style.cursor = "grab";
                draggedRow = null;
                updateRowNumbers(tableBody);
            }
        });

        // mousemove внутри tableBody — переставляем элементы визуально
        tableBody.addEventListener("mousemove", e => {
            if (!isMouseDown || !draggedRow) return;
            const targetRow = e.target.closest("tr");
            if (targetRow && targetRow !== draggedRow && targetRow.parentElement === tableBody) {
                const rect = targetRow.getBoundingClientRect();
                const next = e.clientY > rect.top + rect.height / 2;
                tableBody.insertBefore(draggedRow, next ? targetRow.nextSibling : targetRow);
            }
        });
    }

    // === Дата сегодня ===
    const todayEl = document.getElementById("today-date");
    if (todayEl) {
        todayEl.textContent = new Date().toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    // === Нажатие на календарь по всей ячейке ===
    document.addEventListener("click", (e) => {
        const input = e.target.closest && e.target.closest('input[type="date"]');
        input?.showPicker?.();
    });

    // === Возврат подсказки после удаления имени / заголовка группы ===
    document.addEventListener("input", e => {
        const fio = e.target.closest && e.target.closest(".fio");
        if (fio && fio.textContent.trim() === "") {
            fio.textContent = "";
        }
        const head = e.target.closest && e.target.closest(".card-head h3");
        if (head && head.textContent.trim() === "") {
            head.textContent = "";
        }
    });











    // === Пересчёт "Осталось" ===
    function recalcRow(row, withHighlight = false) {
        const цена = row.querySelector('input[name="Цена"]');
        const оплачено = row.querySelector('input[name="Оплачено"]');
        const осталось = row.querySelector('input[name="Осталось"]');

        if (!цена || !оплачено || !осталось) return;

        let c = parseFloat(цена.value) || 0;
        let o = parseFloat(оплачено.value) || 0;

        // ограничение: Оплачено ≤ Цена
        if (o > c) {
            o = c;
            оплачено.value = c;
        }

        const result = Math.max(c - o, 0);

        // === если оба пустые — пусто, иначе число (даже если 0)
        if (цена.value === "" && оплачено.value === "") {
            осталось.value = "";
            осталось.style.removeProperty("opacity"); // не трогаем стиль
        } else {
            осталось.value = result;
            осталось.style.opacity = 1;
        }

        if (withHighlight) {
            осталось.classList.add("highlight");
            setTimeout(() => осталось.classList.remove("highlight"), 300);
        }
    }

    // === Реакция на ввод (с подсветкой) ===
    document.addEventListener("input", e => {
        const el = e.target;
        if (!["Цена", "Оплачено"].includes(el.name)) return;
        const row = el.closest("tr");
        if (row) recalcRow(row, true);
        document.dispatchEvent(new CustomEvent("recalcNeeded"));
    });

    // === Пересчёт при загрузке и появлении таблиц ===
    function recalcAll() {
        document.querySelectorAll("tr").forEach(row => recalcRow(row, false));
    }

    document.addEventListener("DOMContentLoaded", recalcAll);
    document.addEventListener("cardsReady", recalcAll);

    // === Если таблицы добавляются позже (без задержки) ===
    const observer = new MutationObserver(() => recalcAll());
    observer.observe(document.body, { childList: true, subtree: true });


    












document.addEventListener('keydown', e => {
    const el = document.activeElement;

    // === Если редактируем заголовок .card-head h3 ===
    if (el.matches('.card-head h3[contenteditable]')) {
        if (e.key === 'Enter') {
            e.preventDefault(); // не вставляем абзац
            el.blur(); // выходим из редактирования
        }
        return; // не продолжаем логику таблицы
    }

    // === Дальше идёт твоя логика таблицы ===
    if (!el.closest('table.card-table')) return;

    const td = el.closest('td');
    const tr = el.closest('tr');
    const col = [...tr.children].indexOf(td);

    const move = dir => {
        let row = dir === 'up' ? tr.previousElementSibling : tr.nextElementSibling;
        while (row && !row.querySelectorAll('td')[col]) {
            row = dir === 'up' ? row.previousElementSibling : row.nextElementSibling;
        }
        const cell = row?.querySelectorAll('td')[col];
        const next = cell?.querySelector('input,[contenteditable]');
        if (next) {
            next.focus();
            if (next.value) next.select();
            if (next.isContentEditable && next.textContent.trim()) next.textContent = '';
        }
    };

    if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') move('up');
        else move('down'); // Enter и ↓ — одинаково
        el.blur(); // “сохранение” текущего
    }
});














});
