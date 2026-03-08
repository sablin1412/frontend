import React, { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  
  // Состояния для товаров
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", category: "", description: "", price: "", stock: "", image: "" });

  // Состояния для АВТОРИЗАЦИИ
  const [currentUser, setCurrentUser] = useState(null); // Если null - гость
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" или "register"
  const [authData, setAuthData] = useState({ email: "", password: "", first_name: "", last_name: "" });

  // При загрузке сайта: грузим товары и проверяем, есть ли сохраненный токен
  useEffect(() => {
    loadProducts();
    checkAuth();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getAll();
      setProducts(data);
    } catch (err) { console.error(err); }
  };

  // Проверяем, залогинен ли юзер
  const checkAuth = async () => {
    if (localStorage.getItem("token")) {
      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch (err) {
        // Если токен протух - удаляем
        localStorage.removeItem("token");
        setCurrentUser(null);
      }
    }
  };

  // --- ЛОГИКА АВТОРИЗАЦИИ ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === "register") {
        await api.register(authData);
        alert("Регистрация успешна! Теперь войдите.");
        setAuthMode("login");
      } else {
        const res = await api.login({ email: authData.email, password: authData.password });
        localStorage.setItem("token", res.accessToken); // Сохраняем токен
        setAuthModalOpen(false);
        checkAuth(); // Загружаем профиль
      }
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка авторизации");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  // --- ЛОГИКА ТОВАРОВ ---
  const handleOpenProduct = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ name: item.name, category: item.category, description: item.description, price: item.price, stock: item.stock, image: item.image || "" });
    } else {
      setFormData({ name: "", category: "", description: "", price: "", stock: "", image: "" });
    }
    setModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) await api.update(editingItem.id, formData);
      else await api.create(formData);
      setModalOpen(false);
      loadProducts();
    } catch (err) { alert("Ошибка сохранения! Проверьте, авторизованы ли вы."); }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Удалить эту клавиатуру?")) {
      try {
        await api.delete(id);
        loadProducts();
      } catch (err) { alert("Ошибка! Недостаточно прав."); }
    }
  };

  return (
    <div className="container">
      
      {/* ШАПКА С АВТОРИЗАЦИЕЙ */}
      <div className="header-top">
        <div style={{fontWeight: '800', color: '#fff'}}></div>
        {currentUser ? (
          <div className="user-profile">
            <div>Привет, <span>{currentUser.first_name}</span></div>
            <button className="btn btn-secondary" onClick={handleLogout}>Выйти</button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn btn-secondary" onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }}>Войти</button>
            <button className="btn btn-primary" onClick={() => { setAuthMode("register"); setAuthModalOpen(true); }}>Регистрация</button>
          </div>
        )}
      </div>

      <h1 className="header-title">KEYBOARD.STORE</h1>
      <div className="subtitle">Премиальные механические клавиатуры</div>
      
      {/* Кнопку добавить видно только залогиненным */}
      {currentUser && (
        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => handleOpenProduct(null)}>+ Добавить товар</button>
        </div>
      )}

      <div className="product-list">
        {products.map((p) => (
          <div key={p.id} className="product-card">
            <div className="card-image-container">
               <span className="category-badge">{p.category}</span>
               <img src={p.image && p.image.length > 5 ? p.image : "https://via.placeholder.com/800x600?text=No+Photo"} alt={p.name} className="product-image" />
            </div>
            
            <div className="product-info">
              <h3>{p.name}</h3>
              <div className="description">{p.description}</div>
              <div className="meta-info"><span>{p.stock} шт.</span></div>

              <div className="price-row">
                <span className="price">{p.price}$</span>
                
                {/* Кнопки действий видно только залогиненным */}
                {currentUser && (
                  <div className="action-buttons">
                    <button className="btn-icon btn-edit" onClick={() => handleOpenProduct(p)}>✎</button>
                    <button className="btn-icon btn-delete" onClick={() => handleDeleteProduct(p.id)}>🗑</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* МОДАЛКА ДОБАВЛЕНИЯ ТОВАРА */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingItem ? "Редактировать товар" : "Новый товар"}</h2>
            <form onSubmit={handleProductSubmit}>
              <input placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input placeholder="Категория" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
              <input placeholder="Ссылка на фото (URL)" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
              <textarea placeholder="Описание" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              <div style={{display: 'flex', gap: '15px'}}>
                <input type="number" placeholder="Цена" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={{flex: 1}}/>
                <input type="number" placeholder="Кол-во" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required style={{flex: 1}}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА АВТОРИЗАЦИИ */}
      {authModalOpen && (
        <div className="auth-modal-backdrop" onClick={() => setAuthModalOpen(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <h2>{authMode === "login" ? "Вход в панель" : "Регистрация"}</h2>
            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <>
                  <input placeholder="Имя" value={authData.first_name} onChange={e => setAuthData({...authData, first_name: e.target.value})} required />
                  <input placeholder="Фамилия" value={authData.last_name} onChange={e => setAuthData({...authData, last_name: e.target.value})} required />
                </>
              )}
              <input type="email" placeholder="Email" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} required />
              <input type="password" placeholder="Пароль" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} required />
              
              <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>
                {authMode === "login" ? "Войти" : "Зарегистрироваться"}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === "login" ? (
                <>Нет аккаунта? <span onClick={() => setAuthMode("register")}>Создать</span></>
              ) : (
                <>Уже есть аккаунт? <span onClick={() => setAuthMode("login")}>Войти</span></>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;