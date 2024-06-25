const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')
const axios = require('axios')

// Configura el path de ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath)

const rtspUrl = process.env.RTSP_URL // Reemplaza con tu URL RTSP
const webhookUrl = process.env.WEBHOOK_URL // Reemplaza con tu URL de webhook

function sendWebhookNotification(message) {
	axios
		.post(webhookUrl, { text: message })
		.then((response) => {
			console.log('Webhook notification sent:', response.statusText)
		})
		.catch((error) => {
			console.error('Error sending webhook notification:', error.message)
		})
}

function checkStream() {
	ffmpeg(rtspUrl)
		.inputOptions(['-rtsp_transport tcp'])
		.on('start', () => {
			console.log(`Checking stream: ${rtspUrl}`)
		})
		.on('codecData', () => {
			console.log('Stream is online')
		})
		.on('error', (err) => {
			if (
				err.message.includes('Connection refused') ||
				err.message.includes('Server returned 404 Not Found')
			) {
				console.log('Stream is offline')
				sendWebhookNotification(`Stream ${rtspUrl} is offline`)
			} else {
				console.error('Error:', err.message)
			}
		})
		.on('end', () => {
			console.log('Finished checking stream')
		})
		.output('/dev/null') // No necesitamos guardar la salida
		.run()
}

// Comprobar el stream cada 5 minutos
setInterval(checkStream, 5 * 60 * 1000)

// Ejecución inicial
checkStream()
