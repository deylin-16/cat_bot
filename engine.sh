#!/data/data/com.termux/files/usr/bin/bash

# Definición de colores (Paleta Profesional)
B='\033[1;34m' # Azul Info
G='\033[1;32m' # Verde Éxito
Y='\033[1;33m' # Oro Advertencia
R='\033[1;31m' # Rojo Crítico
W='\033[1;37m' # Blanco Puro
N='\033[0m'    # Reset

clear

# Encabezado de Arquitectura
echo -e "${W}==================================================${N}"
echo -e "${W}          ${B}CAT BOT OS${W} | SYSTEM ENGINE v1.0         ${N}"
echo -e "${W}==================================================${N}"
echo -e "${W}Developer: ${G}Deylin Eliac${N}"
echo -e "${W}Status:    ${B}Proprietary Software${N}"
echo -e "${W}--------------------------------------------------${N}"

# Aviso Legal y NDA
echo -e "${R}ADVERTENCIA LEGAL Y ACUERDO DE LICENCIA:${N}"
echo -e "${W}1. Este software es ${R}PRIVADO${W} y está bajo licencia"
echo -e "   propietaria de su autor.${N}"
echo -e "${W}2. Se prohíbe terminantemente la ${R}PROPAGACIÓN${W}, venta"
echo -e "   o clonación pública del código fuente.${N}"
echo -e "${W}3. Las APIs y recursos integrados son propiedad"
echo -e "   privada. La filtración de llaves de acceso será"
echo -e "   objeto de ${R}MULTAS LEGALES${W} por violación de"
echo -e "   derechos de autor.${N}"
echo -e "${W}4. Al continuar, usted acepta que el uso de este"
echo -e "   sistema es bajo su estricta responsabilidad.${N}"
echo -e "${W}--------------------------------------------------${N}"

# Validación de Usuario
echo -en "${Y}¿Acepta los términos y la política de privacidad? (y/n): ${N}"
read -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${R}[!] Instalación abortada: Debe aceptar los términos.${N}"
    exit 1
fi

echo -e "${G}[✓] Acuerdo validado. Iniciando aprovisionamiento...${N}"

# Optimización de Memoria (Limpieza de RAM inicial)
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null

# Verificación de Dependencias Core
echo -e "${B}[*] Verificando entorno de ejecución...${N}"

if ! command -v node &> /dev/null; then
    echo -e "${Y}[!] Node.js no detectado. Instalando dependencias...${N}"
    pkg update -y && pkg upgrade -y
    pkg install nodejs-lts git ffmpeg -y
else
    echo -e "${G}[✓] Node.js detectado.${N}"
fi

# Gestión de Módulos (Instalación Silenciosa y Profesional)
if [ ! -d "node_modules" ]; then
    echo -e "${Y}[*] Instalando librerías del motor (Esto puede tardar)...${N}"
    npm install --production --no-bin-links
else
    echo -e "${G}[✓] Librerías verificadas.${N}"
fi

# Configuración de Variables de Entorno (Handshake Listo)
if [ ! -f ".env" ]; then
    echo -e "${B}[*] Generando configuración de entorno seguro...${N}"
    cat <<EOT > .env
PORT=3000
SUPABASE_URL=https://kzuvndqicwcclhayyttc.supabase.co
SUPABASE_KEY=sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M
SESSION_NAME=sessions
SYSTEM_SECRET=CAT_BOT_SHA256_PRIVATE_DEYLIN
EOT
fi

# Mantenimiento de Directorios Temporales
rm -rf ./tmp/* ./out/* 2>/dev/null
mkdir -p tmp out

# Lanzamiento del Motor Principal
echo -e "${W}--------------------------------------------------${N}"
echo -e "${G}CAT BOT OS: ONLINE | PROTOCOLO DE VINCULACIÓN LISTO${N}"
echo -e "${W}--------------------------------------------------${N}"
echo -e "${B}INFO:${N} Ingrese su número de teléfono en el prompt de"
echo -e "      vinculación directa por código."
echo ""

# Ejecución
node index.js
