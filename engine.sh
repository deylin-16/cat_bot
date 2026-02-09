#!/data/data/com.termux/files/usr/bin/bash

# Colores Profesionales
B='\033[1;34m'
G='\033[1;32m'
Y='\033[1;33m'
R='\033[1;31m'
W='\033[1;37m'
C='\033[1;36m'
N='\033[0m'

# Función de Animación: Gato Corriendo
cat_running() {
    local pid=$1
    local delay=0.2
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        echo -ne "\r${C}  ${W}Loading. ${C}  _ "
        sleep $delay
        echo -ne "\r${C} ${W}Loading.. ${C} ( )"
        sleep $delay
        echo -ne "\r${C} ${W}Loading... ${C}  / "
        sleep $delay
    done
    echo -e "\n"
}

# 1. Solicitar permisos de almacenamiento automáticamente
clear
echo -e "${B}[!] ACTIVANDO PROTOCOLO DE ALMACENAMIENTO...${N}"
termux-setup-storage
sleep 2

clear
# Logo Gato Saludando
echo -e "${C}"
echo -e "      |\__/,|   "
echo -e "    _.|o o  |_  ${W}  ¡Hola, usuario!${C}"
echo -e "  -(((---(((    ${W} Soy CAT BOT Mucho gusto.${C}"
echo -e "Estás apunto de iniciar una aventura llena de sorpresas..."
echo -e "${N}"

echo -e "${B}==================================================${N}"
echo -e "${W}          CAT BOT OS | PROTOCOLO DE SEGURIDAD     ${N}"
echo -e "${B}==================================================${N}"

# PRIMERA PREGUNTA: TÉRMINOS RED Z
echo -e "${Y}[1] TÉRMINOS DE PRIVACIDAD:${N}"
echo -e "Aceptas que este sistema es de uso privado y las APIs"
echo -e "están protegidas bajo la Red Z de Deylin Eliac."
echo -ne "${R}¿ACEPTA ESTOS TÉRMINOS? (y/n): ${N}"
read -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${R}[!] ERROR: Licencia no aceptada.${N}"
    exit 1
fi

# SEGUNDA PREGUNTA: WHATSAPP
echo -e "\n${Y}[2] POLÍTICAS DE WHATSAPP:${N}"
echo -e "Aceptas cumplir con los términos de servicio de"
echo -e "WhatsApp y evitar el uso de SPAM masivo."
echo -ne "${R}¿ACEPTA LA VINCULACIÓN? (y/n): ${N}"
read -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${R}[!] ERROR: Protocolo de vinculación cancelado.${N}"
    exit 1
fi

echo -e "\n${G}==================================================${N}"
echo -e "${G}          ACCESO TOTALMENTE AUTORIZADO            ${N}"
echo -e "${G}==================================================${N}"

# Crear señal para index.js
touch .gen_license

# Instalación con Animación de Gato
if [ ! -d "node_modules/axios" ]; then
    echo -e "${B}[*] Instalando librerías del núcleo...${N}"
    
    # Instalación silenciosa
    npm install axios --no-fund --no-audit --quiet & 
    pid=$! 
    
    # Mostrar gato corriendo mientras instala
    cat_running $pid
    
    wait $pid
    echo -e "${G}[✓] Núcleo configurado.${N}"
fi

# Secuencia de lanzamiento
echo -ne "${B}[...] Iniciando Red Z ${N}"
sleep 0.4; echo -ne "${B}. ${N}"; sleep 0.4; echo -ne "${B}. ${N}"; sleep 0.4; echo -e "${B}. ${N}"

clear
node index.js
