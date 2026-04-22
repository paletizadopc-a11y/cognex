import os
import sys
from dotenv import load_dotenv
from cognex_reader import CognexReader

load_dotenv()

def main():
    print("=" * 50)
    print("COGNEX SAP315 - INTEGRACION")
    print("=" * 50)
    print(f"Cognex: {os.getenv('COGNEX_IP')}:{os.getenv('COGNEX_PORT')}")
    print(f"API: {os.getenv('API_BASE_URL')}")
    print("=" * 50)
    
    reader = CognexReader()
    
    def enviar_a_api(lectura):
        import requests
        try:
            response = requests.post(
                f"{os.getenv('API_BASE_URL')}/lecturas",
                json={
                    'codigo_etiqueta': lectura['codigo_etiqueta'],
                    'linea_origen': 'LINEA_01',
                    'resultado': lectura['estado'],
                    'metadata': lectura
                },
                timeout=int(os.getenv('API_TIMEOUT', 10))
            )
            print(f"API: {response.status_code}")
        except Exception as e:
            print(f"Error API: {e}")
    
    try:
        reader.continuous_read(enviar_a_api, interval=2.0)
    except KeyboardInterrupt:
        print("\nDeteniendo...")
        reader.disconnect()
        sys.exit(0)

if __name__ == "__main__":
    main()