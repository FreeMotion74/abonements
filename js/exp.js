import { loadData } from "./firebase-init.js";
document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) return;

    const users = await (await fetch("./users.json")).json();
    const user = users.find(u => u.Логин === currentUser);
    if (!user?.Данные) return;


const rawPath = user.Данные || "";
const cleanPath = rawPath
  .replace(/^\.?\/*/, "")
  .replace(/^data\//, "")
  .replace(/\.json$/i, "");

const data = await loadData(`data/${cleanPath}`);






    const left = document.querySelector(".left");
    if (!left) return;
    left.innerHTML = "";

    (data["Группы"] || []).forEach(g => {
        const card = document.createElement("section");
        card.className = "card";
        card.innerHTML = `
        <div class="card-head">
          <h3 contenteditable="true">${g.Название || ""}</h3>
          <button class="addbtn">＋ Добавить строку</button>
        </div>
        <table class="card-table">
          <thead>
            <tr>
              <th>№</th>
              <th>ФИО</th>
              <th>Активен</th>
              <th>Цена</th>
              <th>Оплачено</th>
              <th>Осталось</th>
              <th>Дата текущего</th>
              <th>Задолженность</th>
              <th>Дата долга</th>
              <th>Оплата далее</th>
              <th></th>
            </tr>
          </thead>
          <tbody></tbody>
          <tr class="sum">
            <th colspan="2">Сумма:</th>
            <td></td>
            <td>0 ₽</td>
            <td>0 ₽</td>
            <td>0 ₽</td>
            <td></td>
            <td>0 ₽</td>
            <td></td>
            <td>0 ₽</td>
            <td></td>
          </tr>
        </table>
      `;
        const tbody = card.querySelector("tbody");

        (g.Абонементы || []).forEach(a => {
            const numOrEmpty = v => (v === 0 || v === "0" ? "" : v ?? "");

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td class="number">${a["№"] || ""}</td>
                <td class="fio" contenteditable="true">${a["ФИО"] || ""}</td>
                <td><input type="date" value="${a["Активен"] || ""}" required></td>
                <td><input type="number" value="${numOrEmpty(a["Цена"])}" required name="Цена"></td>
                <td><input type="number" value="${numOrEmpty(a["Оплачено"])}" required name="Оплачено"></td>
                <td><input type="number" value="${numOrEmpty(a["Осталось"])}" required name="Осталось" readonly></td>
                <td><input type="date" value="${a["Дата текущего"] || ""}" required></td>
                <td><input type="number" value="${numOrEmpty(a["Задолженность"])}" required></td>
                <td><input type="date" value="${a["Дата долга"] || ""}" required></td>
                <td><input type="number" value="${numOrEmpty(a["Оплата далее"])}" required></td>
                <td><button class="delbtn">✖</button></td>
            `;

            tbody.appendChild(tr);
        });


// === Ограничение ввода в числовые поля ===
document.addEventListener("input", e => {
  const input = e.target;
  if (input.tagName === "INPUT" && input.type === "number") {
    let v = input.value;

    // Удаляем всё, кроме цифр
    v = v.replace(/\D/g, "");

    // Убираем ведущие нули (кроме одного, если нужно пустое поле)
    v = v.replace(/^0+/, "");

    // Ограничиваем длину — максимум 4 цифры
    if (v.length > 4) v = v.slice(0, 4);

    // Записываем обратно
    input.value = v;
  }
});

// === Дополнительно: запрещаем ввод "-" и "e" в number-поле ===
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" && e.target.type === "number") {
    if (["-", "e", "E", "+", "."].includes(e.key)) {
      e.preventDefault();
    }
  }
});


















        // === Функция пересчёта сумм ===
        function recalc() {
            const n = v => parseFloat(v) || 0;

            // массив для хранения всех сумм по каждой таблице
            let total = { цена: 0, оплачено: 0, осталось: 0, задолженность: 0, далее: 0 };

            const s = [0, 0, 0, 0, 0];
            tbody.querySelectorAll("tr").forEach(tr => {
                const inputs = tr.querySelectorAll("input[type='number']");
                for (let j = 0; j < 5; j++) {
                    s[j] += n(inputs[j]?.value);
                }
            });

            const sumRow = card.querySelector("tr.sum");
            if (!sumRow) return;
            const cells = sumRow.querySelectorAll("td, th");
            [2, 3, 4, 6, 8].forEach((pos, idx) => {
                cells[pos].textContent = s[idx] ? s[idx].toFixed(0) + " ₽" : "";
            });

            document.querySelectorAll(".card").forEach(section => {
                const sum = section.querySelector("tr.sum");
                if (!sum) return;
                const cells = sum.querySelectorAll("td, th");

                total.цена += n(cells[2]?.textContent);
                total.оплачено += n(cells[3]?.textContent);
                total.осталось += n(cells[4]?.textContent);
                total.задолженность += n(cells[6]?.textContent);
                total.дaлee += n(cells[8]?.textContent);

                const tbody = section.querySelector("tbody");
                if (tbody) {
                    const rows = tbody.querySelectorAll("tr");
                    total.ученики = (total.ученики || 0) + rows.length;
                }
            });

            window.recalcData = total;

            document.dispatchEvent(new CustomEvent("tableRecalculated"));
        }

        tbody.addEventListener("input", recalc);












// === Подсветка дат (текст + фон) ===
function updateDateColors() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  document.querySelectorAll('input[type="date"]').forEach(input => {
    const val = input.value;
    if (!val) {
      input.style.color = "";
      input.style.backgroundColor = "";
      return;
    }

    const date = new Date(val);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      input.style.color = "orange";
      input.style.backgroundColor = "#fff6cc"; // мягкий жёлтый
    } else if (date.getTime() < today.getTime()) {
      input.style.color = "red";
      input.style.backgroundColor = "#ffe0e0"; // мягкий розовый
    } else {
      input.style.color = "green";
      input.style.backgroundColor = "#e6ffe6"; // мягкий зелёный
    }
  });
}

// === События ===
document.addEventListener("input", e => {
  if (e.target.type === "date") updateDateColors();
});

document.addEventListener("DOMContentLoaded", updateDateColors);
document.addEventListener("cardsReady", updateDateColors);
document.addEventListener("recalcNeeded", updateDateColors);

// === Автоматическая реакция при добавлении новых строк ===
const dateObserver = new MutationObserver(updateDateColors);
dateObserver.observe(document.body, { childList: true, subtree: true });









        left.appendChild(card);
        recalc();
        document.addEventListener("recalcNeeded", () => {
  recalc();
})
    });
    document.dispatchEvent(new Event("cardsReady"));
});