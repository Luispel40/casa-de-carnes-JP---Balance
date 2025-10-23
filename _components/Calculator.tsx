"use client";
import { useState } from "react";

export default function Calculator() {
  const [pesoOriginal, setPesoOriginal] = useState<number | "">("");
  const [pesoQuebra, setPesoQuebra] = useState<number | "">("");
  const [resultado, setResultado] = useState<string>("A porcentagem de quebra é: **0.00%**");

  const calcularQuebra = () => {
    const original = Number(pesoOriginal);
    const quebra = Number(pesoQuebra);

    if (isNaN(original) || isNaN(quebra) || original <= 0 || quebra < 0) {
      setResultado("Por favor, insira valores válidos e positivos (o peso original deve ser maior que zero).");
      return;
    }

    if (quebra > original) {
      setResultado("Erro: O peso da quebra não pode ser maior que o peso original da peça!");
      return;
    }

    const porcentagem = (quebra / original) * 100;
    setResultado(`A porcentagem de quebra é: **${porcentagem.toFixed(2)}%**`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full">
      <h1 className="text-xl font-semibold text-center text-gray-800 mb-4">
        Calculadora de Quebra de Carne
      </h1>

      <label className="block mt-2 font-medium text-gray-700">
        Peso da Peça Original (Com Osso)
        <span className="text-sm text-gray-500 ml-1">(Kg)</span>
      </label>
      <input
        type="number"
        value={pesoOriginal}
        onChange={(e) => setPesoOriginal(e.target.value ? parseFloat(e.target.value) : "")}
        placeholder="Ex: 50.00"
        className="w-full p-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <label className="block mt-4 font-medium text-gray-700">
        Peso Total da Quebra (Osso, Sebo, Aparas)
        <span className="text-sm text-gray-500 ml-1">(Kg)</span>
      </label>
      <input
        type="number"
        value={pesoQuebra}
        onChange={(e) => setPesoQuebra(e.target.value ? parseFloat(e.target.value) : "")}
        placeholder="Ex: 8.50"
        className="w-full p-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <button
        onClick={calcularQuebra}
        className="w-full mt-6 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-all"
      >
        Calcular Porcentagem de Quebra
      </button>

      <div className="mt-4 p-3 border-2 border-dashed border-green-400 bg-green-50 text-center font-semibold rounded-lg">
        {resultado}
      </div>
    </div>
  );
}
