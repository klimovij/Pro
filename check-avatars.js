const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('/app/messenger.db');

console.log('\n🔍 Проверка и исправление аватаров:\n');
console.log('='.repeat(80));

// Получаем всех пользователей с аватарами
db.all('SELECT id, username, avatar FROM users WHERE avatar != ""', (err, rows) => {
  if (err) {
    console.error('❌ Ошибка:', err);
    db.close();
    process.exit(1);
  }

  const avatarsDir = '/app/uploads/avatars';
  const filesInDir = fs.existsSync(avatarsDir) ? fs.readdirSync(avatarsDir) : [];

  console.log(`\n📁 Файлов в папке: ${filesInDir.length}`);
  filesInDir.forEach(file => {
    console.log(`   - ${file}`);
  });

  console.log(`\n👥 Пользователей с аватарами: ${rows.length}\n`);

  let fixedCount = 0;
  const updates = [];

  rows.forEach(user => {
    if (user.avatar) {
      const avatarPath = path.join('/app', user.avatar);
      const exists = fs.existsSync(avatarPath);
      const status = exists ? '✅' : '❌';
      
      console.log(`${status} ID:${user.id.toString().padStart(2)} | ${(user.username || '').padEnd(30)} | ${user.avatar}`);
      
      if (!exists) {
        // Ищем файл без префикса avatar-
        const filename = path.basename(user.avatar);
        const filenameWithoutPrefix = filename.replace(/^avatar-/, '');
        
        // Пробуем найти файл по части имени (timestamp)
        const timestamp = filenameWithoutPrefix.split('-')[0];
        const match = filesInDir.find(f => f.startsWith(timestamp));
        
        if (match) {
          console.log(`   ⚠️  Найден похожий файл: ${match}`);
          const newPath = `/uploads/avatars/${match}`;
          console.log(`   💡 Обновляю путь на: ${newPath}`);
          updates.push({ id: user.id, newPath: newPath });
        } else {
          // Файл не найден - очищаем путь в базе
          console.log(`   ⚠️  Файл не найден - очищаю путь в базе`);
          updates.push({ id: user.id, newPath: '' });
        }
      }
    }
  });

  // Применяем обновления
  if (updates.length > 0) {
    console.log(`\n🔧 Исправляю ${updates.length} путей...\n`);
    let completed = 0;
    updates.forEach(update => {
      db.run('UPDATE users SET avatar = ? WHERE id = ?', [update.newPath, update.id], function(err) {
        if (err) {
          console.error(`❌ Ошибка обновления ID ${update.id}:`, err);
        } else {
          fixedCount++;
          console.log(`✅ Обновлен ID ${update.id}: ${update.newPath}`);
        }
        completed++;
        if (completed === updates.length) {
          console.log(`\n✅ Исправлено путей: ${fixedCount} из ${updates.length}`);
          db.close();
          process.exit(0);
        }
      });
    });
  } else {
    console.log('\n✅ Все пути корректны!');
    db.close();
    process.exit(0);
  }
});

