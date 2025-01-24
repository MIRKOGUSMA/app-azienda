const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Connessione al database
const db = new sqlite3.Database("./app-azienda.db", (err) => {
  if (err) {
    console.error("Errore durante la connessione al database:", err.message);
  } else {
    console.log("Connessione al database riuscita.");
  }
});

// Endpoint per recuperare tutte le richieste attive
app.get("/api/requests", (req, res) => {
  // In /api/requests
  const query = `
    SELECT r.*, c.nome AS cliente, c.codice,
      (SELECT COALESCE(SUM(intest), 0) FROM filiera_steps WHERE richiesta_id = r.id) as completato,
      (r.qty - (SELECT COALESCE(SUM(intest), 0) FROM filiera_steps WHERE richiesta_id = r.id)) as rimanente
    FROM richieste r
    JOIN clienti c ON r.cliente_id = c.id
    WHERE r.archiviata = 0
  `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Errore durante il recupero delle richieste:", err.message);
        return res.status(500).json({ error: "Errore durante il recupero delle richieste" });
      }
      
      const requests = rows.map((row) => ({
        ...row,
        steps: row.steps ? JSON.parse(row.steps) : {},
        completato: row.completato || 0,
        rimanente: parseInt(row.qty) - (row.completato || 0)
      }));
      res.json(requests);
    });
  });

// Endpoint per recuperare i dati della filiera
app.get("/api/filiera/:requestId", (req, res) => {
  const { requestId } = req.params;
  
  db.all(
    `SELECT * FROM filiera_steps WHERE richiesta_id = ? ORDER BY data DESC`,
    [requestId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const formattedRows = rows.map(row => ({
        data: row.data,
        values: {
          FILO: parseFloat(row.filo) || 0,
          FRESE: parseFloat(row.frese) || 0,
          SPESSORI: parseFloat(row.spessori) || 0,
          FILAGNE: parseFloat(row.filagne) || 0,
          INTEST: parseFloat(row.intest) || 0
        }
      }));
      
      res.json(formattedRows);
    }
  );
});

// Endpoint per salvare i dati della filiera
app.post("/api/filiera-entries", (req, res) => {
  const { requestId, entries, notes } = req.body;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    try {
      entries.forEach(entry => {
        const values = [
          requestId,
          entry.data,
          Number(entry.values.FILO),
          Number(entry.values.FRESE),
          Number(entry.values.SPESSORI),
          Number(entry.values.FILAGNE),
          Number(entry.values.INTEST),
          notes
        ];

        db.run(`
          INSERT OR REPLACE INTO filiera_steps 
          (richiesta_id, data, filo, frese, spessori, filagne, intest, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, values);
      });

      db.run("COMMIT", err => {
        if (err) throw err;
        res.json({ success: true });
      });
    } catch (error) {
      db.run("ROLLBACK");
      res.status(500).json({ error: error.message });
    }
  });
});

// Modifica gli endpoint di archivio/ripristino/cancellazione
app.post("/api/archive-request", (req, res) => {
  db.run("UPDATE richieste SET archiviata = 1 WHERE id = ?", [req.body.id], 
    err => err ? res.status(500).json({ error: err.message }) : res.json({ success: true }));
});

app.post("/api/restore-request", (req, res) => {
  db.run("UPDATE richieste SET archiviata = 0 WHERE id = ?", [req.body.id],
    err => err ? res.status(500).json({ error: err.message }) : res.json({ success: true }));
});

app.delete("/api/delete-request", (req, res) => {
  db.run("DELETE FROM richieste WHERE id = ?", [req.body.id],
    err => err ? res.status(500).json({ error: err.message }) : res.json({ success: true }));
});


// Endpoint per aggiungere una nuova richiesta
app.post("/api/requests", (req, res) => {
  const { cliente, codiceCliente, materiale, tipo, dimensioni, qty, unit, data } = req.body;
  console.log("Body ricevuto:", req.body);  // Qui

  db.serialize(() => {
    db.get(`SELECT id FROM clienti WHERE nome = ?`, [cliente], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const saveRequest = (clienteId) => {
        db.run(
          `INSERT INTO richieste (cliente_id, materiale, tipo, dimensioni, qty, unit, data_creazione, archiviata, completed, steps)
           VALUES (?, ?, ?, ?, ?, ?, date(?), 0, 0, ?)`,
          [clienteId, materiale, tipo, dimensioni, qty, unit, data, JSON.stringify({})],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
              id: this.lastID,
              cliente,
              codiceCliente,
              materiale,
              tipo,
              dimensioni,
              qty,
              unit,
              data_creazione: data,
              completed: 0,
              steps: {}
            });
          }
        );
      };

      if (row) {
        saveRequest(row.id);
      } else {
        db.run(`INSERT INTO clienti (nome, codice) VALUES (?, ?)`, [cliente, codiceCliente],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            saveRequest(this.lastID);
          }
        );
      }
    });
  });
});

// Endpoint per aggiornare lo stato 'completed'
app.put("/api/update-completed", (req, res) => {
  const { id, completed } = req.body;

  db.run(
    `UPDATE richieste SET completed = ? WHERE id = ?`,
    [completed ? 1 : 0, id],
    function (err) {
      if (err) {
        console.error("Errore durante l'aggiornamento di 'completed':", err.message);
        res.status(500).json({ error: "Errore durante l'aggiornamento dello stato 'completed'" });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Endpoint per aggiornare una richiesta (sezioni non-FILIERA)
app.put("/api/update-request", (req, res) => {
  const { id, section, notes, quantities } = req.body;

  db.get(`SELECT steps FROM richieste WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error("Errore durante la ricerca della richiesta:", err.message);
      res.status(500).json({ error: "Errore durante la ricerca della richiesta" });
      return;
    }

    if (!row) {
      res.status(404).json({ error: "Richiesta non trovata" });
      return;
    }

    const steps = row.steps ? JSON.parse(row.steps) : {};
    steps[section] = { notes, quantities };

    db.run(
      `UPDATE richieste SET steps = ? WHERE id = ?`,
      [JSON.stringify(steps), id],
      function (err) {
        if (err) {
          console.error("Errore durante l'aggiornamento della richiesta:", err.message);
          res.status(500).json({ error: "Errore durante l'aggiornamento della richiesta" });
        } else {
          res.json({ success: true });
        }
      }
    );
  });
});

// Endpoint per archiviazione
app.post("/api/archive-request", (req, res) => {
  db.run("UPDATE richieste SET archiviata = 1 WHERE id = ?", [req.body.id], 
    err => err ? res.status(500).json({ error: err.message }) : res.json({ success: true }));
});

// Endpoint per ripristino
app.post("/api/restore-request", (req, res) => {
  db.run("UPDATE richieste SET archiviata = 0 WHERE id = ?", [req.body.id],
    err => err ? res.status(500).json({ error: err.message }) : res.json({ success: true }));
});

// Endpoint per cancellazione
app.delete("/api/delete-request", (req, res) => {
  db.run("DELETE FROM richieste WHERE id = ?", [req.body.id],
    err => err ? res.status(500).json({ error: err.message }) : res.json({ success: true }));
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});