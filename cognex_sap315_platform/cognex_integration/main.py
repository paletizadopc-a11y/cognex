import os
import sys
import time
import requests
import threading
from dotenv import load_dotenv
from cognex_reader import CognexReader

load_dotenv()

def login_service_account():
    """Autentica la cámara en el backend para obtener el JWT"""
    url = f"{os.getenv('API_BASE_URL')}/auth/login"
    credenciales = {
        "email": os.getenv('SERVICE_EMAIL', 'camara1@planta.local'), 
        "password": os.getenv('SERVICE_PASSWORD', 'password_segura')
    }
    
    try:
        print("🔐 Autenticando con el backend...")
        response = requests.post(url, json=credenciales, timeout=10)
        response.raise_for_status()
        print("✅ Autenticación exitosa")
        return response.json().get('token')
    except Exception as e:
        print(f"❌ Error crítico de autenticación: {e}")
        sys.exit(1) # Si no hay login, no tiene sentido arrancar

def main():
    print("=" * 50)
    print("COGNEX SAP315 - INTEGRACION (PRODUCCIÓN)")
    print("=" * 50)
    print(f"Cognex: {os.getenv('COGNEX_IP')}:{os.getenv('COGNEX_PORT')}")
    print(f"API: {os.getenv('API_BASE_URL')}")
    print("=" * 50)
    
    # 1. Obtener Token JWT al inicio
    token = login_service_account()
    
    reader = CognexReader()
    
    def enviar_a_api_background(lectura):
        """Tarea asíncrona para no bloquear la lectura de la cámara"""
        url = f"{os.getenv('API_BASE_URL')}/lecturas"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            'codigo_etiqueta': lectura['codigo_etiqueta'],
            'linea_origen': 'LINEA_01',
            'camara_id': 1, # ID correspondiente en tu tabla configuracion_camaras
            'resultado': lectura['estado'],
            'metadata': lectura
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            # Solo imprimimos errores para no saturar la consola en producción
            if response.status_code != 201:
                print(f"⚠️ Error API HTTP {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ Error de conexión API: {e}")

    def callback_lectura(lectura):
        # Lanzamos la petición HTTP en un hilo separado
        hilo = threading.Thread(target=enviar_a_api_background, args=(lectura,))
        hilo.daemon = True # El hilo muere si el programa principal se cierra
        hilo.start()
    
    try:
        # El intervalo dependerá de la velocidad de la cinta transportadora
        reader.continuous_read(callback_lectura, interval=0.5) 
    except KeyboardInterrupt:
        print("\nDeteniendo...")
        reader.disconnect()
        sys.exit(0)

if __name__ == "__main__":
    main()