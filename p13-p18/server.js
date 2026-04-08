const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// ⚠️ ВАЖНО: Вставь сюда свои ключи, иначе пуши не будут работать!
const vapidKeys = {
  publicKey: 'BHBF5lL8dAg1xJFHIl2-DlSJ6FnSUhFBZiGpYMO9J9TJ04xT5oJpYTzG9xZECq84txm8DAUgMFi-1qRhuxDSJko', // [cite: 719]
  privateKey: 'hoR_nEzWRchD3PJsfJStcnxNd-VtmrvamJZMDaNAL8U' // [cite: 720]
};

webpush.setVapidDetails(
  'mailto:test@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Читаем сгенерированные тобой сертификаты для HTTPS
const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem')
};

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];
const reminders = new Map(); // Хранилище активных таймеров напоминаний

// Запускаем именно HTTPS сервер
const server = https.createServer(options, app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);
  
  // Рассылка обычной задачи всем пользователям
  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);
  });

  // Обработка задачи с точным временем (напоминание)
  socket.on('newReminder', (reminder) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();
    
    if (delay <= 0) return; // Если время уже прошло, ничего не делаем

    // Запускаем таймер на сервере
    const timeoutId = setTimeout(() => {
      const payload = JSON.stringify({
        title: '⏰ Напоминание!',
        body: text,
        reminderId: id
      });
      
      // Отправляем пуш всем подписанным
      subscriptions.forEach(sub => {
        webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
      });
      
      // Удаляем из памяти после отправки
      reminders.delete(id);
    }, delay);

    // Сохраняем таймер, чтобы его можно было отменить/отложить
    reminders.set(id, { timeoutId, text, reminderTime });
  });

  socket.on('disconnect', () => console.log('Клиент отключён:', socket.id));
});

// === Эндпоинты для Push-уведомлений ===

app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

// Эндпоинт для кнопки "Отложить на 5 минут" (Snooze)
app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);
  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId); // Отменяем старый таймер

  const newDelay = 5 * 60 * 1000; // Ровно 5 минут в миллисекундах
  
  // Создаем новый таймер
  const newTimeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: '⏰ Напоминание отложено',
      body: reminder.text,
      reminderId: reminderId
    });
    
    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
    });
    
    reminders.delete(reminderId);
  }, newDelay);

  // Обновляем таймер в хранилище
  reminders.set(reminderId, { timeoutId: newTimeoutId, text: reminder.text, reminderTime: Date.now() + newDelay });
  res.status(200).json({ message: 'Snoozed for 5 minutes' });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`🚀 Сервер защищен! Заходи на https://localhost:${PORT}`));