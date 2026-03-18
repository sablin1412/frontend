import React, { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState("products"); // products или users
  
  // Состояния для модалки товаров
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", category: "", description: "", price: "", stock: "", image: "" });

  // Состояния для авторизации
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({ email: "", password: "", first_name: "", last_name: "" });

  useEffect(() => {
    loadProducts();
    checkAuth();
  }, []);

  const loadProducts = async () => {
    try { setProducts(await api.getAll()); } 
    catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try { setUsers(await api.getUsers()); } 
    catch (err) { console.error("Ошибка загрузки пользователей"); }
  };

  const checkAuth = async () => {
    if (localStorage.getItem("accessToken")) {
      try { setCurrentUser(await api.getMe()); } 
      catch (err) { setCurrentUser(null); }
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === "register") {
        await api.register(authData);
        alert("Регистрация успешна! Теперь войдите.");
        setAuthMode("login");
      } else {
        const res = await api.login({ email: authData.email, password: authData.password });
        localStorage.setItem("accessToken", res.accessToken); 
        localStorage.setItem("refreshToken", res.refreshToken); 
        setAuthModalOpen(false);
        checkAuth(); 
      }
    } catch (err) { alert(err.response?.data?.error || "Ошибка авторизации"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setCurrentUser(null);
    setViewMode("products");
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
    } catch (err) { alert("Ошибка сохранения. Проверьте права."); }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Удалить этот товар?")) {
      try { 
        await api.delete(id); 
        loadProducts(); 
      } catch (err) { alert("У вас нет прав администратора на удаление!"); }
    }
  };

  // --- ЛОГИКА ПОЛЬЗОВАТЕЛЕЙ (Для Админа) ---
  const handleDeleteUser = async (id) => {
    if (window.confirm("Заблокировать/удалить пользователя?")) {
      try {
        await api.deleteUser(id);
        loadUsers();
      } catch (err) { alert("Ошибка удаления пользователя"); }
    }
  };

  // Проверка прав (RBAC)
  const isSellerOrAdmin = currentUser && (currentUser.role === 'seller' || currentUser.role === 'admin');
  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <div className="container">
      
      {/* ШАПКА */}
      <div className="header-top">
        <div style={{fontWeight: '800', color: '#fff'}}>KS.</div>
        {currentUser ? (
          <div className="user-profile">
            <div>Привет, <span>{currentUser.first_name}</span> <span style={{color: '#8b5cf6', fontSize: '0.8rem'}}>({currentUser.role})</span></div>
            
            {/* Кнопка переключения панелей только для Админа */}
            {isAdmin && (
              <button 
                className="btn btn-secondary" 
                onClick={() => { 
                  const newMode = viewMode === 'products' ? 'users' : 'products';
                  setViewMode(newMode); 
                  if(newMode === 'users') loadUsers(); 
                }}
              >
                {viewMode === 'products' ? 'Управление юзерами' : 'К товарам'}
              </button>
            )}

            <button className="btn btn-secondary" onClick={handleLogout}>Выйти</button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn btn-secondary" onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }}>Войти</button>
            <button className="btn btn-primary" onClick={() => { setAuthMode("register"); setAuthModalOpen(true); }}>Регистрация</button>
          </div>
        )}
      </div>

      <h1 className="header-title">{viewMode === 'products' ? 'KEYBOARD.STORE' : 'ПАНЕЛЬ АДМИНИСТРАТОРА'}</h1>
      
      {/* ========================================= */}
      {/* РЕЖИМ 1: ТОВАРЫ */}
      {/* ========================================= */}
      {viewMode === 'products' && (
        <>
          {/* Кнопка добавления только для Продавца и Админа */}
          {isSellerOrAdmin && (
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
                  <div className="meta-info"><span>📦 {p.stock} шт.</span></div>

                  <div className="price-row">
                    <span className="price">${p.price}</span>
                    
                    <div className="action-buttons">
                      {/* Редактировать могут Продавец и Админ */}
                      {isSellerOrAdmin && <button className="btn-icon btn-edit" onClick={() => handleOpenProduct(p)}>✎</button>}
                      {/* Удалять может ТОЛЬКО Админ */}
                      {isAdmin && <button className="btn-icon btn-delete" onClick={() => handleDeleteProduct(p.id)}>🗑</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ========================================= */}
      {/* РЕЖИМ 2: ПОЛЬЗОВАТЕЛИ (Только для Админа) */}
      {/* ========================================= */}
      {viewMode === 'users' && isAdmin && (
        <div className="product-list">
          {users.map(u => (
            <div key={u.id} className="product-card" style={{padding: '24px'}}>
              <h3 style={{margin: '0 0 5px 0', color: 'white'}}>{u.first_name} {u.last_name}</h3>
              <div style={{color: '#a3a3a3', marginBottom: '15px'}}>{u.email}</div>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #262626', paddingTop: '15px'}}>
                <span style={{background: '#262626', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'white'}}>{u.role}</span>
                {u.id !== currentUser?.id && (
                  <button className="btn btn-secondary" onClick={() => handleDeleteUser(u.id)} style={{color: '#ef4444'}}>
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================= */}
      {/* ВСПЛЫВАЮЩЕЕ ОКНО: ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ ТОВАРА */}
      {/* ========================================= */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingItem ? "Редактировать товар" : "Новый товар"}</h2>
            <form onSubmit={handleProductSubmit}>
              <input placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input placeholder="Категория" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
              <input placeholder="Ссылка на фото (URL)" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
              <textarea placeholder="Описание" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              <div style={{display: 'flex', gap: '22px'}}>
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

      {/* ========================================= */}
      {/* ВСПЛЫВАЮЩЕЕ ОКНО: АВТОРИЗАЦИЯ */}
      {/* ========================================= */}
      {authModalOpen && (
        <div className="auth-modal-backdrop" onClick={() => setAuthModalOpen(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <h2>{authMode === "login" ? "Вход в систему" : "Регистрация"}</h2>
            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <>
                  <input placeholder="Имя" value={authData.first_name} onChange={e => setAuthData({...authData, first_name: e.target.value})} required />
                  <input placeholder="Фамилия" value={authData.last_name} onChange={e => setAuthData({...authData, last_name: e.target.value})} required />
                </>
              )}
              <input type="email" placeholder="Email" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} required />
              <input type="password" placeholder="Пароль" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} required />
              
              <button type="submit" className="btn btn-primary" style={{marginTop: '15px'}}>
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