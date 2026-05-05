import os
import sys
import requests
import threading
import time
from dotenv import load_dotenv
from cognex_reader import CognexReader

load_dotenv()

# Variable para control de duplicados en la línea
ultima_lectura_exitosa = None

def login_service_account():
    """Obtención de Token JWT para el backend"""
    url = f"{os.getenv('API_BASE_URL')}/auth/login"
    try:
        res = requests.post(url, json={
            "email": os.getenv('SERVICE_EMAIL'), 
            "password": os.getenv('SERVICE_PASSWORD')
        }, timeout=10)
        res.raise_for_status()
        return res.json().get('token')
    except Exception as e:
        print(f"❌ Fallo de autenticación con Backend: {e}")
        sys.exit(1)

def main():
    global ultima_lectura_exitosa
    print("=" * 50)
    print("SISTEMA DE CAPTURA SAP315 - MODO PRODUCCIÓN")
    print("=" * 50)
    
    token = login_service_account()
    reader = CognexReader()
    
    def enviar_a_api_background(lectura):
        global ultima_lectura_exitosa
        
        # 🚀 FILTRO DE DUPLICADOS:
        # Solo procesamos si el código cambió respecto al último detectado
        if lectura['codigo_etiqueta'] == ultima_lectura_exitosa:
            return

        url = f"{os.getenv('API_BASE_URL')}/lecturas"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Formateo de datos según requerimientos de Softys
        payload = {
            'codigo_etiqueta': lectura['codigo_etiqueta'],
            'lpn': f"LPN-{lectura['codigo_etiqueta'][-5:]}", 
            'linea_origen': 'LINEA_01',
            'camara_id': 1, 
            'resultado': 'OK',
            'confianza': 98.2,
            'metadata': lectura
        }
        
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=5)
            if res.status_code == 201:
                print(f"✅ PALET REGISTRADO: {lectura['codigo_etiqueta']}")
                ultima_lectura_exitosa = lectura['codigo_etiqueta']
        except Exception as e:
            print(f"❌ Error al enviar al Monitor: {e}")

    def callback_lectura(lectura):
        # Ejecución asíncrona para no detener el flujo de la cámara
        threading.Thread(target=enviar_a_api_background, args=(lectura,)).start()
    
    try:
        # Escaneo pasivo
        reader.continuous_read(callback_lectura) 
    except KeyboardInterrupt:
        print("\n🛑 Sistema detenido por el usuario.")
        reader.disconnect()
        sys.exit(0)

if __name__ == "__main__":
    main()