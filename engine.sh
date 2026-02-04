#!/data/data/com.termux/files/usr/bin/bash

# Colores y Estilos
B='\033[1;34m'
G='\033[1;32m'
Y='\033[1;33m'
R='\033[1;31m'
W='\033[1;37m'
C='\033[1;36m'
N='\033[0m'

# Función de Animación de Carga
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

clear

# Logo ASCII CAT BOT
echo -e "${C}"
echo -e "      |\      _,,,---,,_     "
echo -e "ZZZzz /,`.-'`'    -.  ;-;;,_ "
echo -e "     |,4-  ) )-,_. ,\ (  `'-'"
echo -e "    '---''(_/--'  `-'\_)     "
echo -e "${N}"

echo -e "${B}==================================================${N}"
echo -e "${W}          CAT BOT OS | SYSTEM INTERFACE           ${N}"
echo -e "${B}==================================================${N}"
echo -e "${Y}AVISO DE SEGURIDAD:${N}"
echo -e "Iniciando protocolos de protección de APIs..."
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

# Instalación optimizada con Barra de Progreso y Animación
if [ ! -d "node_modules/jimp" ]; then
    echo -e "${C}[*] Configurando motor de licencias de alta velocidad...${N}"
    
    # Ejecutar npm install en segundo plano
    npm install jimp --no-fund --no-audit --quiet & 
    pid=$! # Guardar ID del proceso
    
    # Mostrar spinner mientras se instala
    spinner $pid
    
    wait $pid # Esperar a que termine
    echo -e "${G}[✓] Motor de licencias configurado con éxito.${N}"
else
    echo -e "${G}[✓] Entorno de licencias verificado.${N}"
fi

# Animación final antes de lanzar el bot
echo -ne "${B}[...] Lanzando Núcleo del Sistema ${N}"
sleep 0.5; echo -ne "${B}. ${N}"; sleep 0.5; echo -ne "${B}. ${N}"; sleep 0.5; echo -e "${B}. ${N}"

# Limpieza de pantalla antes de entrar al Bot
clear
node index.js
