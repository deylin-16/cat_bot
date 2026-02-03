#!/data/data/com.termux/files/usr/bin/bash

B='\033[1;34m'
G='\033[1;32m'
Y='\033[1;33m'
R='\033[1;31m'
W='\033[1;37m'
N='\033[0m'

clear
echo -e "${B}==================================================${N}"
echo -e "${W}            CAT BOT - OFFICIAL SETUP              ${N}"
echo -e "${B}==================================================${N}"
echo -e "${Y}DESCRIPCIÓN:${N}"
echo -e "Sistema avanzado de automatización para WhatsApp,"
echo -e "diseñado para optimización de recursos y gestión"
echo -e "de datos en la nube (Red Z)."
echo ""
echo -e "${R}TÉRMINOS Y CONDICIONES DE USO:${N}"
echo -e "1. Queda estrictamente prohibida la clonación,"
echo -e "   redistribución o venta de este código sin"
echo -e "   permiso explícito de ${G}Deylin (Autor)${N}."
echo -e "2. El uso de este sistema es bajo su propia"
echo -e "   responsabilidad."
echo -e "3. Los derechos de autor están protegidos por ley."
echo -e "4. Se prohíbe la modificación de los créditos"
echo -e "   del sistema."
echo ""
echo -e "${W}POLÍTICA DE PRIVACIDAD:${N}"
echo -e "Este sistema conecta con Supabase para mejorar el"
echo -e "rendimiento. No recopilamos datos personales sin"
echo -e "el consentimiento del administrador del servidor."
echo -e "${B}==================================================${N}"

echo -en "${Y}¿Acepta los términos y la política de privacidad? (y/n): ${N}"
read -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${R}Instalación cancelada. Debe aceptar para continuar.${N}"
    exit 1
fi

echo -e "${G}[✓] Acuerdo aceptado. Iniciando entorno...${N}"
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null

if ! command -v node &> /dev/null; then
    echo -e "${Y}[*] Instalando dependencias del sistema...${N}"
    pkg update -y && pkg upgrade -y
    pkg install nodejs-lts git ffmpeg -y
fi

if [ ! -d "node_modules" ]; then
    echo -e "${Y}[*] Instalando módulos de Node.js...${N}"
    npm install --production --no-bin-links
fi

if [ ! -f ".env" ]; then
    cat <<EOT > .env
PORT=3000
SUPABASE_URL=https://kzuvndqicwcclhayyttc.supabase.co
SUPABASE_KEY=sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M
SESSION_NAME=sessions
EOT
fi

rm -rf ./tmp/* ./out/* 2>/dev/null
mkdir -p tmp out

echo -e "${B}==================================================${N}"
echo -e "${G}    CAT BOT: ONLINE | PROCEDA A LA VINCULACIÓN   ${N}"
echo -e "${B}==================================================${N}"

node index.js
