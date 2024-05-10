const sinon = require('sinon');
const assert = require('assert');
const AssistantUtils = require('./assistantUtils');

describe('OpenAI Assitant API call testing', () => {
    const test_response = 'Test Response';
    let call_count = 0;
    let prompt_assistant;
    let runsRetrieveStub;

    // Mock openai dependency of prompt_assistant function
    const mock_openai = Object();
    jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => { return mock_openai; });
    });

    beforeEach(() => {
        // Re-require function to use one with mocked openai module
        jest.resetModules();
        prompt_assistant = jest.requireActual('./assistantUtils').prompt_assistant;

        mock_openai.beta = {
            threads: {
                create: sinon.stub().resolves({ id: 'thread-some-id' }),
                runs: {
                    create: sinon.stub().resolves({ run: 'run-some-id' }),
                    retrieve: sinon.stub()  // variable response
                },
                messages: {
                    list: sinon.stub().resolves({
                        data: [
                            {
                                role: 'user'
                            },
                            {
                                role: 'assistant',
                                content: [
                                    {
                                        text: {
                                            value: test_response
                                        }
                                    }
                                ]
                            }
                        ]
                    })
                }
            }
        };

        // Create alias
        runsRetrieveStub = mock_openai.beta.threads.runs.retrieve;
    });

    afterEach(() => {
        sinon.reset();
        sinon.restore();
        call_count = 0;
    });

    it('should throw object when status is immediately not a pending or completed state', async () => {
        const retrieved_status = 'failed';
        runsRetrieveStub.resolves({ status: retrieved_status });

        try {
            const res = await prompt_assistant('assistant-id', 'prompt');
            fail('Expected function to throw, but it did not');
        }
        catch (error) {
            // Ensure status of thrown object matches retrieved status
            assert.strictEqual(error.status, retrieved_status);
            assert.strictEqual(error.message, 'Run finished with status other than "complete".');
        }
    });

    it('should return response when status is immediately completed state', async () => {
        const retrieved_status = 'completed';
        runsRetrieveStub.resolves({ status: retrieved_status });
        
        const res = await prompt_assistant('assistant-id', 'prompt');
        
        // Ensure response is as expected
        assert.strictEqual(res, test_response);
    });

    it('should throw object when status is pending state followed by a non-completed state', async () => {
        const pending_status = 'in_progress';
        const retrieved_status = 'failed';
        runsRetrieveStub.callsFake(() => {
            call_count++;
            if (call_count < 3) {
                return Promise.resolve({ status: pending_status });
            }
            else {
                return Promise.resolve({ status: retrieved_status });
            }
        });

        try {
            const res = await prompt_assistant('assistant-id', 'prompt');
            fail('Expected function to throw, but it did not');
        }
        catch (error) {
            // Ensure status of thrown object matches retrieved status
            assert.strictEqual(error.status, retrieved_status);
            assert.strictEqual(error.message, 'Run finished with status other than "complete".');
        }
    });

    it('should return response when status is pending state followed by completed state', async () => {
        const pending_status = 'in_progress';
        const retrieved_status = 'completed';
        runsRetrieveStub.callsFake(() => {
            call_count++;
            if (call_count < 3) {
                return Promise.resolve({ status: pending_status });
            }
            else {
                return Promise.resolve({ status: retrieved_status });
            }
        });

        const res = await prompt_assistant('assistant-id', 'prompt');
        
        // Ensure response is as expected
        assert.strictEqual(res, test_response);
    });
});

describe('Assistant handler testing', () => {
    let handle_assistant_call;
    let promptAssistantStub;

    beforeEach(() => {
        // Re-require function to use mocked version
        jest.resetModules();
        AssistantUtils.prompt_assistant = sinon.stub();
        handle_assistant_call = AssistantUtils.handle_assistant_call.bind(AssistantUtils);

        // Create alias
        promptAssistantStub = AssistantUtils.prompt_assistant;
    });

    afterEach(() => {
        sinon.reset();
        sinon.restore();
    });

    it('should throw requires_action when requires_action status caught', async () => {
        const status = 'requires_action';
        promptAssistantStub.rejects({ status: status });

        try {
            const res = await handle_assistant_call('assistant-id', 'prompt', 10000);
            fail('Expected function to throw, but it did not');
        }
        catch(error) {
            assert.strictEqual(error.status, 400);
            assert.strictEqual(error.to_send.type, status);
            assert.strictEqual(error.to_send.message, 'The run requires action.');
        }
    });

    it('should throw expired when expired status caught', async () => {
        const status = 'expired';
        promptAssistantStub.rejects({ status: status });

        try {
            const res = await handle_assistant_call('assistant-id', 'prompt', 10000);
            fail('Expected function to throw, but it did not');
        }
        catch(error) {
            assert.strictEqual(error.status, 408);
            assert.strictEqual(error.to_send.type, status);
            assert.strictEqual(error.to_send.message, 'The run has expired.');
        }
    });

    it('should throw cancelling when cancelling status caught', async () => {
        const status = 'cancelling';
        promptAssistantStub.rejects({ status: status });

        try {
            const res = await handle_assistant_call('assistant-id', 'prompt', 10000);
            fail('Expected function to throw, but it did not');
        }
        catch(error) {
            assert.strictEqual(error.status, 409);
            assert.strictEqual(error.to_send.type, status);
            assert.strictEqual(error.to_send.message, 'The run has been cancelled.');
        }
    });

    it('should throw cancelled when cancelled status caught', async () => {
        const status = 'cancelled';
        promptAssistantStub.rejects({ status: status });

        try {
            const res = await handle_assistant_call('assistant-id', 'prompt', 10000);
            fail('Expected function to throw, but it did not');
        }
        catch(error) {
            assert.strictEqual(error.status, 409);
            assert.strictEqual(error.to_send.type, status);
            assert.strictEqual(error.to_send.message, 'The run has been cancelled.');
        }
    });

    it('should throw failed when failed status caught', async () => {
        const status = 'failed';
        promptAssistantStub.rejects({ status: status });

        try {
            const res = await handle_assistant_call('assistant-id', 'prompt', 10000);
            fail('Expected function to throw, but it did not');
        }
        catch(error) {
            assert.strictEqual(error.status, 500);
            assert.strictEqual(error.to_send.type, status);
            assert.strictEqual(error.to_send.message, 'The run has failed.');
        }
    });

    it('should throw timeout when prompt_assistant takes longer than timeout value', async () => {
        const timeout = 2000;
        const status = 'timeout';
        // prompt_assistant will not return, so handle_assistant_call will timeout
        promptAssistantStub.returns(new Promise(() => {}));

        try {
            const res = await handle_assistant_call('assistant-id', 'prompt', timeout);
            fail('Expected function to throw, but it did not');
        }
        catch(error) {
            assert.strictEqual(error.status, 408);
            assert.strictEqual(error.to_send.type, status);
            assert.strictEqual(error.to_send.message, `The run timed out after ${timeout/1000} seconds.`);
        }
    });

    it('should throw ServerError when unknown status caught', async () => {
        const error_message = 'Some message.';
        const thrown_error = { status: 'some-unknown-status', message: error_message };
        promptAssistantStub.rejects(thrown_error);

        try {
            const res = await handle_assistant_call('assistant-id', 'prompt', 10000);
            fail('Expected function to throw, but it did not');
        }
        catch(error) {
            assert.strictEqual(error.status, 500);
            assert.strictEqual(error.to_send.type, 'ServerError');
            assert.strictEqual(error.to_send.message, error_message);
        }
    });

    it('should return prompt_assistant\'s return value when no error is thrown', async () => {
        const assistant_response = 'Some assistant response';
        promptAssistantStub.resolves(assistant_response);

        const res = await handle_assistant_call('assistant-id', 'prompt', 10000);
        
        assert.strictEqual(res, assistant_response);
    });
});
