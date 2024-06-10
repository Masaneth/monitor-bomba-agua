# Usar una imagen base con soporte para VLC y FFmpeg
FROM ubuntu:22.04

# Instalar VLC y FFmpeg
RUN apt-get update && \
    apt-get install -y vlc ffmpeg && \
    apt-get clean

# Crear un directorio para los scripts
RUN mkdir -p /usr/local/bin/scripts

# Copiar los scripts al contenedor
COPY media_audio.sh /usr/local/bin/scripts/media_audio.sh
COPY monitor_bomba.sh /usr/local/bin/scripts/monitor_bomba.sh

# Dar permisos de ejecución a los scripts
RUN chmod +x /usr/local/bin/scripts/media_audio.sh
RUN chmod +x /usr/local/bin/scripts/monitor_bomba.sh

# Establecer el directorio de trabajo
WORKDIR /usr/local/bin/scripts

# Comando por defecto
CMD ["bash"]