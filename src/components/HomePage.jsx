import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PROCESSING_STEPS = ["SEGHERIA", "MARMERIA", "SPACCATRICE"];

const HomePage = () => {
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [newRequest, setNewRequest] = useState({
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

  const navigate = useNavigate();

  // Fetch iniziale
  useEffect(() => {
    fetchClients();
    fetchRequests();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Errore nel recupero dei clienti:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/requests");
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Errore nel recupero delle richieste:", error);
    }
  };

  const handleNewRequest = async () => {
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newRequest,
          createdAt: new Date().toISOString(),
        }),
      });

      const savedRequest = await response.json();
      setRequests((prev) => [...prev, savedRequest]);

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
    } catch (error) {
      console.error("Errore durante il salvataggio della nuova richiesta:", error);
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
            onChange={(e) =>
              setNewRequest({ ...newRequest, cliente: e.target.value })
            }
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
            onChange={(e) =>
              setNewRequest({ ...newRequest, codiceCliente: e.target.value })
            }
            className="border p-1.5 rounded text-sm"
          />
          <input
            placeholder="N° PR"
            value={newRequest.numeroPR}
            onChange={(e) =>
              setNewRequest({ ...newRequest, numeroPR: e.target.value })
            }
            className="border p-1.5 rounded text-sm"
          />
          <input
            type="date"
            value={newRequest.data}
            onChange={(e) =>
              setNewRequest({ ...newRequest, data: e.target.value })
            }
            className="border p-1.5 rounded text-sm"
          />
        </div>
        <button
          onClick={handleNewRequest}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          Aggiungi Richiesta
        </button>
        <button
          onClick={() => navigate("/archived-requests")}
          className="ml-3 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700"
        >
          Visualizza Richieste Archiviate
        </button>
      </div>
    </div>
  );
};

export default HomePage;
