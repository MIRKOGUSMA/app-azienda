import React, { useState, useEffect } from "react";

const PROCESSING_STEPS = ["FILIERA", "MARMERIA", "SPACCATRICE"];

const ArchivedRequests = () => {
  const [archivedRequests, setArchivedRequests] = useState([]);

  useEffect(() => {
    fetchArchivedRequests();
  }, []);

  const fetchArchivedRequests = async () => {
    try {
      const response = await fetch("/api/archived-requests");
      const data = await response.json();
      setArchivedRequests(data);
    } catch (error) {
      console.error("Errore durante il recupero delle richieste archiviate:", error);
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
      fetchArchivedRequests();
    } catch (error) {
      console.error("Errore durante il ripristino della richiesta:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Richieste Archiviate</h1>
      <div className="bg-white shadow-sm rounded overflow-hidden">
        <table className="min-w-full border-collapse text-sm">
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
              {PROCESSING_STEPS.map(step => (
                <th key={step} className="p-2 border">{step}</th>
              ))}
              <th className="p-2 border">COMPLETATO</th>
              <th className="p-2 border">RIMANENTE</th>
              <th className="p-2 border">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {archivedRequests.map((req) => (
              <tr key={req.id} className="border">
                <td className="p-2 border">{req.cliente}</td>
                <td className="p-2 border">{req.codice}</td>
                <td className="p-2 border">{req.materiale}</td>
                <td className="p-2 border">{req.tipo}</td>
                <td className="p-2 border">{req.dimensioni}</td>
                <td className="p-2 border">{req.qty}</td>
                <td className="p-2 border">{req.unit}</td>
                <td className="p-2 border">
                  {req.data_creazione ? new Date(req.data_creazione).toLocaleDateString('it-IT') : ''}
                </td>
                {PROCESSING_STEPS.map(step => (
                  <td
                    key={step}
                    className="p-2 border text-center"
                  >
                    {req.steps?.[step]?.notes || ""}
                  </td>
                ))}
                <td className="p-2 border text-center">
                  {req.completato || 0}
                </td>
                <td className="p-2 border text-center">
                  {req.rimanente || 0}
                </td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => handleRestore(req.id)}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Ripristina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ArchivedRequests;