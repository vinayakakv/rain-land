import QRCode from 'qrcode'
import { Client, LocalAuth } from 'whatsapp-web.js'
import { z } from 'zod/v4'
import { fetchMessages } from './fetchMessages'
import { parseMessages } from './parseMessage'

const envSchema = z.object(
  {
    WHATSAPP_GROUP_ID: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
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
  const chat = await client.getChatById(env.WHATSAPP_GROUP_ID)
  const currentDate = new Date()
  currentDate.setHours(0)
  const messages = await fetchMessages({ chat, from: currentDate })
  //  const result = await parseMessages(messages)
  console.log(JSON.stringify(messages, null, 2))
  // console.log(JSON.stringify(result))
})

client.on('message', (msg) => {
  console.log(msg.body)
})

client.initialize()
