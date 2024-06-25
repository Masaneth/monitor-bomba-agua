const ffmpeg = require('fluent-ffmpeg')
const axios = require('axios')
require('dotenv').config() // Asegúrate de cargar las variables de entorno

const rtspUrl = process.env.RTSP_URL // Reemplaza con tu URL RTSP
const webhookUrl = process.env.WEBHOOK_URL // Reemplaza con tu URL de webhook

if (!rtspUrl || !webhookUrl) {
	console.error(
		'RTSP_URL or WEBHOOK_URL is not set in the environment variables'
	)
	process.exit(1)
}

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
		.outputOptions('-f null') // Formato null para la salida
		.on('start', () => {
			console.log(`Checking stream: ${rtspUrl}`)
		})
		.on('codecData', () => {
			console.log('Stream is online')
			// Aquí puedes agregar lógica adicional si es necesario
		})
		.on('error', (err, stdout, stderr) => {
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
		.output('-') // Especificar una salida dummy
		.run()
}

// Comprobar el stream cada 5 minutos
setInterval(checkStream, 5 * 60 * 1000)

// Ejecución inicial
checkStream()
