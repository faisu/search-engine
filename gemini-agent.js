
const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');
const { z } = require('zod');

/**
 * Gemini-based agent that evaluates chat history and generates responses
 * Can use tools to query voter database
 */
class GeminiAgent {
  constructor(apiKey, dbUtils = null) {
    if (!apiKey) {
      throw new Error('Google Gemini API key is required. Set GEMINI_API_KEY environment variable.');
    }
    this.apiKey = apiKey;
    this.dbUtils = dbUtils;
  }

  /**
   * Format chat messages into a conversation history string
   * @param {Array} messages - Array of message objects from WhatsApp
   * @returns {string} Formatted conversation history
   */
  formatChatHistory(messages) {
    if (!messages || messages.length === 0) {
      return 'No previous conversation history.';
    }

    // Sort messages by timestamp to ensure chronological order
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    const historyLines = sortedMessages.map((msg, index) => {
      const sender = msg.sender?.pushname || msg.sender?.name || msg.from?.split('@')[0] || 'Unknown';
      const body = msg.body || '(media/empty message)';
      const time = new Date(msg.timestamp * 1000).toLocaleString();
      const isFromMe = msg.fromMe || false;
      const senderLabel = isFromMe ? 'You' : sender;
      
      return `[${time}] ${senderLabel}: ${body}`;
    });

    return historyLines.join('\n');
  }

  /**
   * Get tools for querying voter database
   * @returns {Object} Object with tool definitions as values
   */
  getTools() {
    if (!this.dbUtils) {
      return {};
    }

    return {
      getVoterByEpic: {
        description: 'Search for voter information by EPIC number (Voter ID). Use this when user provides their voter ID or EPIC number.',
        inputSchema: z.object({
          epicNumber: z.string().describe('The EPIC number or Voter ID (e.g., NCT6342834, RSP6350748)'),
        }),
        execute: async ({ epicNumber }) => {
          try {
            const voter = await this.dbUtils.getVoterByEpic(epicNumber);
            if (voter) {
              return this.dbUtils.formatVoterData(voter);
            }
            return `No voter found with EPIC number: ${epicNumber}`;
          } catch (error) {
            return `Error searching for voter: ${error.message}`;
          }
        },
      },
      searchVotersByName: {
        description: 'Search for voters by name. Use this when user provides a name to search for.',
        inputSchema: z.object({
          name: z.string().describe('The name to search for (partial matches supported)'),
          limit: z.number().optional().default(10).describe('Maximum number of results to return (default: 10)'),
        }),
        execute: async ({ name, limit = 10 }) => {
          try {
            const voters = await this.dbUtils.searchVotersByName(name, limit);
            return this.dbUtils.formatMultipleVoters(voters);
          } catch (error) {
            return `Error searching for voters: ${error.message}`;
          }
        },
      },
      searchVotersByMobile: {
        description: 'Search for voters by mobile number. Use this when user provides their phone number.',
        inputSchema: z.object({
          mobileNumber: z.string().describe('The mobile phone number to search for'),
        }),
        execute: async ({ mobileNumber }) => {
          try {
            const voters = await this.dbUtils.searchVotersByMobile(mobileNumber);
            return this.dbUtils.formatMultipleVoters(voters);
          } catch (error) {
            return `Error searching for voters: ${error.message}`;
          }
        },
      },
      getPollingStationDetails: {
        description: 'Get polling booth details by polling station number. Use this when user asks about a specific polling station.',
        inputSchema: z.object({
          pollingStationNumber: z.string().describe('The polling station number'),
        }),
        execute: async ({ pollingStationNumber }) => {
          try {
            const voters = await this.dbUtils.getVotersByPollingStation(pollingStationNumber);
            if (voters.length > 0) {
              const station = voters[0];
              return `📍 *Polling Station ${pollingStationNumber}:*\n` +
                     `   Name: ${station.polling_station_name || 'N/A'}\n` +
                     `   Address: ${station.polling_station_address || 'N/A'}\n` +
                     `   Total voters: ${voters.length}`;
            }
            return `No polling station found with number: ${pollingStationNumber}`;
          } catch (error) {
            return `Error searching for polling station: ${error.message}`;
          }
        },
      },
    };
  }

  /**
   * Evaluate chat history and generate a response using Gemini
   * @param {string} chatId - The chat ID to evaluate
   * @param {Array} chatHistory - Array of messages from the chat
   * @param {string} currentMessage - The current message that triggered the response
   * @param {Object} options - Optional configuration
   * @param {Function} options.onStep - Callback function called for each step (for interim messages)
   * @returns {Promise<string>} Generated response text
   */
  async generateResponse(chatId, chatHistory, currentMessage, options = {}) {
    try {
      // Format the conversation history
      const formattedHistory = this.formatChatHistory(chatHistory);
      
      // Create a prompt that includes context about the conversation
      const systemPrompt = `You are a helpful AI assistant helping voters find their polling booth details and voter information. Always provide options to proceed with the conversation.

You can help users by:
- Finding their polling booth details using their EPIC number (Voter ID)
- Searching for voter information by name or mobile number
- Providing polling station information

Be friendly, helpful, and provide clear information. If you need to search the database, use the available tools. Format your responses in a clear, WhatsApp-friendly way using emojis where appropriate.`;

      const userPrompt = `Here is the conversation history for chat ID: ${chatId}

${formattedHistory}

Current message to respond to: ${currentMessage}`;

      // Get tools if database is available
      const tools = this.getTools();
      
      // Generate response using Gemini with tools
      const result = await generateText({
        model: google('gemini-2.5-flash-lite'),
        system: systemPrompt,
        prompt: userPrompt,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        maxSteps: 5, // Allow multiple tool calls if needed
        apiKey: this.apiKey, // Fallback if env var not set
      });
      
      // Debug logging
      console.log('result', result);
      console.log('result.text:', result.text);
      console.log('result.steps:', result.steps?.length);
      if (result.steps && result.steps.length > 0) {
        const lastStep = result.steps[result.steps.length - 1];
        console.log('lastStep.finishReason:', lastStep.finishReason);
        console.log('lastStep.content:', lastStep.content);
        // Log tool calls if any
        result.steps.forEach((step, idx) => {
          if (step.content) {
            const toolCalls = step.content.filter(part => part.type === 'tool-call');
            const toolResults = step.content.filter(part => part.type === 'tool-result');
            if (toolCalls.length > 0) {
              console.log(`Step ${idx} tool calls:`, toolCalls.map(tc => tc.toolName));
            }
            if (toolResults.length > 0) {
              console.log(`Step ${idx} tool results:`, toolResults.length, 'results');
            }
          }
        });
      }
      
      // Call onStep callback for each step if provided (for interim messages)
      if (options.onStep && result.steps) {
        for (const step of result.steps) {
          if (step.content) {
            // Check for tool calls
            const toolCalls = step.content.filter(part => part.type === 'tool-call');
            if (toolCalls.length > 0) {
              for (const toolCall of toolCalls) {
                await options.onStep({
                  type: 'tool-call',
                  toolName: toolCall.toolName,
                  input: toolCall.input
                });
              }
            }
            
            // Check for tool results
            const toolResults = step.content.filter(part => part.type === 'tool-result');
            if (toolResults.length > 0) {
              for (const toolResult of toolResults) {
                await options.onStep({
                  type: 'tool-result',
                  toolName: toolResult.toolName,
                  output: toolResult.output
                });
              }
            }
          }
        }
      }
      
      // Handle case where result.text might be undefined
      // This can happen when tool calls are made but final response isn't generated
      if (result.text && result.text.trim().length > 0) {
        return result.text;
      }
      
      // If text is undefined or empty, try to extract from steps
      if (result.steps && result.steps.length > 0) {
        // Get the last step that has text content
        for (let i = result.steps.length - 1; i >= 0; i--) {
          const step = result.steps[i];
          if (step.content && Array.isArray(step.content) && step.content.length > 0) {
            // Extract text from content array
            const textParts = step.content
              .filter(part => part && part.type === 'text' && part.text)
              .map(part => part.text)
              .join('')
              .trim();
            if (textParts) {
              console.log('Extracted text from step:', textParts.substring(0, 100));
              return textParts;
            }
          }
          // Also check for direct text property on step
          if (step.text && step.text.trim().length > 0) {
            return step.text;
          }
        }
        
        // Check if tools were called but no final response was generated
        const lastStep = result.steps[result.steps.length - 1];
        
        // Check for tool calls and results in step.content (not step.toolCalls/toolResults)
        const hasToolCalls = result.steps.some(step => 
          step.content && step.content.some(part => part.type === 'tool-call')
        );
        const hasToolResults = result.steps.some(step => 
          step.content && step.content.some(part => part.type === 'tool-result')
        );
        
        if (hasToolCalls || hasToolResults) {
          // Tools were executed but no final response - extract tool results from content
          console.warn('Tools were called but no final text response generated');
          
          // Extract tool results from step.content (where they actually are)
          const toolResults = result.steps
            .flatMap(step => step.content || [])
            .filter(part => part.type === 'tool-result' && part.output)
            .map(part => part.output)
            .filter(r => r && typeof r === 'string')
            .join('\n\n');
          
          if (toolResults) {
            // If we have tool results, format them as a response
            console.log('Returning tool results as response');
            return toolResults;
          }
          
          return "I'm processing your request. Please wait a moment while I search the database...";
        }
      }
      
      // Fallback if nothing else works
      console.warn('Warning: No text response generated from Gemini. Result:', JSON.stringify(result, null, 2));
      return "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question.";
    } catch (error) {
      console.error('Error generating response with Gemini:', error);
      throw error;
    }
  }

  /**
   * Evaluate chat history and generate a response for a new incoming message
   * @param {string} chatId - The chat ID
   * @param {Array} allMessages - All messages from the chat (including the new one)
   * @param {Object} newMessage - The new incoming message object
   * @param {Object} options - Optional configuration (passed to generateResponse)
   * @returns {Promise<string>} Generated response text
   */
  async respondToMessage(chatId, allMessages, newMessage, options = {}) {
    const currentMessageText = newMessage.body || '(media/empty message)';
    return await this.generateResponse(chatId, allMessages, currentMessageText, options);
  }
}

module.exports = GeminiAgent;
