<div align="center">
  <img src="https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1770157236468_HFypRNHeu.jpeg" width="100%" style="border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">

  <hr>

  <h1>🐈 CAT BOT AUTOMATION SYSTEM v5.0.0</h1>
  <p>
    <strong>Core Architect:</strong> <a href="https://deylin.xyz">Deylin</a> | 
    <strong>Engine:</strong> Command-Map Architecture | 
    <strong>Status:</strong> Stable Release
  </p>
</div>

> [!CAUTION]
> **PROPIEDAD INTELECTUAL Y LICENCIA PRIVADA**
> Este software es propiedad exclusiva de **Deylin Eliac**. Queda estrictamente prohibida la redistribución, clonación masiva o comercialización del código fuente sin una licencia comercial explícita. El incumplimiento de estos términos resultará en acciones técnicas y legales pertinentes.

---

## ⚖️ DESCARGO DE RESPONSABILIDAD Y TÉRMINOS LEGALES

### 1. Relación con Meta & WhatsApp
Este sistema utiliza una implementación independiente de la API de WhatsApp (Multi-Device). **CAT BOT** no está afiliado, asociado, autorizado ni respaldado por Meta Platforms, Inc. o WhatsApp LLC. 

### 2. Cumplimiento de Términos (TOS)
> [!IMPORTANT]
> El usuario es el único responsable del cumplimiento de los **Términos de Servicio de WhatsApp**. El uso de automatizaciones para el envío de spam o contenido no solicitado puede resultar en la suspensión permanente de su cuenta. Este software ha sido diseñado con fines de automatización técnica y educativa.

### 3. Dependencia de Baileys
Este sistema opera sobre la librería [Baileys](https://github.com/WhiskeySockets/Baileys). El desarrollador no se hace responsable por cambios en los protocolos de cifrado de WhatsApp que puedan afectar la funcionalidad del software.

### 4. Entorno de Ejecución (Termux/Linux)
Al ejecutar este software en entornos como **Termux**, el usuario acepta las políticas de uso de paquetes de código abierto y entiende que la estabilidad depende de la configuración correcta del hardware y la red del cliente.

---

## 🚀 ARQUITECTURA TÉCNICA (v5.0.0 Stable)

* **Command Map System:** Ejecución determinista de comandos eliminando la latencia de los handlers tradicionales.
* **Minimalist Serializer:** Reemplazo de `simple.js` por un motor de serialización optimizado que reduce la carga de CPU y memoria RAM.
* **Cloud-Hybrid Sync:** Soporte nativo para persistencia de datos y logs directamente en **Supabase** y **Render**.
* **Media Scraper Engine:** Estructura adaptada para el manejo de flujos de datos externos (YouTube/Instagram) con manejo de errores avanzado.

---

## 📦 GUÍA OFICIAL DE INSTALACIÓN

> [!TIP]
> Para una guía visual interactiva y acceso a recursos adicionales, visite nuestra documentación oficial:
> 🌐 **[deylin.xyz/cat-bot](https://deylin.xyz/cat-bot)**

### Instalación Rápida en Termux
```bash
# 1. Actualización de repositorio y dependencias
pkg update -y && pkg upgrade -y
pkg install git nodejs-lts ffmpeg -y

# 2. Obtención de código fuente bajo licencia
git clone [https://github.com/deylin-16/cat_bot](https://github.com/deylin-16/cat_bot)
cd cat_bot

# 3. Inicialización del sistema
chmod +x engine.sh
./engine.sh
