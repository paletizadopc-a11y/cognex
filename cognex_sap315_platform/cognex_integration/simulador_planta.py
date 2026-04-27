import os
import time
import random
import requests
from datetime import datetime

# Configuración
API_URL = "http://localhost:3000/api/v1"
EMAIL = "admin@softys.com"
PASSWORD = "Softys2026!"

# Catálogo real de productos Softys por línea de producción
CATALOGO_SOFTYS = {
    "Pañalera 4": [
        "75228", "75216", "75215", "75245", "75244", 
        "75212", "75234", "75211", "75213"
    ],
    "Pañalera 5": [
        "77589", "77506", "77588", "77587", "77508"
    ],
    "Pañalera 6": [
        "75220", "75226", "75235", "75225", "75227", 
        "75223", "75221"
    ],
    "Toallera 2": [
        "96282", "96279", "96240", "96041", "96075", 
        "96268", "96173"
    ]
}

def iniciar_sesion():
    print("🔐 Iniciando sesión en el backend...")
    response = requests.post(f"{API_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if response.status_code == 200:
        print("✅ Sesión iniciada correctamente.")
        return response.json()['token']
    else:
        print(f"❌ Error al iniciar sesión: {response.text}")
        exit()

def simular_lecturas(token):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    lineas_disponibles = list(CATALOGO_SOFTYS.keys())
    
    # Generamos un LPN inicial
    current_lpn = f"LPN-{random.randint(100000, 999999)}"
    cajas_en_pallet = 0
    
    print("🚀 Iniciando simulación de producción Softys con soporte LPN (Presiona Ctrl+C para detener)...")
    
    try:
        while True:
            # Si llegamos a 10 cajas, cambiamos el Pallet (LPN)
            if cajas_en_pallet >= 10:
                current_lpn = f"LPN-{random.randint(100000, 999999)}"
                cajas_en_pallet = 0
                print(f"🚛 ¡Nuevo Pallet generado!: {current_lpn}")

            # 1. Seleccionamos una línea al azar
            linea_actual = random.choice(lineas_disponibles)
            
            # 2. Seleccionamos un código de producto
            codigo = random.choice(CATALOGO_SOFTYS[linea_actual])
            
            # 3. Generamos la confianza de la cámara
            confianza = round(random.uniform(45.0, 99.9), 1)
            
            # Simulamos que a veces la cámara falla o hay problemas de impresión
            estado = "pendiente" if confianza > 65 else "error"
            
            payload = {
                "codigo_etiqueta": codigo,
                "lpn": current_lpn,  # <-- ENVIAMOS EL LPN AL BACKEND
                "linea_origen": linea_actual,
                "camara_id": 1, 
                "resultado": estado,
                "confianza": confianza
            }
            
            response = requests.post(f"{API_URL}/lecturas", json=payload, headers=headers)
            
            if response.status_code == 201:
                print(f"📦 [{current_lpn}] Línea: {linea_actual} | Código: {codigo} | Estado: {estado.upper()}")
                cajas_en_pallet += 1
            else:
                print(f"⚠️ Error enviando lectura: {response.text}")
                
            time.sleep(3) # Espera 3 segundos entre cada lectura
            
    except KeyboardInterrupt:
        print("\n🛑 Simulación detenida.")

if __name__ == "__main__":
    token_jwt = iniciar_sesion()
    simular_lecturas(token_jwt)