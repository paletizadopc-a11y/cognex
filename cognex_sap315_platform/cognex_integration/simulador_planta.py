import os
import time
import random
import requests
from datetime import datetime

# Configuración
API_URL = "http://localhost:3000/api/v1"

# 🚀 ACTUALIZADO: Cambiamos al nuevo dominio de seguridad corporativo
EMAIL = "admin@softysla.com" 
PASSWORD = "Softys2026!"

# Catálogo real de productos Softys por línea de producción
CATALOGO_SOFTYS = {
    "Pañalera 4": ["75228", "75216", "75215", "75245", "75244", "75212", "75234", "75211", "75213"],
    "Pañalera 5": ["77589", "77506", "77588", "77587", "77508"],
    "Pañalera 6": ["75220", "75226", "75235", "75225", "75227", "75223", "75221"],
    "Toallera 2": ["96282", "96279", "96240", "96041", "96075", "96268", "96173"]
}

def iniciar_sesion():
    print("🔐 Iniciando sesión en el backend de SAP 315...")
    response = requests.post(f"{API_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if response.status_code == 200:
        print("✅ Sesión de máquina iniciada correctamente.")
        return response.json()['token']
    else:
        print(f"❌ Error al iniciar sesión: {response.text}")
        print("⚠️ Asegúrate de tener registrado al usuario admin@softysla.com con esa contraseña.")
        exit()

def generar_lpn_realista():
    # Genera un LPN con el formato estándar de logística: LPN-YYYYMMDD-XXXX
    fecha = datetime.now().strftime("%Y%m%d")
    secuencia = random.randint(1000, 9999)
    return f"LPN-{fecha}-{secuencia}"

def simular_lecturas(token):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    lineas_disponibles = list(CATALOGO_SOFTYS.keys())
    
    # Variables de control del Pallet
    current_lpn = generar_lpn_realista()
    cajas_en_pallet = 0
    cajas_por_pallet = random.randint(8, 12) # Pallets con cantidades dinámicas
    
    print(f"🚀 Iniciando simulación física de planta Softys (Presiona Ctrl+C para detener)...")
    print(f"🚛 Ingresando pallet vacío: {current_lpn}")
    
    try:
        while True:
            # Si se llenó el pallet, lo despachamos e iniciamos uno nuevo
            if cajas_en_pallet >= cajas_por_pallet:
                print("-" * 65)
                print(f"🚛 ¡Pallet {current_lpn} cerrado y despachado!")
                current_lpn = generar_lpn_realista()
                cajas_en_pallet = 0
                cajas_por_pallet = random.randint(8, 12)
                print(f"🚛 Ingresando nuevo pallet vacío: {current_lpn}")
                print("-" * 65)

            # 1. Seleccionamos línea y producto
            linea_actual = random.choice(lineas_disponibles)
            codigo = random.choice(CATALOGO_SOFTYS[linea_actual])
            
            # 2. Lógica de Confianza (Simulación de ruido óptico)
            # 85% de las veces lee perfecto. 15% la etiqueta está arrugada o sucia.
            if random.random() > 0.15:
                confianza = round(random.uniform(55.0, 99.9), 1)
            else:
                confianza = round(random.uniform(30.0, 54.9), 1)
            
            # 3. Retroalimentación visual en consola basada en la Regla del 55%
            estado_visual = "✅ AUTO-VALIDADO" if confianza >= 55 else "🚨 BLOQUEADO (<55%)"
            
            # Solo mandamos los datos puros. El backend decidirá el estado SAP real.
            payload = {
                "codigo_etiqueta": codigo,
                "lpn": current_lpn,
                "linea_origen": linea_actual,
                "camara_id": 1, 
                "confianza": confianza
            }
            
            response = requests.post(f"{API_URL}/lecturas", json=payload, headers=headers)
            
            if response.status_code == 201:
                cajas_en_pallet += 1
                print(f"📦 [{current_lpn} - {cajas_en_pallet}/{cajas_por_pallet}] L: {linea_actual} | Cód: {codigo} | Conf: {confianza}% | {estado_visual}")
            else:
                print(f"⚠️ Error enviando lectura: {response.text}")
                
            # Simula el movimiento real de una cinta transportadora
            time.sleep(random.uniform(2.0, 4.0))
            
    except KeyboardInterrupt:
        print("\n🛑 Cinta transportadora detenida.")

if __name__ == "__main__":
    token_jwt = iniciar_sesion()
    simular_lecturas(token_jwt)