import QRCode from 'qrcode'
import { Client, LocalAuth } from 'whatsapp-web.js'
import z from 'zod/v4'

const envSchema = z.object(
  {
    WHATSAPP_GROUP_ID: z.string().min(1),
  },
  { error: 'Required environment variables missing' },
)

const env = envSchema.parse(process.env)

const client = new Client({ authStrategy: new LocalAuth() })

client.on('qr', async (qr) => {
  console.log('Scan the below QR to login')
  const qrString = await QRCode.toString(qr)
  console.log(qrString)
})

client.on('ready', async () => {
  console.log('Client is ready!')
  const messages = await client.getChatById(env.WHATSAPP_GROUP_ID)
  console.log(messages.lastMessage.body)
})

client.on('message', (msg) => {
  console.log(msg.body)
})

client.initialize()
