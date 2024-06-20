require('dotenv').config()
const { execSync } = require('child_process')

// Cargar las variables de entorno
const rtsp_url = process.env.RTSP_URL
const total_capture_duration = parseInt(process.env.TOTAL_CAPTURE_DURATION, 10)
const capture_interval = parseInt(process.env.CAPTURE_INTERVAL, 10)

// Número total de intervalos
const num_intervals = total_capture_duration / capture_interval

// Bucle para capturar la media y el pico cada minuto
for (let i = 0; i < num_intervals; i++) {
	try {
		// Capturar audio durante el intervalo y calcular la media y el pico
		const ffmpeg_output = execSync(
			`ffmpeg -hide_banner -i "${rtsp_url}" -af volumedetect -t ${capture_interval} -f null - 2>&1`
		).toString()
		const mean_volume_match = ffmpeg_output.match(
			/mean_volume: -?[0-9]+(\.[0-9]+)? dB/
		)
		const max_volume_match = ffmpeg_output.match(
			/max_volume: -?[0-9]+(\.[0-9]+)? dB/
		)

		const mean_volume = mean_volume_match
			? mean_volume_match[0].split(':')[1].trim()
			: 'N/A'
		const max_volume = max_volume_match
			? max_volume_match[0].split(':')[1].trim()
			: 'N/A'

		// Imprimir la media y el pico
		console.log(
			`Minuto ${
				i + 1
			}: Media de decibelios: ${mean_volume} dB, Pico más alto: ${max_volume} dB`
		)
	} catch (error) {
		console.error('Error al capturar el audio:', error)
	}

	// Esperar 60 segundos antes de la siguiente captura
	sleep(capture_interval * 1000)
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
