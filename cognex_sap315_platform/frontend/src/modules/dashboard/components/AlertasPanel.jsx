import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../shared/components/Card';
import { AlertaItem } from './AlertaItem';

export const AlertasPanel = ({ alertas }) => {
  return (
    <Card>
      <CardHeader 
        title="Alertas Activas" 
        subtitle={`${alertas.filter(a => !a.resuelta).length} alertas sin resolver`}
      />
      <CardBody className="p-0">
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {alertas.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-gray-500">No hay alertas activas</p>
            </div>
          ) : (
            alertas.map((alerta) => (
              <AlertaItem key={alerta.id} alerta={alerta} />
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};