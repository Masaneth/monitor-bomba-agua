require('dotenv').config()
const { spawn } = require('child_process')
const axios = require('axios')

// Cargar las variables de entorno
const RTSP_URL = process.env.RTSP_URL
const SILENCE_DURATION = parseFloat(process.env.SILENCE_DURATION)
const MIN_VOLUME = process.env.MIN_VOLUME
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL

// Obtener la hora actual ajustada a la zona horaria de Madrid
function getMadridTime() {
	const now = new Date()
	const offset = -120 // Madrid (CEST) tiene un offset de +2 horas respecto al UTC en verano
	const madridTime = new Date(now.getTime() + offset * 60000) // Convertir minutos a milisegundos
	return madridTime
}

// Comando para capturar el stream de audio y detectar picos de sonido
function captureAudio() {
	const ffmpegProcess = spawn('ffmpeg', [
		'-rtsp_transport',
		'tcp',
		'-i',
		RTSP_URL,
		'-af',
		`silencedetect=noise=${MIN_VOLUME}:d=${SILENCE_DURATION}`,
		'-f',
		'null',
		'-',
	])

	ffmpegProcess.stderr.on('data', (data) => {
		const lines = data.toString().split('\n')
		lines.forEach((line) => {
			if (line.includes('silence_start')) {
				start_time = getMadridTime()
					.toISOString()
					.slice(0, 19)
					.replace('T', ' ')
			} else if (line.includes('silence_end')) {
				const end_time = getMadridTime()
					.toISOString()
					.slice(0, 19)
					.replace('T', ' ')
				const duration =
					(new Date(end_time).getTime() - new Date(start_time).getTime()) / 1000
				console.log(
					`Activación de la bomba de agua detectada en ${start_time}, duración: ${duration} segundos`
				)

				// Enviar petición POST al webhook utilizando axios
				axios
					.post(WEBHOOK_BASE_URL, {
						fecha: start_time,
						duracion: duration,
					})
					.then((response) => console.log(response.data))
					.catch((error) => console.error('Error en la petición:', error))
			}
		})
	})

	ffmpegProcess.on('error', (err) =>
		console.error('Error al iniciar FFMPEG:', err)
	)
}

// Ejecutar la captura de audio
captureAudio()
