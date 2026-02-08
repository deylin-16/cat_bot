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
```

<hr>

<h2>📲 PROTOCOLO DE VINCULACIÓN OFICIAL</h2>
<p align="justify">
  Para garantizar una conexión segura y persistente, el sistema implementa el método de <b>Pairing Code</b> de Multi-Device. Siga estas instrucciones para sincronizar el motor:
</p>

<ol>
  <li>Ejecute el sistema y proporcione su número de teléfono en formato internacional (ej: <code>504XXXXXX</code>).</li>
  <li>Recibirá un código alfanumérico de 8 dígitos en su terminal.</li>
  <li>En su dispositivo móvil, acceda a: <b>Dispositivos vinculados > Vincular con el número de teléfono</b>.</li>
  <li>Ingrese el código generado para establecer la sesión encriptada.</li>
</ol>

<hr>

<h2>🔋 MANTENIMIENTO PROFESIONAL (PM2)</h2>
<p>
  En entornos de producción 24/7 (VPS o servidores en la nube), se exige el uso de un gestor de procesos para garantizar el reinicio automático ante fallos críticos:
</p>

<pre><code># Instalación global de PM2
npm install -g pm2

# Inicio del proceso con nombre personalizado
pm2 start index.js --name "cat-bot"

# Monitoreo de logs en tiempo real
pm2 logs cat-bot</code></pre>

<hr>

<h2>🛠️ CENTRO DE RECURSOS Y SOPORTE</h2>

<table width="100%">
  <thead>
    <tr>
      <th align="left">Servicio</th>
      <th align="left">Enlace de Acceso</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>📚 Documentación Técnica</b></td>
      <td><a href="https://deylin.xyz/cat-bot">deylin.xyz/cat-bot</a></td>
    </tr>
    <tr>
      <td><b>🌐 Web del Desarrollador</b></td>
      <td><a href="https://deylin.xyz">deylin.xyz</a></td>
    </tr>
    <tr>
      <td><b>🆘 Soporte Directo</b></td>
      <td><a href="https://deylin.xyz/support">deylin.xyz/support</a></td>
    </tr>
    <tr>
      <td><b>💬 Contacto Business</b></td>
      <td><a href="https://wa.me/50432955554">Deylin Eliac ᴼᶠᶜ</a></td>
    </tr>
  </tbody>
</table>

<br>

<div align="center">
  <img src="https://github.com/deylin-16.png" width="120" style="border-radius: 50%; border: 3px solid #000; margin-bottom: 10px;">
  <br>
  <strong>© 2026 Deylin Automation Systems. All Rights Reserved.</strong>
  <p align="center">
    <i>"Innovación y eficiencia en arquitectura de software para automatización."</i>
  </p>
  
  <hr>

<hr>

<div align="center">
  <table width="85%" style="border-collapse: collapse; border: 1px solid #e1e4e8; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <tr>
      <td style="padding: 30px; background-color: #f8f9fa;">
        <h3 align="center" style="margin-top: 0; color: #0366d6;">☕ SOPORTE AL DESARROLLO INTEGRAL</h3>
        <p align="center" style="color: #586069; line-height: 1.6;">
          El mantenimiento de <b>CAT BOT</b> y la infraestructura de la <b>Red Z</b> es un esfuerzo constante para garantizar velocidad y estabilidad. Tu contribución voluntaria permite que este sistema siga siendo una herramienta de vanguardia, libre de publicidad y con actualizaciones de alto nivel.
        </p>
        <div align="center" style="margin-top: 20px;">
          <a href="https://www.paypal.me/DeylinB" target="_blank" style="text-decoration: none;">
            <img src="https://img.shields.io/badge/DONAR_VÍA_PAYPAL-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal Donation">
          </a>
        </div>
        <p align="center" style="margin-top: 15px; font-size: 11px; color: #6a737d;">
          <i>Asegurando la evolución de la automatización | Deylin Automation Systems © 2026</i>
        </p>
      </td>
    </tr>
  </table>
</div>

<br>

</div>


