import QRCode from 'qrcode'
import { Client, LocalAuth } from 'whatsapp-web.js'
import { env } from './env'
import { fetchMessages } from './fetchMessages'
import { parseMessages } from './parseMessage'
import { prepareMessages } from './prepareMessages'

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
  currentDate.setDate(currentDate.getDate() - 2)
  const messages = prepareMessages(
    await fetchMessages({ chat, from: currentDate }),
  )
  //  const result = await parseMessages(messages)
  console.log(JSON.stringify(messages, null, 2))
  // console.log(JSON.stringify(result))
})

client.initialize()
