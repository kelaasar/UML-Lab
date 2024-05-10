/**
 * @module server/assistantUtils
 * @description This module provides utility for interacting with OpenAI assistants.
 */

const OpenAI = require("openai");
require('dotenv').config({ path: './.env' });

/**
 * OpenAI assistant utility functions
 * @type {object}
 * @const
 * @namespace AssistantUtils
 */
const AssistantUtils = {
    /**
     * Prompts OpenAI assistant to respond
     * @function
     * @memberof module:server/assistantUtils~AssistantUtils
     * @param {string} assistant_id - ID of the OpenAI assistant to call
     * @param {string} prompt - message to send to assistant
     * @returns {Promise<string>} - response message of assistant
     */
    async prompt_assistant(assistant_id, prompt) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
        // Create new thread with prompt
        const thread = await openai.beta.threads.create({
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });
    
        // Run assistant on thread
        const run = await openai.beta.threads.runs.create(
            thread.id,
            { assistant_id: assistant_id }
        )
    
        // Wait for run to complete
        let status;
        do {
            const run_status = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            status = run_status.status;
        } while (status === 'queued' || status === 'in_progress');
    
        // Check final status of run
        if (status !== 'completed') {
            // Return status as error
            throw { status: status, message: 'Run finished with status other than "complete".' };
        }
    
        // Return last message from assistant
        const messages = await openai.beta.threads.messages.list(thread.id);
        return messages.data.filter(message => message.role === 'assistant').pop().content[0].text.value;
    },
    
    /**
     * Wrapper for prompt_assistant, which handles error results of prompting the assistant, including a timeout
     * @function
     * @memberof module:server/assistantUtils~AssistantUtils
     * @param {string} assistant_id - ID of the OpenAI assistant to call
     * @param {string} prompt - message to send to assistant
     * @param {string} timeout - time in milliseconds to wait for assistant response before timing out
     * @returns {Promise<string>} - response message of the assistant
     * @throws {{status: int, to_send: {type: string, message: string}}} - HTTP error status, along with HTTP error response to send
     */
    async handle_assistant_call(assistant_id, prompt, timeout) {
        let assistant_response, timeout_id;
    
        try {
            // Prompt the assistant with a timeout
            assistant_response = await Promise.race([
                this.prompt_assistant(assistant_id, prompt),
                new Promise((_, reject) => {
                    timeout_id = setTimeout(() => reject({ status: 'timeout', message: 'Request timed out.' }), timeout);
                })
            ]);
        } 
        catch (error) {
            // Throw what to send based on status code
            switch (error.status) {
                case 'requires_action':
                    throw { status: 400, to_send: { type: error.status, message: 'The run requires action.' } };
                case 'expired':
                    throw { status: 408, to_send: { type: error.status, message: 'The run has expired.' } };
                case 'cancelling':
                case 'cancelled':
                    throw { status: 409, to_send: { type: error.status, message: 'The run has been cancelled.' } };
                case 'failed':
                    throw { status: 500, to_send: { type: error.status, message: 'The run has failed.' } };
                case 'timeout':
                    throw { status: 408, to_send: { type: error.status, message: `The run timed out after ${timeout/1000} seconds.` } };
                default:
                    throw { status: 500, to_send: { type: 'ServerError', message: error.message } };
            }
        }
        finally {
            // Ensure no open handles at function closing
            clearTimeout(timeout_id);
        }
    
        // Return assistant response
        return assistant_response;
    }
};

module.exports = AssistantUtils;