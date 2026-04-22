import os
import socket
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.getenv('LOG_FILE', './logs/cognex.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CognexReader:
    def __init__(self):
        self.ip = os.getenv('COGNEX_IP', '192.168.1.100')
        self.port = int(os.getenv('COGNEX_PORT', 23))
        self.timeout = int(os.getenv('COGNEX_TIMEOUT', 5))
        self.socket = None
        
    def connect(self):
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(self.timeout)
            self.socket.connect((self.ip, self.port))
            logger.info(f"Conectado a Cognex In-Sight 8000 en {self.ip}:{self.port}")
            
            # Enviar comando de login si es necesario
            # self.socket.sendall(b"admin\r\n")  # Si requiere autenticación
            
            return True
        except Exception as e:
            logger.error(f"Error conectando: {e}")
            return False
    
    def disconnect(self):
        if self.socket:
            self.socket.close()
            self.socket = None
            logger.info("Desconectado")
    
    def trigger_read(self):
        """Envía trigger y lee resultado de código de barras"""
        if not self.socket:
            if not self.connect(): 
                return None
        
        try:
            # Comando GO = Trigger acquisition en Cognex In-Sight
            self.socket.sendall(b"GO\r\n")
            
            # Leer respuesta (puede variar según configuración del job)
            response = self.socket.recv(1024).decode('utf-8').strip()
            
            if response and response != "0":
                return {
                    'codigo_etiqueta': response,
                    'fecha_hora': datetime.now().isoformat(),
                    'estado': 'OK',
                    'camara_id': self.ip,
                    'modelo': 'In-Sight 8000',
                    'mac': '00:D0:24:83:3B:94'
                }
            return None
                
        except socket.timeout:
            logger.error("Timeout esperando respuesta")
            return None
        except Exception as e:
            logger.error(f"Error lectura: {e}")
            self.disconnect()
            return None
    
    def get_job_list(self):
        """Obtener lista de jobs disponibles"""
        if not self.socket:
            if not self.connect(): 
                return None
        
        try:
            self.socket.sendall(b"JF\r\n")  # Job File list
            response = self.socket.recv(4096).decode('utf-8')
            return response
        except Exception as e:
            logger.error(f"Error obteniendo jobs: {e}")
            return None
    
    def continuous_read(self, callback, interval=1.0):
        import time
        logger.info("Modo lectura continua iniciado...")
        while True:
            lectura = self.trigger_read()
            if lectura: 
                callback(lectura)
            time.sleep(interval)