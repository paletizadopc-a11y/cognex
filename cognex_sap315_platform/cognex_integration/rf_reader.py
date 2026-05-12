import os
import serial
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class RFReader:
    def __init__(self):
        # Leemos el puerto desde el .env
        self.port = os.getenv('RF_COM_PORT', 'COM3')
        self.baudrate = int(os.getenv('RF_BAUDRATE', 9600))
        self.serial_conn = None
        
    def connect(self):
        """Abre la conexión con el puerto USB/COM de la pistola Zebra"""
        try:
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=1)
            # 🚀 AQUI ESTÁ LA SOLUCIÓN: Imprime el éxito en la terminal
            print(f"✅ Conectado a pistola RF Zebra en el puerto {self.port}")
            return True
        except Exception as e:
            # 🚀 Imprime el error si el COM está mal configurado
            print(f"❌ Error conectando al puerto {self.port}. Verifica el Administrador de Dispositivos.\nDetalle: {e}")
            return False
    
    def disconnect(self):
        if self.serial_conn:
            self.serial_conn.close()
            self.serial_conn = None
            print("🔌 Desconectado de la pistola RF")

    def continuous_read(self, callback):
        """Modo Escucha: Espera a que la pistola dispare y envíe el dato"""
        if not self.serial_conn:
            if not self.connect(): 
                return
        
        print("🚀 Modo RF activado. Esperando lectura de etiquetas LPN en la línea...")
        
        while True:
            try:
                # Comprobamos si hay datos esperando en el puerto COM
                if self.serial_conn.in_waiting > 0:
                    # Leemos el LPN y lo limpiamos
                    response = self.serial_conn.readline().decode('utf-8').strip()
                    
                    if response:
                        # Preparamos el paquete
                        lectura = {
                            'codigo_etiqueta': response,
                            'fecha_hora': datetime.now().isoformat(),
                            'estado': 'OK',
                            'dispositivo_id': 'ZEBRA_LI4278'
                        }
                        
                        # Enviamos al main.py
                        callback(lectura)
                        
            except Exception as e:
                print(f"❌ Error durante la escucha Serial: {e}")
                self.disconnect()
                break
            
            # Pequeña pausa para evitar sobrecarga de CPU
            time.sleep(0.1)