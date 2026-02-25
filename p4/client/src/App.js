import React, { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Добавили поле image
  const [formData, setFormData] = useState({ 
    name: "", category: "", description: "", price: "", stock: "", image: "" 
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getAll();
      setProducts(data);
    } catch (err) { alert("Ошибка загрузки!"); }
  };

  const handleOpen = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ 
        name: item.name, 
        category: item.category, 
        description: item.description, 
        price: item.price, 
        stock: item.stock,
        image: item.image || "" // Загружаем картинку если есть
      });
    } else {
      setFormData({ name: "", category: "", description: "", price: "", stock: "", image: "" });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.update(editingItem.id, formData);
      } else {
        await api.create(formData);
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) { alert("Ошибка сохранения!"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Удалить эту клавиатуру?")) {
      await api.delete(id);
      loadProducts();
    }
  };

  return (
    <div className="container">
      <h1>Keyboards.Store</h1>
      <div className="subtitle">Премиальные механические клавиатуры</div>
      
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => handleOpen(null)}>+ Добавить товар</button>
      </div>

      <div className="product-list">
        {products.map((p) => (
          <div key={p.id} className="product-card">
            
            {/* Блок с картинкой */}
            <div className="card-image-container">
               <span className="category-tag">{p.category}</span>
               <img 
                 src={p.image || "https://via.placeholder.com/400x300"} 
                 alt={p.name} 
                 className="product-image" 
               />
            </div>

            <div className="product-info">
              <h3>{p.name}</h3>
              <div className="description">{p.description}</div>
              
              <div className="meta-row">
                <span> Склад: {p.stock}</span>
                <span> Оценка: {p.rating}</span>
              </div>

              <div className="price-row">
                <span className="price">${p.price}</span>
                <div className="action-buttons">
                  <button className="btn-icon btn-edit" onClick={() => handleOpen(p)} title="Edit">✎</button>
                  <button className="btn-icon btn-delete" onClick={() => handleDelete(p.id)} title="Delete">🗑</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingItem ? "Редактировать товар" : "Новый товар"}</h2>
            <form onSubmit={handleSubmit}>
              <input placeholder="Название модели" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input placeholder="Категория (Gaming, Office...)" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
              
              {/* Новое поле для картинки */}
              <input placeholder="Ссылка на картинку (URL)" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
              
              <textarea placeholder="Описание товара" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              
              <div style={{display: 'flex', gap: '10px'}}>
                <input type="number" placeholder="Цена ($)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                <input type="number" placeholder="Кол-во" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;