import type { proto } from 'baileys'
import { env } from './env'

export const fromInterestedGroup = (message: proto.IWebMessageInfo) => {
  return (
    message.key.remoteJid?.includes(env.WHATSAPP_GROUP_ID) &&
    message.key.remoteJid.endsWith('@g.us')
  )
}

export const transformMessgae = (message: proto.IWebMessageInfo) => {
  const senderId = message.key.participant || message.key.remoteJid
  const text = (message.message?.conversation || '').slice(0, 2000)
  const messageTimestamp = Number(message.messageTimestamp || 0)
  return {
    senderId: senderId || '',
    senderName: message.pushName || '',
    text,
    timestamp: new Date(messageTimestamp * 1000) || new Date().getTime(),
    valid: Boolean(senderId && text && messageTimestamp),
  }
}

export type Message = ReturnType<typeof transformMessgae>

export const isValid = (message: Message) => message.valid
