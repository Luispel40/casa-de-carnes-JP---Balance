"use client";
import { useState } from "react";
import { Calculator } from "lucide-react";
import CalculatorComponent from "./Calculator";

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all"
        title="Abrir calculadora"
      >
        <Calculator className="w-6 h-6" />
      </button>

      {/* Overlay e modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
            <CalculatorComponent />
          </div>
        </div>
      )}
    </>
  );
}
