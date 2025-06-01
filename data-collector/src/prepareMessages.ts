import { env } from './env'

type BaseMessage = {
  timestamp: number
  senderId: string
  text: string
}

const anonymizeSenderId = (id: string) =>
  Bun.hash(`${env.SENDER_ID_HASH_SECRET}:${id}`).toString(16)

const combineText = <T extends BaseMessage>(messages: T[]) => {
  const first = messages.at(0)
  if (!first) return null
  return { ...first, text: messages.map((message) => message.text).join('\n') }
}

const aggregateSenderMessages = <T extends BaseMessage>(messages: T[]) => {
  const senderGroups = Object.groupBy(messages, (message) => message.senderId)
  return Object.values(senderGroups)
    .map((messagesBySender) => combineText(messagesBySender || []))
    .filter(Boolean)
}

export const prepareMessages = <T extends BaseMessage>(messages: T[]) => {
  const messagesWithDate = messages.map((message) => ({
    ...message,
    timestamp: new Date(message.timestamp * 1000),
  }))
  const dayAggregations = Object.groupBy(messagesWithDate, (messages) =>
    messages.timestamp.toDateString(),
  )
  return Object.values(dayAggregations)
    .flatMap((messagesOnDay) => aggregateSenderMessages(messagesOnDay || []))
    .map((message) => ({
      ...message,
      senderId: anonymizeSenderId(message.senderId),
    }))
}
