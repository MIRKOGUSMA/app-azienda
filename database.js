const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./app-azienda.db", (err) => {
  if (err) {
    console.error("Errore durante la connessione al database:", err.message);
  } else {
    console.log("Connessione al database riuscita.");
  }
});

// Esegui le migrazioni necessarie
db.serialize(() => {
  // Aggiungi la colonna `archiviata` se non esiste
  db.run(`ALTER TABLE richieste ADD COLUMN archiviata INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Errore durante l'aggiunta della colonna `archiviata`:", err.message);
    } else {
      console.log("Colonna `archiviata` aggiunta o già esistente.");
    }
  });

  // Crea la tabella filiera_steps
  db.run(`CREATE TABLE IF NOT EXISTS filiera_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    richiesta_id INTEGER NOT NULL,
    data DATE NOT NULL,
    filo DECIMAL(10,2),
    frese DECIMAL(10,2),
    spessori DECIMAL(10,2),
    filagne DECIMAL(10,2),
    intest DECIMAL(10,2),
    note TEXT,
    FOREIGN KEY (richiesta_id) REFERENCES richieste(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error("Errore durante la creazione della tabella filiera_steps:", err.message);
    } else {
      console.log("Tabella filiera_steps creata o già esistente.");
    }
  });

  // Assicurati che la tabella richieste abbia tutti i campi necessari
  db.run(`CREATE TABLE IF NOT EXISTS richieste (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    materiale TEXT,
    tipo TEXT,
    dimensioni TEXT,
    qty INTEGER,
    unit TEXT,
    data_creazione DATE,
    archiviata INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    steps TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clienti(id)
  )`, (err) => {
    if (err) {
      console.error("Errore durante la creazione della tabella richieste:", err.message);
    } else {
      console.log("Tabella richieste creata o già esistente.");
    }
  });

  // Assicurati che la tabella clienti esista
  db.run(`CREATE TABLE IF NOT EXISTS clienti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE NOT NULL
  )`, (err) => {
    if (err) {
      console.error("Errore durante la creazione della tabella clienti:", err.message);
    } else {
      console.log("Tabella clienti creata o già esistente.");
    }
  });

  // Aggiungi indici per migliorare le performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_filiera_steps_richiesta_id 
    ON filiera_steps(richiesta_id)`, (err) => {
    if (err) {
      console.error("Errore durante la creazione dell'indice:", err.message);
    }
  });
});

// Funzione di utilità per creare una connessione al database
const getConnection = () => {
  return new sqlite3.Database("./app-azienda.db", (err) => {
    if (err) {
      console.error("Errore durante la connessione al database:", err.message);
    }
  });
};

db.close((err) => {
  if (err) {
    console.error("Errore durante la chiusura della connessione al database:", err.message);
  } else {
    console.log("Connessione al database chiusa.");
  }
});

module.exports = {
  getConnection
};