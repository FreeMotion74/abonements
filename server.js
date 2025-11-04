import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// --- Кастомный форматтер JSON ---
// parentKey — имя поля у родителя, чтобы понимать контекст (напр. "Абонементы")
function formatJsonCompactArrays(obj, indent = 0, parentKey = null) {
    const pad = "  ".repeat(indent);

    // Массивы
    if (Array.isArray(obj)) {
        // Если это массив абонементов — хотим компактные однострочные объекты внутри
        if (parentKey === "Абонементы") {
            const inner = obj.map(v => {
                if (typeof v === "object" && v !== null && !Array.isArray(v)) {
                    // объект — компактная запись в одну строку
                    return JSON.stringify(v);
                } else {
                    // примитив или вложенный массив — рекурсивно форматируем
                    return formatJsonCompactArrays(v, indent + 1, null);
                }
            }).join(",\n" + pad + "  ");
            return `[\n${pad}  ${inner}\n${pad}]`;
        } else {
            // Для всех остальных массивов — форматируем элементы нормально
            const inner = obj.map(v => formatJsonCompactArrays(v, indent + 1, null))
                             .join(",\n" + pad + "  ");
            return `[\n${pad}  ${inner}\n${pad}]`;
        }
    }

    // Объекты
    if (typeof obj === "object" && obj !== null) {
        const entries = Object.entries(obj).map(([k, v]) => {
            // Передаём ключ как parentKey в рекурсии для массивов
            if (Array.isArray(v)) {
                return `${pad}  "${k}": ${formatJsonCompactArrays(v, indent + 1, k)}`;
            } else {
                return `${pad}  "${k}": ${formatJsonCompactArrays(v, indent + 1, null)}`;
            }
        });
        return `{\n${entries.join(",\n")}\n${pad}}`;
    }

    // Примитивы
    return JSON.stringify(obj);
}

app.post("/api/save", (req, res) => {
    const { login, data } = req.body;

    if (!login || !data) {
        return res.status(400).json({ error: "Отсутствует login или data" });
    }

    const dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    const filePath = path.join(dataDir, `${login.toLowerCase()}.json`);

    try {
        const formatted = formatJsonCompactArrays(data, 0, null);
        fs.writeFileSync(filePath, formatted, "utf8");
        res.json({ success: true, message: "Файл успешно сохранён" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка сохранения файла" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Сервер работает: http://localhost:${PORT}`);
});
