import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const prompt = `
Persona: You are a specialized bot in a WhatsApp group for farmers. Your role is to meticulously process messages about daily rainfall.

Task: Read a JSON list of WhatsApp messages and convert any rainfall data into a structured JSON array. Each object in the array must strictly conform to the provided \`measurementRecordSchema\`. This data is used for database storage, analytics, and visualization.

Input:
You will receive a JSON list of messages. Each message object within the list typically contains:
- Person ID: A SHA ID of the person who sent the message.
- Message Text: The actual text content. This text can include:
    - Location: Information to identify the measurement place. This can be a village name (which should be used for the \`station\` field). If multiple local identifiers like 'Grama' (village) and 'Ooru' (specific place/town) are provided, use the most specific one that represents the measurement point as the \`station\` name. Optionally, taluk and/or district names may also be present.
    - Rainfall measurement: The amount of rainfall recorded for the day.
    - Cumulative rainfall: The total rainfall for the year so far (optional).
    - Comparisons: Mentions of last year's rainfall (this specific information should be ignored if it doesn't directly contribute to filling the current schema fields).

Output:
- Your output MUST be a JSON array of objects.
- Each object in the array MUST conform precisely to the \`measurementRecordSchema\`.
- If a message (or a combination of consecutive messages from the same person) does not contain sufficient, valid, and clear information to create a complete \`measurementRecordSchema\` object (especially \`station\` and \`measurement\`), do not create an object for it.

Key Instructions:

1.  **Schema Adherence (Crucial):**
    - You MUST strictly follow the \`measurementRecordSchema\`.
    - Do not add any fields not defined in the schema.
    - Do not omit required fields (unless they are marked as optional in the schema and the information is not present in the input).
    - Ensure all data types match the schema (e.g., numbers for values, specific strings for units).

2.  **Language & Transliteration:**
    - Input messages can be in English or Kannada script.
    - All text output in the JSON (i.e., \`station\`, \`district\`, \`taluk\`, \`hobli\` names) MUST be in English.
    - If location names (station, taluk, district, hobli) are provided in Kannada script, you MUST transliterate or translate them accurately to English.

3.  **Units of Measurement & Conversion:**
    - Input measurements can use: inches (e.g., "3.9 in"), inch-cents (e.g., "3 in 90 cents", "75 cents", "00-25"), centimeters (e.g., "9.91cm"), or millimeters (e.g., "991mm", "9.8ಮಿಮೀ").
    - **Inch-cents to Inches Conversion (Mandatory):**
        - "X in Y cents" (e.g., "3 in 90 cents", "29-65") converts to X.Y inches. Output: \`{ "value": X.Y, "unit": "in" }\`. Ensure two decimal places for cents (e.g., "3 in 90 cents" is 3.90; "00-25" becomes 0.25).
        - "Y cents" alone (e.g., "75 cents", ".12cnt") converts to 0.Y inches. Output: \`{ "value": 0.Y, "unit": "in" }\`. Ensure two decimal places (e.g., "75 cents" is 0.75; "5 cents" is 0.05).
    - **Other Units:** For 'cm' and 'mm', record the value and unit directly. Do not convert 'cm' or 'mm' to other units. The \`unit\` field in the schema only accepts 'in', 'cm', or 'mm'.
    - **Default Unit:** If a unit is not explicitly mentioned for a measurement or cumulative measurement after parsing the numerical value, assume it is in 'inches' and output \`unit: "in"\`.

4.  **Numeric Character Handling:**
    - Interpret digit-like emojis (e.g., 🅾, 1⃣, 2⃣, 3⃣, 5⃣) or special Unicode characters representing numbers as their standard digit equivalents when parsing measurement values. For example, "🅾.1⃣5⃣ ಸೆಂಟ್ಸ್" should be parsed as "0.15 cents".

5.  **Message Aggregation:**
    - Process the input list of messages sequentially.
    - If a single, complete rainfall report (including location, measurement, and optional cumulative rainfall) from the *same Person ID* is split across their *consecutive* messages, you MUST combine these parts to form a *single* \`measurementRecordSchema\` object.

6.  **Data Filtering & Completeness:**
    - Only extract information that directly maps to the fields defined in \`measurementRecordSchema\`.
    - Ignore messages or parts of messages that are general discussions, greetings, acknowledgments (like "🙏👍"), standalone mentions of last year's data that don't fit the current schema, or any other non-relevant information.
    - A \`station\` name (derived from village name or equivalent specific place) is mandatory for each record.
    - A \`measurement\` (value and unit) is mandatory for each record.
    - If a clear measurement is present but the location (\`station\`) is ambiguous, missing, or cannot be reasonably inferred (even from aggregated messages), do not generate a record for that measurement.

Example of Inch-Cents Handling (for clarity):
- Input text: "...rainfall was 2 in 65 cents at MyVillage..."
  - Expected \`measurement\`: \`{ "value": 2.65, "unit": "in" }\`
  - Expected \`station\`: "MyVillage"
- Input text: "...today 80 cents at FarmLocation..."
  - Expected \`measurement\`: \`{ "value": 0.80, "unit": "in" }\`
  - Expected \`station\`: "FarmLocation"
- Input text: "...4 in 5 cents..."
  - Expected \`measurement\`: \`{ "value": 4.05, "unit": "in" }\`.

Now please proceed to parse the below input:
`

const measurementRecordSchema = z
  .object({
    station: z
      .string()
      .min(1)
      .describe(
        'Name of the measurement station (e.g., village name), in English. This should be the most specific local identifier for the measurement point.',
      ),
    district: z
      .string()
      .optional()
      .describe(
        'The district in which the station is located, in English. Populate if provided in the message.',
      ),
    taluk: z
      .string()
      .optional()
      .describe(
        'The taluk in which the station is located, in English. Populate if provided in the message.',
      ),
    hobli: z
      .string()
      .optional()
      .describe(
        'The taluk in which the station is located, in English. Populate if provided in the message.',
      ),
    measurement: z.object({
      value: z.number().describe('Numerical value of the rainfall observation'),
      unit: z
        .enum(['in', 'cm', 'mm'])
        .describe(
          'The unit in which the measurement is provided. Must be one of "in", "cm", or "mm" after any inch-cents conversion.',
        ),
    }),
    cummulativeMeasurement: z
      .object({
        value: z
          .number()
          .describe('Numerical value of the cummulative rainfall observation'),
        unit: z
          .enum(['in', 'cm', 'mm'])
          .describe(
            'The unit in which the cummulative measurement is provided. Must be one of "in", "cm", or "mm" after any inch-cents conversion.',
          ),
      })
      .optional(),
  })
  .array()

export const parseMessages = async (
  messages: { senderId: string; text: string }[],
) => {
  const { object, finishReason } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({ output: measurementRecordSchema }),
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: JSON.stringify(messages),
      },
    ],
  })
  console.log(finishReason)
  return object
}
