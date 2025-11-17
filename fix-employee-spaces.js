const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/messenger.db');

// Исправление лишних пробелов в именах сотрудников
db.run('UPDATE employees SET first_name = TRIM(REPLACE(first_name, "  ", " ")), last_name = TRIM(REPLACE(last_name, "  ", " "))', 
  function(err) {
    if (err) { 
      console.error('Ошибка:', err); 
      db.close();
      process.exit(1);
    } else {
      console.log('✅ Исправлено записей:', this.changes);
      
      // Показываем исправленные имена
      db.all('SELECT id, first_name, last_name FROM employees', (err2, rows) => {
        if (err2) {
          console.error('Ошибка получения данных:', err2);
        } else {
          console.log('\nИсправленные имена:');
          rows.forEach(r => {
            console.log(`  ID: ${r.id}, Имя: '${r.first_name} ${r.last_name}'`);
          });
        }
        db.close();
        process.exit(0);
      });
    }
  }
);

