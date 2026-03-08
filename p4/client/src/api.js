import axios from "axios";

const client = axios.create({
    baseURL: "http://localhost:3000/api"
});

// Автоматически прикрепляем токен ко всем запросам 
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    // --- АВТОРИЗАЦИЯ ---
    register: async (data) => (await client.post("/auth/register", data)).data,
    login: async (data) => (await client.post("/auth/login", data)).data,
    getMe: async () => (await client.get("/auth/me")).data,

    // --- ТОВАРЫ ---
    getAll: async () => (await client.get("/products")).data,
    create: async (data) => (await client.post("/products", data)).data,
    update: async (id, data) => (await client.patch(`/products/${id}`, data)).data,
    delete: async (id) => (await client.delete(`/products/${id}`)).data,
};