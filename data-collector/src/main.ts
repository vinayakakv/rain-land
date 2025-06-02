import QRCode from 'qrcode'
import { Client, LocalAuth } from 'whatsapp-web.js'
import { env } from './env'
import { fetchMessages } from './fetchMessages'
import { prepareMessages } from './prepareMessages'
import { trpc } from './trpc'

const client = new Client({ authStrategy: new LocalAuth() })

client.on('qr', async (qr) => {
  console.log('Scan the below QR to login')
  const qrString = await QRCode.toString(qr)
  console.log(qrString)
})

client.on('ready', async () => {
  console.log('Client is ready!')
  const chat = await client.getChatById(env.WHATSAPP_GROUP_ID)
  const lastMessageTimestamp = new Date(
    await trpc.getLastMessageTimestamp.query(),
  )
  const messages = prepareMessages(
    await fetchMessages({
      chat,
      from: lastMessageTimestamp,
    }),
  )
  if (messages.length === 0) {
    console.log(
      `No new messages from last update time - ${lastMessageTimestamp}. Exiting.`,
    )
    process.exit(0)
  }
  console.log('Proceeding to send messages to server', messages)
  const insertResult = await trpc.insertRawMessages.mutate(messages)
  console.log('Server inserted the messages', insertResult)
})

await client.initialize()
