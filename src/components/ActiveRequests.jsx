import React, { useState, useEffect } from "react";
import Modal from 'react-modal';
import ConfirmDialog from './ConfirmDialog';

const SEGHERIA_STEPS = ["FILO", "FRESE", "SPESSORI", "FILAGNE", "INTESTATE"];
const MARMERIA_STEPS = [
  "GRANIGLIATRICE", "SMUSSO", "LAVORAZIONE MANUALE", "SPAZZOLATURA",
  "LUCIDATURA", "LEVIGATURA", "GOCCIOLATOIO", "BISELLO", "SIGARETTA",
  "TORO", "MEZZO TORO",
];
const PROCESSING_STEPS = ["SEGHERIA", "MARMERIA", "SPACCATRICE"];

const modalStyle = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  }
};

const ActiveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [requestToArchive, setRequestToArchive] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState({});
  const [clients, setClients] = useState([]);
  const [newRequest, setNewRequest] = useState({
    cliente: "",
    codiceCliente: "",
    numeroPR: "",
    ordineCL: "",
    data_creazione: "", 
    materiale: "",
    tipo: "",
    dimensioni: "",
    qty: "",
    unit: "",
    completed: false,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Errore nel recupero dei clienti:', error);
    }
  };

  const handleComplete = (requestId) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, completed: !req.completed }
        : req
    ));
  };

  const handleArchiveClick = (request) => {
    if (!request.completed) {
      alert('Solo le richieste completate possono essere archiviate');
      return;
    }
    setRequestToArchive(request);
    setConfirmDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    try {
      await fetch('/api/archive-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestToArchive),
      });
      
      setRequests(prev => prev.filter(req => req.id !== requestToArchive.id));
      setConfirmDialogOpen(false);
      setRequestToArchive(null);
    } catch (error) {
      console.error('Errore durante l\'archiviazione:', error);
      alert('Errore durante l\'archiviazione della richiesta');
    }
  };

  const handleCellClick = (request, section) => {
    if (request.completed) {
      alert('Non puoi modificare una richiesta completata');
      return;
    }
    setCurrentRequest(request);
    setCurrentSection(section);
    if (request.steps?.[section]) {
      setNotes(request.steps[section].notes || "");
      setQuantities(request.steps[section].quantities || {});
    } else {
      setNotes("");
      setQuantities({});
    }
    setModalIsOpen(true);
  };

  const handleSaveCell = async () => {
    const updatedRequests = requests.map(req => {
      if (req.id === currentRequest.id) {
        return {
          ...req,
          steps: {
            ...(req.steps || {}),
            [currentSection]: {
              notes,
              quantities
            }
          }
        };
      }
      return req;
    });

    try {
      await fetch('/api/update-request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: currentRequest.id,
          section: currentSection,
          notes,
          quantities
        }),
      });

      setRequests(updatedRequests);
      setModalIsOpen(false);
      setNotes("");
      setQuantities({});
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      alert('Errore durante il salvataggio delle modifiche');
    }
  };

  const handleNewRequest = async () => {
    console.log("Invio richiesta:", newRequest);
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRequest,
          createdAt: new Date().toISOString()
        }),
      });

      const savedRequest = await response.json();
      setRequests(prev => [...prev, savedRequest]);

      // Salva anche il cliente se non esiste già
      await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: newRequest.cliente,
          codice: newRequest.codiceCliente
        }),
      });

      setNewRequest({
        cliente: "",
        codiceCliente: "",
        numeroPR: "",
        ordineCL: "",
        data: "",
        materiale: "",
        tipo: "",
        dimensioni: "",
        qty: "",
        unit: "",
        completed: false,
      });

      await fetchClients();
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      alert('Errore durante il salvataggio della nuova richiesta');
    }
  };

  const renderModalContent = () => {
    switch (currentSection) {
      case 'SEGHERIA':
        return (
          <div className="space-y-3">
            <table className="w-full text-sm">
              <tbody>
                {SEGHERIA_STEPS.map(step => (
                  <tr key={step}>
                    <td className="p-1 border">{step}</td>
                    <td className="p-1 border">
                      <input
                        type="number"
                        value={quantities[step] || ''}
                        onChange={e => setQuantities({...quantities, [step]: e.target.value})}
                        className="w-full p-1 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Note..."
              className="w-full p-2 text-sm border rounded"
              rows={4}
            />
          </div>
        );
      case 'MARMERIA':
        return (
          <div className="space-y-3">
            <table className="w-full text-sm">
              <tbody>
                {MARMERIA_STEPS.map(step => (
                  <tr key={step}>
                    <td className="p-1 border">{step}</td>
                    <td className="p-1 border">
                      <input
                        type="number"
                        value={quantities[step] || ''}
                        onChange={e => setQuantities({...quantities, [step]: e.target.value})}
                        className="w-full p-1 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Note..."
              className="w-full p-2 text-sm border rounded"
              rows={4}
            />
          </div>
        );
      case 'SPACCATRICE':
        return (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Note..."
              className="w-full p-2 text-sm border rounded"
              rows={6}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-4 rounded shadow-sm mb-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Nuova Richiesta</h2>
        <div className="grid grid-cols-5 gap-3 mb-3">
          <input
            placeholder="Cliente"
            value={newRequest.cliente}
            onChange={e => setNewRequest({...newRequest, cliente: e.target.value})}
            className="border p-1.5 rounded text-sm"
            list="clientList"
          />
          <datalist id="clientList">
            {clients.map((client, index) => (
              <option key={index} value={client.nome} />
            ))}
          </datalist>
          <input
            placeholder="C.Cliente"
            value={newRequest.codiceCliente}
            onChange={e => setNewRequest({...newRequest, codiceCliente: e.target.value})}
            className="border p-1.5 rounded text-sm"
          />
          <input
            placeholder="N° PR"
            value={newRequest.numeroPR}
            onChange={e => setNewRequest({...newRequest, numeroPR: e.target.value})}
            className="border p-1.5 rounded text-sm"
          />
          <input
            placeholder="O.CL"
            value={newRequest.ordineCL}
            onChange={e => setNewRequest({...newRequest, ordineCL: e.target.value})}
            className="border p-1.5 rounded text-sm"
          />
          <input
            type="date"
            value={newRequest.data_creazione}
            onChange={e => setNewRequest({...newRequest, data_creazione: e.target.value})}
            className="border p-1.5 rounded text-sm"
          />
        </div>
        <button
          onClick={handleNewRequest}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          Aggiungi Richiesta
        </button>
      </div>

      <div className="bg-white shadow-sm rounded overflow-hidden">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">C.Cliente</th>
              <th className="p-2 text-left">N° PR</th>
              <th className="p-2 text-left">Data</th>
              {PROCESSING_STEPS.map(step => (
                <th key={step} className="p-2 text-left">{step}</th>
              ))}
              <th className="p-2 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => (
              <tr key={req.id} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} ${req.completed ? "bg-gray-100" : ""}`}>
                <td className="p-2 border">{req.cliente}</td>
                <td className="p-2 border">{req.codiceCliente}</td>
                <td className="p-2 border">{req.numeroPR}</td>
                <td className="p-2 border">{new Date(req.data_creazione).toLocaleDateString()}</td>
                {PROCESSING_STEPS.map(step => (
                  <td
                    key={step}
                    onClick={() => handleCellClick(req, step)}
                    className={`p-2 border ${!req.completed ? "cursor-pointer hover:bg-blue-50" : ""}`}
                  >
                    {req.steps?.[step]?.notes?.slice(0, 30)}
                  </td>
                ))}
                <td className="p-2 border">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={req.completed}
                      onChange={() => handleComplete(req.id)}
                      className="h-4 w-4"
                    />
                    <button
                      onClick={() => handleArchiveClick(req)}
                      disabled={!req.completed}
                      className={`px-2 py-1 rounded text-xs ${
                        req.completed
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Archivia
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        style={modalStyle}
        contentLabel="Dettagli Lavorazione"
      >
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4">{currentSection}</h3>
          {renderModalContent()}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveCell}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 mr-2"
            >
              Salva
            </button>
            <button
              onClick={() => setModalIsOpen(false)}
              className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm hover:bg-gray-300"
            >
              Annulla
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setRequestToArchive(null);
        }}
        onConfirm={handleArchiveConfirm}
        message="Sei sicuro di voler archiviare questa richiesta? L'operazione non può essere annullata."
      />
    </div>
  );
};

export default ActiveRequests;