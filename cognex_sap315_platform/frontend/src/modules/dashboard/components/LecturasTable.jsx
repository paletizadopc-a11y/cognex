import React from 'react';
import { Card, CardHeader, CardBody } from '../../../shared/components/Card';
import { LecturaRow } from './LecturaRow';

export const LecturasTable = ({ lecturas }) => {
  return (
    <Card>
      <CardHeader 
        title="Últimas Lecturas" 
        subtitle="Registro en tiempo real de códigos escaneados"
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado SAP</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Línea</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cámara</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Confianza</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lecturas.map((lectura) => (
                <LecturaRow key={lectura.id} lectura={lectura} />
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
};