require('dotenv').config()
const { spawn } = require('child_process')

// Cargar las variables de entorno
const rtsp_url = process.env.RTSP_URL
const total_capture_duration = parseInt(process.env.TOTAL_CAPTURE_DURATION, 10)
const capture_interval = parseInt(process.env.CAPTURE_INTERVAL, 10)

// Número total de intervalos
const num_intervals = total_capture_duration / capture_interval

console.log(`RTSP URL: ${rtsp_url}`)
console.log(`Total capture duration: ${total_capture_duration}`)
console.log(`Capture interval: ${capture_interval}`)
console.log(`Number of intervals: ${num_intervals}`)

async function captureAudio() {
	for (let i = 0; i < num_intervals; i++) {
		console.log(`Starting capture for interval ${i + 1}...`)

		const ffmpegProcess = spawn('ffmpeg', [
			'-rtsp_transport',
			'tcp',
			'-i',
			rtsp_url,
			'-af',
			'volumedetect',
			'-t',
			capture_interval.toString(),
			'-f',
			'null',
			'-',
		])

		let ffmpegOutput = ''

		ffmpegProcess.stderr.on('data', (data) => {
			ffmpegOutput += data.toString()
		})

		await new Promise((resolve) => {
			ffmpegProcess.on('close', (code) => {
				// Filtrar y analizar la salida relevante
				const mean_volume_match = ffmpegOutput.match(
					/mean_volume: -?[0-9]+(\.[0-9]+)? dB/
				)
				const max_volume_match = ffmpegOutput.match(
					/max_volume: -?[0-9]+(\.[0-9]+)? dB/
				)

				const mean_volume = mean_volume_match
					? mean_volume_match[0].split(':')[1].trim()
					: 'N/A'
				const max_volume = max_volume_match
					? max_volume_match[0].split(':')[1].trim()
					: 'N/A'

				// Imprimir solo la media y el pico
				console.log(
					`Minuto ${
						i + 1
					}: Media de decibelios: ${mean_volume} dB, Pico más alto: ${max_volume} dB`
				)

				resolve()
			})

			ffmpegProcess.on('error', (err) => {
				console.error('Error al iniciar FFMPEG:', err)
				resolve() // Resolver el promise en caso de error para continuar el bucle
			})
		})

		// Esperar antes de la siguiente captura
		await sleep(capture_interval * 1000)
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

// Ejecutar la función principal
captureAudio()
