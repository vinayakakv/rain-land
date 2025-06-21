import type { proto } from 'baileys'
import { env } from './env'

const anonymizeSenderId = (id: string) =>
  Bun.hash(`${env.SENDER_ID_HASH_SECRET}:${id}`).toString(16)

export const fromInterestedGroup = (message: proto.IWebMessageInfo) => {
  return message.key.remoteJid === env.WHATSAPP_GROUP_ID
}

export const transformMessgae = (message: proto.IWebMessageInfo) => {
  const senderId = message.key.participant || message.key.remoteJid
  const text = message.message?.conversation || ''
  const messageTimestamp = Number(message.messageTimestamp || 0)
  return {
    senderId: anonymizeSenderId(senderId || ''),
    senderName: message.pushName || '',
    text,
    timestamp: new Date(messageTimestamp * 1000) || new Date().getTime(),
    valid: Boolean(senderId && text && messageTimestamp),
  }
}

export type Message = ReturnType<typeof transformMessgae>

export const isValid = (message: Message) => message.valid
