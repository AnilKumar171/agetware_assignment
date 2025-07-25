const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bank.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the bank.db SQLite database.');
});

module.exports = db;