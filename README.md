<div align="center">
  <img src="https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1770681140747_VoYDYJVpM.jpeg" width="120" height="120" alt="Cat_Bot Logo" style="border-radius: 20%; margin-bottom: 10px;">

  <h1 align="center" style="border-bottom: none;">
    <span style="background: linear-gradient(135deg, #00BFFF, #FF4500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-family: 'Segoe UI', sans-serif; font-size: 50px; font-weight: 800;">
      CAT_BOT
    </span>
  </h1>

  <p align="center">
  <img src="https://img.shields.io/badge/ESTADO-ACTIVO-success?style=for-the-badge&logo=statuspage&logoColor=white" />
  <img src="https://img.shields.io/badge/VERSIÓN-5.0.0-blue?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/SOPORTE-WHATSAPP-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
</p>

<p align="center">
  <kbd>
    <img src="https://cdn-icons-png.flaticon.com/512/5968/5968292.png" width="15" /> 
    <b>BASED ON: BAILEYS</b>
  </kbd>
  <kbd>
    <img src="https://cdn-icons-png.flaticon.com/512/919/919825.png" width="15" /> 
    <b>ENGINE: NODE.JS</b>
  </kbd>
  <kbd>
    <img src="https://cdn-icons-png.flaticon.com/512/2103/2103633.png" width="15" /> 
    <b>PREFIX: ( . )</b>
  </kbd>
</p>

<p align="center">
  <kbd>
    <img src="https://cdn-icons-png.flaticon.com/512/606/606203.png" width="15" /> 
    <b>DEVELOPER: DEYLIN</b>
  </kbd>
  <kbd>
    <img src="https://cdn-icons-png.flaticon.com/512/1055/1055687.png" width="15" /> 
    <b>DATABASE: RENDER/SUPABASE</b>
  </kbd>
</p>



<div align="center">
  
</div>
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
> 
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
> 
> 🌐 **[deylin.xyz/cat-bot](https://deylin.xyz/cat-bot)**

### Instalación Rápida en Termux
```bash
# 1. Actualización de repositorio y dependencias
pkg update -y && pkg upgrade -y
pkg install git nodejs-lts ffmpeg -y

# 2. Obtención de código fuente bajo licencia
git clone https://github.com/deylin-16/cat_bot
cd cat_bot

# 3. Inicialización del sistema
chmod +x engine.sh
./engine.sh
```

---

## 📲 PROTOCOLO DE VINCULACIÓN OFICIAL

Para garantizar una conexión segura y persistente, el sistema implementa el método de **Pairing Code** de Multi-Device. Siga estas instrucciones para sincronizar el motor:

1. Ejecute el sistema y proporcione su número de teléfono en formato internacional (ej: `504XXXXXX`).
2. Recibirá un código alfanumérico de 8 dígitos en su terminal.
3. En su dispositivo móvil, acceda a: **Dispositivos vinculados > Vincular con el número de teléfono**.
4. Ingrese el código generado para establecer la sesión encriptada.

---

## 🔋 MANTENIMIENTO PROFESIONAL (PM2)

En entornos de producción 24/7 (VPS o servidores en la nube), se exige el uso de un gestor de procesos para garantizar el reinicio automático ante fallos críticos:

```bash
# Instalación global de PM2
npm install -g pm2

# Inicio del proceso con nombre personalizado
pm2 start index.js --name "cat-bot"

# Monitoreo de logs en tiempo real
pm2 logs cat-bot
```

---

## 🛠️ CENTRO DE RECURSOS Y SOPORTE

| Servicio | Enlace de Acceso |
|----------|------------------|
| 📚 **Documentación Técnica** | [deylin.xyz/cat-bot](https://deylin.xyz/cat-bot) |
| 🌐 **Web del Desarrollador** | [deylin.xyz](https://deylin.xyz) |
| 🆘 **Soporte Directo** | [deylin.xyz/support](https://deylin.xyz/support) |
| 💬 **Contacto Business** | [Deylin Eliac ᴼᶠᶜ](https://wa.me/50432955554) |

---

<div align="center">
  <img src="https://github.com/deylin-16.png" width="120" style="border-radius: 50%; border: 3px solid #000; margin-bottom: 10px;">
  <br>
  <strong>© 2026 Deylin Automation Systems. All Rights Reserved.</strong>
  <p align="center">
    <em>"Innovación y eficiencia en arquitectura de software para automatización."</em>
  </p>
</div>

---

<div align="center">
  <h3>☕ SOPORTE AL DESARROLLO INTEGRAL</h3>
  <p>
    El mantenimiento de <strong>CAT BOT</strong> y la infraestructura de la <strong>Red Z</strong> es un esfuerzo constante para garantizar velocidad y estabilidad. Tu contribución voluntaria permite que este sistema siga evolucionando como una herramienta de vanguardia y alto rendimiento.
  </p>
  
  <p>
    <a href="https://www.paypal.me/DeylinB" target="_blank">
      <img src="https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal Donation">
    </a>
    <a href="https://Ko-fi.com/deylin16" target="_blank">
      <img src="https://img.shields.io/badge/Buy_me_a_coffee-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi Donation">
    </a>
  </p>

  <p>
    <em>Impulsando la próxima generación de automatización.</em><br>
    <strong>Deylin Automation Systems © 2026</strong>
  </p>
</div>

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://deylin.xyz">Deylin</a></sub>
</div>
