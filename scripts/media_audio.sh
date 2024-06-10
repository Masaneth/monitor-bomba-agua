#!/bin/bash

# Dirección RTSP de la cámara
rtsp_url="rtsp://admin:admin@192.168.18.105:554/1"

# Duración total de la captura en segundos (15 minutos)
total_capture_duration=$((5 * 60))

# Duración de cada intervalo de captura en segundos (1 minuto)
capture_interval=60

# Número total de intervalos
num_intervals=$((total_capture_duration / capture_interval))

# Bucle para capturar la media y el pico cada minuto
for ((i = 0; i < num_intervals; i++)); do
    # Capturar audio durante el intervalo y calcular la media y el pico
    ffmpeg_output=$(ffmpeg -hide_banner -i "$rtsp_url" -af volumedetect -t "$capture_interval" -f null - 2>&1)
    mean_volume=$(echo "$ffmpeg_output" | grep -oE "mean_volume: -?[0-9]+(\.[0-9]+)? dB" | awk '{print $2}')
    max_volume=$(echo "$ffmpeg_output" | grep -oE "max_volume: -?[0-9]+(\.[0-9]+)? dB" | awk '{print $2}')

    # Imprimir la media y el pico
    echo "Minuto $((i + 1)): Media de decibelios: $mean_volume dB, Pico más alto: $max_volume dB"

    # Esperar 60 segundos antes de la siguiente captura
    sleep "$capture_interval"
done