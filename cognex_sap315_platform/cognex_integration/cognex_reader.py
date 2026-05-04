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
        """Inicia sesión en la cámara Cognex (Handshake Telnet)[cite: 1, 11, 12]"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(self.timeout)
            self.socket.connect((self.ip, self.port))
            
            # Esperar prompt y enviar credenciales
            time.sleep(0.5)
            self.socket.recv(1024) 
            self.socket.sendall(b"admin\r\n") # Usuario[cite: 1]
            time.sleep(0.3)
            self.socket.recv(1024) 
            self.socket.sendall(b"\r\n") # Password vacío[cite: 1]
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
    
    def trigger_read(self):
        """Dispara la cámara y filtra lecturas nulas o errores[cite: 11, 12]"""
        if not self.socket:
            if not self.connect(): return None
        
        try:
            self.socket.sendall(b"GO\r\n") # Comando de disparo
            response = self.socket.recv(1024).decode('utf-8').strip()
            
            # 🚀 FILTRO DE SOLUCIÓN:
            # Ignoramos "0" (No Read), strings vacíos o mensajes de sistema[cite: 11]
            if not response or response == "0" or "User:" in response or "Password:" in response:
                return None
            
            return {
                'codigo_etiqueta': response,
                'fecha_hora': datetime.now().isoformat(),
                'estado': 'OK',
                'camara_id': self.ip
            }
        except Exception as e:
            logger.error(f"Error en trigger: {e}")
            self.disconnect()
            return None

    def continuous_read(self, callback, interval=0.5):
        logger.info("🚀 Escaneo de cinta transportadora iniciado...")
        while True:
            lectura = self.trigger_read()
            if lectura: 
                callback(lectura)
            time.sleep(interval)