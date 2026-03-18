import axios from "axios";

const client = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// 1. Добавляем access-токен к каждому запросу [cite: 2437-2445]
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// 2. Ловим ошибку 401 и обновляем токены 
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если ошибка 401 и мы еще не пробовали обновить токен
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
                // Если refresh-токена нет, просто разлогиниваем
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                return Promise.reject(error);
            }

            try {
                // Запрашиваем новые токены
                const res = await axios.post("http://localhost:3000/api/auth/refresh", { refreshToken });
                
                // Сохраняем новые токены [cite: 2468-2473]
                localStorage.setItem("accessToken", res.data.accessToken);
                localStorage.setItem("refreshToken", res.data.refreshToken);

                // Повторяем оригинальный запрос с новым токеном
                originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
                return client(originalRequest);
                
            } catch (refreshError) {
                // Если refresh-токен тоже умер — выкидываем из профиля [cite: 2474-2478]
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.reload(); // Перезагружаем страницу, чтобы сбросить стейт
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const api = {
    register: async (data) => (await client.post("/auth/register", data)).data,
    login: async (data) => (await client.post("/auth/login", data)).data,
    getMe: async () => (await client.get("/auth/me")).data,
    
    getAll: async () => (await client.get("/products")).data,
    create: async (data) => (await client.post("/products", data)).data,
    update: async (id, data) => (await client.patch(`/products/${id}`, data)).data,
    delete: async (id) => (await client.delete(`/products/${id}`)).data,
    getUsers: async () => (await client.get("/users")).data,
    updateUser: async (id, data) => (await client.put(`/users/${id}`, data)).data,
    deleteUser: async (id) => (await client.delete(`/users/${id}`)).data,
};