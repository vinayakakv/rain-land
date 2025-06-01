import type { Chat, Message } from 'whatsapp-web.js'

export const fetchMessages = async (args: { chat: Chat; from: Date }) => {
  const { chat, from } = args
  const limit = 10
  let tryCount = 1
  let messages: Message[] = []
  let messageCount = 0
  const fromUnixTimestamp = Math.floor(from.getTime() / 1000)
  while (true) {
    messages = await chat.fetchMessages({ limit: limit * tryCount })
    const firstTimestamp = messages.at(0)?.timestamp
    if (
      messages.length === messageCount ||
      !firstTimestamp ||
      firstTimestamp <= fromUnixTimestamp
    ) {
      break
    }
    tryCount += 1
    messageCount = messages.length
  }
  const filteredMessages = messages.filter(
    (message) => message.body && message.timestamp > fromUnixTimestamp,
  )
  const messagesWithSenderNames = await Promise.all(
    filteredMessages.map(async (message) => ({
      ...message,
      senderName: (await message.getContact()).pushname,
    })),
  )
  return messagesWithSenderNames.map((message) => ({
    // biome-ignore lint/style/noNonNullAssertion: Since we are looking messages from a group, `author` will always be present
    senderId: message.author!,
    text: message.body,
    timestamp: message.timestamp,
    senderName: message.senderName || '',
  }))
}
