const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./app-azienda.db', (err) => {
  if (err) {
    console.error('Errore durante l\'apertura del database:', err.message);
  } else {
    console.log('Connessione al database riuscita.');
  }
});

const inserisciDati = async (clienteNome, materiale, tipo, dimensioni, qty, unit, dataCreazione) => {
  db.serialize(() => {
    // Controlla se il cliente esiste già
    db.get(`SELECT id FROM clienti WHERE nome = ?`, [clienteNome], (err, row) => {
      if (err) {
        console.error('Errore durante la ricerca del cliente:', err.message);
        return;
      }

      const clienteId = row ? row.id : null;

      if (clienteId) {
        // Inserisci la richiesta
        inserisciRichiesta(clienteId, materiale, tipo, dimensioni, qty, unit, dataCreazione);
      } else {
        // Inserisci il cliente e poi la richiesta
        db.run('INSERT INTO clienti (nome) VALUES (?)', [clienteNome], function (err) {
          if (err) {
            console.error('Errore durante l\'inserimento del cliente:', err.message);
            return;
          }
          console.log(`Cliente "${clienteNome}" inserito con ID: ${this.lastID}`);
          inserisciRichiesta(this.lastID, materiale, tipo, dimensioni, qty, unit, dataCreazione);
        });
      }
    });
  });

  const inserisciRichiesta = (clienteId, materiale, tipo, dimensioni, qty, unit, dataCreazione) => {
    db.run(
      `INSERT INTO richieste (cliente_id, materiale, tipo, dimensioni, qty, unit, data_creazione, archiviata)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [clienteId, materiale, tipo, dimensioni, qty, unit, dataCreazione],
      function (err) {
        if (err) {
          console.error('Errore durante l\'inserimento della richiesta:', err.message);
        } else {
          console.log('Richiesta inserita con successo.');
        }
      }
    );
  };

  db.close((err) => {
    if (err) {
      console.error('Errore durante la chiusura del database:', err.message);
    } else {
      console.log('Connessione al database chiusa.');
    }
  });
};

// Esempio di dati da inserire
inserisciDati(
  'NOME_CLIENTE',
  'MATERIALE',
  'TIPO',
  'DIMENSIONI',
  100,
  'MQ',
  '2025-01-17'
);
