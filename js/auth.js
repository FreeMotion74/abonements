document.addEventListener("DOMContentLoaded", async () => {

    // Загрузка users.json
    const users = await (await fetch("./users.json")).json();

    // Блок сессии
    const getCurrentUser = () => localStorage.getItem("loggedInUser");
    const loginUser = name => localStorage.setItem("loggedInUser", name);
    const logoutUser = () => {
        localStorage.removeItem("loggedInUser");
        location.href = "./index.html";
    };

    //Ошибка
    const showError = () => document.querySelector(".error").classList.add("show");

    const hideError = () => document.querySelector(".error").classList.remove("show");

    document.querySelectorAll("#login, #password").forEach(input => input.addEventListener("input", hideError));

    // Логика редиректов
    const isLoginPage = () => location.pathname.endsWith("/") || location.pathname.includes("index.html");

    const currentUser = getCurrentUser();
    if (isLoginPage() && currentUser) {
        location.href = "./main.html";
        return;
    }
    if (!isLoginPage() && !currentUser) {
        location.href = "./index.html";
        return;
    }

    // Логика страницы входа
    if (isLoginPage()) {
        const form = document.querySelector("form");
        form.addEventListener("submit", e => {
            e.preventDefault();
            const login = document.getElementById("login")?.value.trim();
            const password = document.getElementById("password")?.value.trim();

            // Находим пользователя по логину и паролю
            const user = users.find(u => u.Логин === login && u.Пароль === password);
            if (user) {
                loginUser(user.Логин);
                location.href = "./main.html";
            } else {
                showError();
            }
        });
    }

    // Логика главной страницы
    if (!isLoginPage() && currentUser) {
        const user = users.find(u => u.Логин === currentUser);
        if (!user) {
            logoutUser();
            return;
        }

        document.querySelector(".username").textContent = user.Логин;
        document.querySelector(".nap").innerHTML = user.Направление.replace(/([A-Z])/g, "<b>$1</b>");
        document.querySelector(".avatar img").src = user.Фото;

    }

})

