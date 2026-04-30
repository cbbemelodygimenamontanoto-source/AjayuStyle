import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-primary-900 mb-8">
          Diseña el Futuro de la Moda
        </h1>
        <p className="text-lg text-neutral-600 mb-8">
          Bienvenido a Ajayu - Tu plataforma integral para el diseño de moda con IA
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">🎓 Cursos Interactivos</h2>
            <p>Aprende diseño de moda con nuestro sistema tipo Moodle</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">🤖 Inteligencia Artificial</h2>
            <p>Asistencia de diseño con IA para patronaje y análisis</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">👤 Avatares</h2>
            <p>Crea avatares personalizados para tus diseños</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">📱 Red Social</h2>
            <p>Comparte y conecta con otros diseñadores (opcional)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
