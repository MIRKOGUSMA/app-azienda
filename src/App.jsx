import React, { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const PROCESSING_STEPS = {
  FILIERA: ["FILO", "FRESE", "SPESSORI", "FILAGNE", "INTEST."],
  MARMERIA: [
    "Granigliatrice",
    "Smusso",
    "Lavorazione Manuale",
    "Spazzolatura",
    "Lucidatura",
  ],
  SPACCATRICE: ["Grezzo", "Blocco", "Taglio", "Rifinitura", "Controllo Qualità"],
};

const App = () => {
  const [requests, setRequests] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState({});
  const [rowEntries, setRowEntries] = useState([
    {
      data: new Date().toISOString().split('T')[0],
      values: {}
    }
  ]);
  const [newRequest, setNewRequest] = useState({
    cliente: "",
    codiceCliente: "",
    materiale: "",
    tipo: "",
    dimensioni: "",
    qty: "",
    unit: "",
    data: "",
  });
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [showArchived]);

  useEffect(() => {
    if (!modalIsOpen) {
      setRowEntries([{
        data: new Date().toISOString().split('T')[0],
        values: {}
      }]);
    }
  }, [modalIsOpen]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        showArchived ? "/api/archived-requests" : "/api/requests"
      );
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Errore durante il recupero delle richieste:", error);
    }
  };

  const handleCheckboxChange = async (id, completed) => {
    try {
      const response = await fetch("/api/update-completed", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, completed }),
      });

      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato completato:", error);
    }
  };

  const handleOpenModal = async (request, section) => {
    setCurrentRequest(request);
    setCurrentSection(section);

    if (section === 'FILIERA') {
      try {
        const response = await fetch(`/api/filiera/${request.id}`);
        const data = await response.json();
        if (data.length > 0) {
          setRowEntries(data.map(entry => ({
            data: entry.data.split('T')[0],
            values: {
              FILO: entry.filo,
              FRESE: entry.frese,
              SPESSORI: entry.spessori,
              FILAGNE: entry.filagne,
              INTEST: entry.intest
            }
          })));
        }
      } catch (error) {
        console.error("Errore nel recupero dati filiera:", error);
      }
    } else {
      const sectionData = request.steps?.[section] || {};
      setNotes(sectionData.notes || "");
      setQuantities(sectionData.quantities || {});
    }
    
    setModalIsOpen(true);
  };

  const calculateRowTotal = (values) => {
    return values.INTEST || 0;
  };

  const calculateTotalIntest = () => {
    return rowEntries.reduce((sum, row) => sum + (parseFloat(row.values.INTEST) || 0), 0);
  };

  const addNewRow = () => {
    setRowEntries([...rowEntries, {
      data: new Date().toISOString().split('T')[0],
      values: {}
    }]);
  };

  const handleSaveSection = async () => {
    if (!currentRequest || !currentSection) return;
    
    const updatedEntries = rowEntries.filter(entry => 
      Object.values(entry.values).some(v => v !== null && v !== '')
    );
  
    try {
      const response = await fetch('/api/filiera-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: currentRequest.id,
          entries: updatedEntries,
          notes
        }),
      });
  
      if (!response.ok) throw new Error('Errore nel salvataggio');
      await fetchRequests();
    } catch (error) {
      console.error("Errore:", error);
    }
  };

  const handleNewRequest = async () => {
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
  
      if (!response.ok) throw new Error('Errore nella richiesta');
      await fetchRequests();
      setNewRequest({
        cliente: "",
        codiceCliente: "",
        materiale: "",
        tipo: "",
        dimensioni: "",
        qty: "",
        unit: "",
        data: "",
      });
    } catch (error) {
      console.error("Errore:", error);
    }
  };
  
  
  const handleArchive = async (id) => {
    try {
      await fetch("/api/archive-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      fetchRequests();
    } catch (error) {
      console.error("Errore durante l'archiviazione della richiesta:", error);
    }
  };

  const handleRestore = async (id) => {
    try {
      await fetch("/api/restore-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      fetchRequests();
    } catch (error) {
      console.error("Errore durante il ripristino della richiesta:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Sei sicuro di voler eliminare questa richiesta?")) return;
    
    try {
      const response = await fetch("/api/delete-request", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Errore durante la cancellazione:", error);
    }
  };

  const renderModalContent = () => {
    if (currentSection === 'FILIERA') {
      return (
        <div>
          <table className="w-full mb-3 border">
            <thead>
              <tr>
                <th className="border p-2">note</th>
                {PROCESSING_STEPS.FILIERA.map(step => (
                  <th key={step} className="border p-2">{step}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowEntries.map((row, index) => (
                <tr key={index}>
                  <td className="border p-2">
                    <input
                      type="date"
                      value={row.data}
                      onChange={(e) => {
                        const newEntries = [...rowEntries];
                        newEntries[index].data = e.target.value;
                        setRowEntries(newEntries);
                      }}
                      className="w-full p-1"
                    />
                  </td>
                  {PROCESSING_STEPS.FILIERA.map((step) => (
                    <td key={step} className="border p-2">
                      <input
                        type="number"
                        value={row.values[step] || ''}
                        onChange={(e) => {
                          const newEntries = [...rowEntries];
                          newEntries[index].values = {
                            ...newEntries[index].values,
                            [step]: e.target.value
                          };
                          setRowEntries(newEntries);
                        }}
                        className="w-full p-1"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={PROCESSING_STEPS.FILIERA.length} className="border p-2 text-right font-bold">
                  Totale INTEST:
                </td>
                <td className="border p-2 bg-green-100 font-bold text-center">
                  {rowEntries.reduce((total, row) => total + (parseFloat(row.values.INTEST) || 0), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
          
          <button
            onClick={addNewRow}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
          >
            Aggiungi Riga
          </button>
  
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note..."
            className="w-full p-2 border rounded mb-3"
            rows={4}
          />
        </div>
      );
    }
    // ... resto del codice invariato
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestione Richieste</h1>

      <div className="mb-6 bg-white p-4 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">Aggiungi Nuova Richiesta</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Cliente"
            value={newRequest.cliente}
            onChange={(e) =>
              setNewRequest({ ...newRequest, cliente: e.target.value })
            }
            className="p-2 border rounded"
            />
          <input
            type="text"
            placeholder="COD.CLIENTE"
            value={newRequest.codiceCliente}
            onChange={(e) => setNewRequest({...newRequest, codiceCliente: e.target.value})}
             className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Materiale"
            value={newRequest.materiale}
            onChange={(e) =>
              setNewRequest({ ...newRequest, materiale: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Tipo"
            value={newRequest.tipo}
            onChange={(e) =>
              setNewRequest({ ...newRequest, tipo: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Dimensioni"
            value={newRequest.dimensioni}
            onChange={(e) =>
              setNewRequest({ ...newRequest, dimensioni: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Quantità"
            value={newRequest.qty}
            onChange={(e) =>
              setNewRequest({ ...newRequest, qty: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Unità"
            value={newRequest.unit}
            onChange={(e) =>
              setNewRequest({ ...newRequest, unit: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={newRequest.data}
            onChange={(e) =>
              setNewRequest({ ...newRequest, data: e.target.value })
            }
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={handleNewRequest}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Aggiungi Richiesta
        </button>
      </div>

      <button
        onClick={() => {
          setShowArchived(!showArchived);
          fetchRequests();
        }}
        className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        {showArchived ? "Mostra Richieste Attive" : "Mostra Archiviate"}
      </button>

      <div className="bg-white shadow-sm rounded overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Cliente</th>
              <th className="p-2 border">COD.CLIENTE</th>
              <th className="p-2 border">Materiale</th>
              <th className="p-2 border">Tipo</th>
              <th className="p-2 border">Dimensioni</th>
              <th className="p-2 border">Quantità</th>
              <th className="p-2 border">Unità</th>
              <th className="p-2 border">Data</th>
              {Object.keys(PROCESSING_STEPS).map((section) => (
                <th key={section} className="p-2 border">
                {section}
              </th>
            ))}
            <th className="p-2 border">COMPLETATO</th>
            <th className="p-2 border">RIMANENTE</th>
            <th className="p-2 border">Stato</th>
            <th className="p-2 border">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="border">
              <td className="p-2 border">{req.cliente}</td>
              <td className="p-2 border">{req.codice}</td> 
              <td className="p-2 border">{req.materiale}</td>
              <td className="p-2 border">{req.tipo}</td>
              <td className="p-2 border">{req.dimensioni}</td>
              <td className="p-2 border">{req.qty}</td>
              <td className="p-2 border">{req.unit}</td>
              <td className="p-2 border">
                {req.data ? new Date(req.data).toLocaleDateString('it-IT') : ''}
              </td>
              {Object.keys(PROCESSING_STEPS).map((section) => (
                <td
                  key={section}
                  onClick={() => handleOpenModal(req, section)}
                  className={`p-2 border text-center cursor-pointer hover:bg-blue-50 ${
                    req.steps?.[section]?.notes ? "bg-blue-100" : ""
                  }`}
                >
                  {req.steps?.[section]?.notes || ""}
                </td>
              ))}
              <td className="p-2 border text-center">
                {req.completato || 0}
              </td>
              <td className="p-2 border text-center">
                {req.qty - (req.completato || 0)}
              </td>
              <td className="p-2 border text-center">
                <input
                  type="checkbox"
                  checked={req.completed}
                  onChange={(e) => handleCheckboxChange(req.id, e.target.checked)}
                  className="h-4 w-4"
                />
              </td>
              <td className="p-2 border text-center">
                {showArchived ? (
                  <button
                    onClick={() => handleRestore(req.id)}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Ripristina
                  </button>
                ) : (
                  <button
                    onClick={() => req.completed && handleArchive(req.id)}
                    disabled={!req.completed}
                    className={`px-2 py-1 rounded ${
                      req.completed
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Archivia
                  </button>
                )}
                <button
                  onClick={() => handleDelete(req.id)}
                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Cancella
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <Modal
      isOpen={modalIsOpen}
      onRequestClose={() => setModalIsOpen(false)}
      className="w-1/2 p-4 mx-auto bg-white border rounded"
    >
      <div className="relative">
        <h3 className="text-lg font-semibold mb-4">{currentSection}</h3>
        {renderModalContent()}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleSaveSection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Salva
          </button>
          <button
            onClick={() => setModalIsOpen(false)}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Annulla
          </button>
        </div>
      </div>
    </Modal>
  </div>
);
};

export default App;