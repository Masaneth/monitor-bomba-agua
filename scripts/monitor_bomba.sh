#!/bin/bash

# Comando para capturar el stream de audio y detectar picos de sonido
capture_audio() {
    vlc -I dummy rtsp://admin:admin@192.168.18.105:554/1 --sout '#transcode{acodec=s16l}:std{access=file,mux=wav,dst=-}' | \
    ffmpeg -i pipe:0 -af "silencedetect=noise=-40dB:d=0.5" -f null - 2>&1 | \
    while read -r line; do
        if [[ $line == *"silence_start"* ]]; then
            start_time=$(date +"%Y-%m-%d %H:%M:%S")
        elif [[ $line == *"silence_end"* ]]; then
            end_time=$(date +"%Y-%m-%d %H:%M:%S")
            duration=$(($(date -d "$end_time" +%s) - $(date -d "$start_time" +%s)))
            echo "Activación de la bomba de agua detectada en $start_time, duración: $duration segundos" | tee -a sonido.log
        fi
    done
}

# Ejecutar la captura de audio
capture_audio

