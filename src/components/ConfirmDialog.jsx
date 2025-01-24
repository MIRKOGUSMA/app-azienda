import React from 'react';
import Modal from 'react-modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, message }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="relative top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl max-w-md"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <h3 className="text-lg font-semibold mb-4">Conferma Azione</h3>
      <p className="mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
        >
          Annulla
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Conferma
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;