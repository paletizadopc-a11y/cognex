import os
import socket
import logging
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CognexReader:
    def __init__(self):
        self.ip = os.getenv('COGNEX_IP', '192.168.1.203')
        self.port = int(os.getenv('COGNEX_PORT', 23))
        self.timeout = int(os.getenv('COGNEX_TIMEOUT', 5))
        self.socket = None
        
    def connect(self):
        """Inicia sesión en la cámara Cognex (Handshake Telnet)"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            # Mantenemos el timeout solo para la fase de conexión/login
            self.socket.settimeout(self.timeout)
            self.socket.connect((self.ip, self.port))
            
            # Esperar prompt y enviar credenciales
            time.sleep(0.5)
            self.socket.recv(1024) 
            self.socket.sendall(b"admin\r\n") # Usuario
            time.sleep(0.3)
            self.socket.recv(1024) 
            self.socket.sendall(b"\r\n") # Password vacío
            time.sleep(0.3)
            self.socket.recv(1024) 
            
            logger.info(f"✅ Sesión iniciada en cámara {self.ip}")
            return True
        except Exception as e:
            logger.error(f"❌ Error de conexión: {e}")
            return False
    
    def disconnect(self):
        if self.socket:
            self.socket.close()
            self.socket = None
            logger.info("🔌 Desconectado del hardware")

    def continuous_read(self, callback):
        """Modo Escucha Pasiva: Espera la señal del sensor SICK"""
        if not self.socket:
            if not self.connect(): 
                return
        
        # 🚀 CÍTICRO: Quitamos el timeout para que el script no se caiga 
        # si la línea de producción se detiene y no pasan pallets por minutos u horas.
        self.socket.settimeout(None)
        
        logger.info("🚀 Modo Hardware activado. Esperando disparo del sensor SICK...")
        
        while True:
            try:
                # El script se bloquea aquí hasta que la cámara detecta algo
                response = self.socket.recv(1024).decode('utf-8').strip()
                
                # Si response está vacío, la cámara cerró la conexión
                if not response:
                    logger.warning("⚠️ Conexión cerrada por la cámara.")
                    self.disconnect()
                    break
                
                # 🚀 FILTRO DE SOLUCIÓN:
                # Ignoramos "0" (No Read) o los mensajes residuales del Telnet
                if response == "0" or "User:" in response or "Password:" in response or "Logged In" in response:
                    continue
                
                # Preparamos el paquete de lectura
                lectura = {
                    'codigo_etiqueta': response,
                    'fecha_hora': datetime.now().isoformat(),
                    'estado': 'OK',
                    'camara_id': self.ip
                }
                
                # Enviamos al main.py
                callback(lectura)
                
            except Exception as e:
                logger.error(f"❌ Error durante la escucha: {e}")
                self.disconnect()
                break