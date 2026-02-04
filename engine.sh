#!/data/data/com.termux/files/usr/bin/bash

# Colores profesionales
B='\033[1;34m'
G='\033[1;32m'
Y='\033[1;33m'
R='\033[1;31m'
W='\033[1;37m'
N='\033[0m'

clear
echo -e "${B}==================================================${N}"
echo -e "${W}          CAT BOT OS | SYSTEM INTERFACE           ${N}"
echo -e "${B}==================================================${N}"
echo -e "${Y}AVISO DE LICENCIA PRIVADA:${N}"
echo -e "Este sistema contiene APIs de propiedad privada."
echo -e "La filtración de datos conlleva sanciones legales."
echo ""
echo -e "${R}¿ACEPTA TODOS LOS TÉRMINOS Y LA POLÍTICA? (y/n):${N}"
read -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${R}==================================================${N}"
    echo -e "${R}      TU INTENTO DE EJECUCIÓN HA SIDO DENEGADO    ${N}"
    echo -e "${R}==================================================${N}"
    exit 1
fi

echo -e "${G}==================================================${N}"
echo -e "${G}          TU PERMISO HA SIDO AUTORIZADO           ${N}"
echo -e "${G}==================================================${N}"

# Crear señal para que index.js genere la imagen
touch .gen_license

# Instalación rápida de librería de imagen si no existe
if [ ! -d "node_modules/jimp" ]; then
    echo -e "${B}[*] Configurando motor de licencias...${N}"
    npm install jimp --silent
fi

node index.js
