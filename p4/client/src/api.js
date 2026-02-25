import axios from "axios";

// Создаем экземпляр axios с базовым адресом нашего бэкенда
const client = axios.create({
    baseURL: "http://localhost:3000/api"
});

export const api = {
    getAll: async () => (await client.get("/products")).data,
    create: async (data) => (await client.post("/products", data)).data,
    update: async (id, data) => (await client.patch(`/products/${id}`, data)).data,
    delete: async (id) => (await client.delete(`/products/${id}`)).data,
};