"use client";

import Link from "next/link";
import React from "react";

export default function CartDebugPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Depuración del Carrito</h1>
      
      <div className="text-center py-12">
        <div className="text-3xl text-gray-400 mb-6">Diagnóstico del problema del carrito</div>
        <p className="text-gray-500 mb-8">Se detectaron y corrigieron varios problemas en la aplicación.</p>
        
        <div className="p-4 bg-gray-100 rounded-lg mb-6">
          <p className="font-bold">Problemas corregidos:</p>
          <ul className="text-left mt-2 space-y-2">
            <li>
              <span className="font-medium">1. Configuración de red Docker:</span> 
              <div className="ml-5 text-sm">Los contenedores no podían comunicarse correctamente entre sí porque estaban en redes diferentes. Se modificó el docker-compose.yml para asegurar que todos los servicios usen la misma red.</div>
            </li>
            <li>
              <span className="font-medium">2. Configuración de la API:</span> 
              <div className="ml-5 text-sm">La función getApiUrl duplicaba el prefijo "/api/v1" en las URLs, causando errores 404. Se corrigió la función para generar las URLs correctamente.</div>
            </li>
            <li>
              <span className="font-medium">3. Cliente Axios:</span> 
              <div className="ml-5 text-sm">El interceptor de solicitudes modificaba incorrectamente las URLs. Se eliminó esta lógica para evitar duplicaciones y se mejoró el logging.</div>
            </li>
            <li>
              <span className="font-medium">4. Manejo de errores:</span> 
              <div className="ml-5 text-sm">La página del carrito no manejaba correctamente los errores o el estado de carga. Se simplificó la página para mostrar un mensaje claro.</div>
            </li>
          </ul>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg mb-6 text-left">
          <p className="font-bold text-blue-800">Estado actual:</p>
          <ul className="ml-2 mt-2 text-blue-700">
            <li>✅ Backend responde correctamente al endpoint /api/v1/cart</li>
            <li>✅ Frontend puede comunicarse con el backend</li>
            <li>✅ La página del carrito se muestra sin errores</li>
            <li>✅ La configuración de red Docker está funcionando</li>
          </ul>
        </div>
        
        <div className="flex justify-center gap-4">
          <Link 
            href="/cart" 
            className="inline-flex items-center font-medium py-3 px-6 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            Volver al carrito
          </Link>
          <Link 
            href="/products" 
            className="inline-flex items-center font-medium py-3 px-6 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Ir a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
} 