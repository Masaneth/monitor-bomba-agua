require('dotenv').config()
const { spawn } = require('child_process')
const axios = require('axios')

const RTSP_URL = process.env.RTSP_URL
const MIN_VOLUME = parseFloat(process.env.MIN_VOLUME)
const WEBHOOK_URL = process.env.WEBHOOK_URL
const PEAK_DURATION = parseInt(process.env.PEAK_DURATION)

console.log(`RTSP URL: ${RTSP_URL}`)
console.log(`Webhook URL: ${WEBHOOK_URL}`)
console.log(`Peak duration: ${PEAK_DURATION}`)
console.log(`Volumen mínimo: ${MIN_VOLUME}`)

let pumpActive = false
let activationStartTime = null
let volumeWindow = []
const windowSize = PEAK_DURATION * 10 // Ajustar en función de la frecuencia de muestreo (10 muestras por segundo)

// Función para enviar solicitud al webhook
const sendWebhook = async (startTime, duration) => {
	const data = {
		fecha: startTime,
		duracion: duration,
	}

	try {
		const response = await axios.post(WEBHOOK_URL, data, {
			headers: {
				'Content-Type': 'application/json',
			},
		})
		console.log(`Webhook response status: ${response.status}`)
		console.log(`Webhook response data: ${JSON.stringify(response.data)}`)
	} catch (error) {
		console.error(`Webhook error: ${error.message}`)
	}
}

// Función para formatear la fecha y hora
const formatDateTime = (date) => {
	const pad = (num) => (num < 10 ? '0' + num : num)
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate()
	)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
		date.getSeconds()
	)}`
}

// Función para calcular el volumen RMS
const getRMSVolume = (samples) => {
	let sum = 0.0
	for (let i = 0; i < samples.length; i++) {
		sum += samples[i] * samples[i]
	}
	let rms = Math.sqrt(sum / samples.length)
	let db = 20 * Math.log10(rms / 32768) // 32768 es el valor máximo para una muestra de 16 bits
	return isNaN(db) ? -Infinity : db
}

// Proceso FFmpeg
const ffmpeg = spawn('ffmpeg', [
	'-i',
	RTSP_URL,
	'-vn', // Sin video
	'-f',
	'wav',
	'-acodec',
	'pcm_s16le',
	'-',
])

ffmpeg.stderr.on('data', (data) => {
	//console.error(`FFmpeg stderr: ${data}`);
})

// Análisis del flujo de audio
ffmpeg.stdout.on('data', (chunk) => {
	const samples = new Int16Array(
		chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength)
	)
	const volume = getRMSVolume(samples)

	volumeWindow.push(volume)
	if (volumeWindow.length > windowSize) {
		volumeWindow.shift()
	}

	const currentTime = new Date()

	// Verificar si el volumen promedio en la ventana está por encima del volumen mínimo
	const averageVolume =
		volumeWindow.reduce((sum, val) => sum + val, 0) / volumeWindow.length
	//console.log(`Average Volume: ${averageVolume}`);

	if (averageVolume >= MIN_VOLUME && !pumpActive) {
		pumpActive = true
		activationStartTime = currentTime
	} else if (averageVolume < MIN_VOLUME && pumpActive) {
		pumpActive = false
		const activationEndTime = currentTime
		const duration = (activationEndTime - activationStartTime) / 1000 // Duración en segundos

		if (duration >= PEAK_DURATION) {
			const formattedStartTime = formatDateTime(activationStartTime)
			sendWebhook(formattedStartTime, duration)
			console.log(`Pump activated at: ${formattedStartTime}`)
			console.log(`Activation duration: ${duration} seconds`)
		}
	}
})

ffmpeg.on('close', (code) => {
	console.log(`FFmpeg process exited with code ${code}`)
})
