import QRCode from 'qrcode'
import {
  type Message,
  fromInterestedGroup,
  isValid,
  transformMessgae,
} from './prepareMessages'
import { trpc } from './trpc'

import { Mutex } from 'async-mutex'
import { makeWASocket, useMultiFileAuthState } from 'baileys'

const { state, saveCreds } = await useMultiFileAuthState('.auth')

const socket = makeWASocket({
  auth: state,
  syncFullHistory: true,
  shouldSyncHistoryMessage: () => true,
  markOnlineOnConnect: false,
})

const log = socket.logger.child({ name: 'collector' })

socket.ev.on('connection.update', async (update) => {
  const { qr, connection, lastDisconnect } = update
  if (qr) {
    console.log('Scan the qr code to login')
    console.log(await QRCode.toString(qr, { type: 'terminal', small: true }))
  }
  if (connection === 'close') {
    console.error('Connection closed with error', lastDisconnect)
    process.exit(1)
  }
})

socket.ev.on('creds.update', saveCreds)

// TODO: Move it out of memory, say, to a file
let pendingMessages: Message[] = []
const insertMutex = new Mutex()

const insert = async (messages: Message[]) =>
  // Mutex is needed as insert called from event handler and interval handler might clash
  // and try to mutate pendingMessages simultaneously
  await insertMutex.runExclusive(async () => {
    const currentBatch = [...pendingMessages, ...messages]
    if (currentBatch.length === 0) return
    const insertResult = await trpc.insertRawMessages.mutate(currentBatch)
    if (!insertResult.success) {
      log.warn({
        event: 'insertFailed',
        pendingMessageCount: currentBatch.length,
      })
      pendingMessages = currentBatch
      return
    }
    log.info({ event: 'successfulInsert', insertCount: currentBatch.length })
  })

setInterval(async () => {
  if (pendingMessages.length === 0) return
  log.info({
    event: 'trySyncPendingMessages',
    messageCount: pendingMessages.length,
  })
  await insert([])
}, 5000)

socket.ev.on('messaging-history.set', async ({ messages }) => {
  const filteredMessages = messages
    .filter(fromInterestedGroup)
    .map(transformMessgae)
    .filter(isValid)
  await insert(filteredMessages)
})

socket.ev.on('messages.upsert', async ({ messages }) => {
  const filteredMessages = messages
    .filter(fromInterestedGroup)
    .map(transformMessgae)
    .map((it) => {
      console.log(it)
      return it
    })
    .filter(isValid)
  await insert(filteredMessages)
})
