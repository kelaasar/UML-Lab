const request = require("supertest");
const app = require('./app.js');
const sinon = require('sinon');
const firebase = require('firebase');
const AssistantUtils = require('./assistantUtils');
const axios = require('axios');
const assert = require('assert');

describe('Firebase route testing', () => {
    let dbStub, runTransactionStub, docStub, getStub, setStub, updateStub, deleteStub;

    var req;

    beforeEach(() => {
        req = {
            uid: 'test-uid',
            uml_id: 'test-uml_id',
            content: 'content',
            privacy: 'privacy',
            description: 'description',
            name: 'name',
            diagram: 'diagram',
            c: true,
            s: true,
            u: true,
            a: true,
            seq: true,
            nameContains: ''
        };

        getStub = sinon.stub();
        setStub = sinon.stub();
        updateStub = sinon.stub();
        deleteStub = sinon.stub();
        docStub = sinon.stub();
        dateStub = sinon.stub(Date, 'now').returns('CurrTime');
        collectionGetStub = sinon.stub();

        runTransactionStub = sinon.stub().callsFake(async (fakeTransaction) => {
            await fakeTransaction({
                get: getStub,
                set: setStub,
                update: updateStub,
                delete: deleteStub,
            });
        });

        dbStub = sinon.stub(firebase, 'firestore').returns({
            collection: sinon.stub().returnsThis(),
            doc: docStub,
            runTransaction: runTransactionStub,
            get: collectionGetStub,
        });

    });

    afterEach(() => {
        sinon.reset();
        sinon.restore();
    });

    it('should return success message when create succeeds', async () => { 
        docStub.returns({id: "new_uml_id"});
        getStub.callsFake(() => ({
            data: () => ({ savedUML: ['saved_uml_id'] })
        }));

        const res = await request(app).post('/create-new-uml').send(req).expect(200);

        //make sure that id from uml doc ends up at the end of the array from the userDoc that we use in update
        assert(updateStub.calledWith(sinon.match.any,{ savedUML: ['saved_uml_id', 'new_uml_id']}));
    });

    it('should return error message when create fails', async () => {
        getStub.callsFake(() => {
            throw new Error('Getting from database failed');
        });
        const res = await request(app).post('/create-new-uml').send(req).expect(503);
    });

    it('should return success message when signup succeeds', async () => {
        const newUser = {
            email: 'goodtest@example.com',
            password: 'password123',
            confirmPassword: 'password123',
        };

        const createUserWithEmailAndPasswordStub = sinon.stub(firebase.auth(), 'createUserWithEmailAndPassword').returns({
            user: {
                uid: 'test-uid',
            },
        });

        docStub.callsFake(() => ({
            set: () => ({})
        }));

        const res = await request(app).post('/signup').send(newUser).expect(200);

        sinon.assert.calledOnce(createUserWithEmailAndPasswordStub);

        createUserWithEmailAndPasswordStub.restore();
    });

    it('should return error message when signup fails', async () => {
        const newUser = {
            email: 'badtest@example.com',
            password: 'badpw',
            confirmPassword: 'badpw',
        };
        const createUserWithEmailAndPasswordStub = sinon.stub(firebase.auth(), 'createUserWithEmailAndPassword').throws(new Error('Signup failed'));

        const res = await request(app).post('/signup').send(newUser).expect(400);

        createUserWithEmailAndPasswordStub.restore();
    });

    it('should return success message when login succeeds', async () => {
        const fields = {
            email: 'goodtest@example.com',
            password: 'password',
        };
        const signInWithEmailAndPasswordStub = sinon.stub(firebase.auth(), 'signInWithEmailAndPassword').returns({
            user: {
                uid: 'test-uid',
            },
        });

        const res = await request(app).post('/login').send(fields).expect(200);

        sinon.assert.calledOnce(signInWithEmailAndPasswordStub);

        signInWithEmailAndPasswordStub.restore();
    });

    it('should return error message when login fails', async () => {
        const fields = {
            email: 'badtest@example.com',
            password: 'password',
        };
        const signInWithEmailAndPasswordStub = sinon.stub(firebase.auth(), 'signInWithEmailAndPassword').throws(new Error('Login failed'));

        const res = await request(app).post('/login').send(fields).expect(400);

        sinon.assert.calledOnce(signInWithEmailAndPasswordStub);

        signInWithEmailAndPasswordStub.restore();
    });

    it('should return success message when Google signup succeeds', async () => {
        const newUser = {
            uid: 'test-uid',
            email: 'goodtest@example.com',
        };

        docStub.returns({
            get: () => Promise.resolve({ exists: false }),
            set: () => Promise.resolve(),
        });

        const res = await request(app).post('/google-signup').send(newUser).expect(200);

        sinon.assert.calledTwice(docStub);
    });

    it('should return error message when Google signup fails due to existing user', async () => {
        const newUser = {
            uid: 'test-uid',
            email: 'existinguser@example.com',
        };

        docStub.onFirstCall().returns({ exists: true });

        const res = await request(app).post('/google-signup').send(newUser).expect(400);

        sinon.assert.calledOnce(docStub);
    });

    it('should return success message when Google login succeeds', async () => {
        const curUser = {
            user: 'test-user',
            uid: 'test-uid'
        };

        docStub.returns({
            get: () => Promise.resolve({ exists: true })
        });

        const res = await request(app).post('/google-login').send(curUser).expect(200);

        sinon.assert.calledOnce(docStub);
    });

    it('should return error message when Google login fails due to non-existing user', async () => {
        const curUser = {
            user: 'test-user',
            uid: 'non-existing-uid'
        };

        docStub.onFirstCall().returns({ exists: false });

        const res = await request(app).post('/google-login').send(curUser).expect(400);

        sinon.assert.calledOnce(docStub);
    });

    it('should return success message when copy succeeds', async () => { 
        docStub.returns({id: "new_uml_id"});
        getStub.onCall(0).callsFake(() => ({
            data: () => ({ savedUML: ['saved_uml_id'] })
        }));

        getStub.onCall(1).callsFake(() => ({
            data: () => ({ content: 'copy_uml_content', name: 'copy_uml_name', description: 'copy_uml_description', diagram: 'copy_diagram'})
        }));

        //await createNewUml(req, res);
        const res = await request(app).post('/copy-uml').send(req).expect(200);

        //make sure that the new uml is set with the data ffrom the copied one
        assert(setStub.calledWith(sinon.match.any,{ content: 'copy_uml_content', privacy: 'public', name: 'copy_uml_name-copy', description: 'copy_uml_description', timestamp: 'CurrTime', diagram: 'copy_diagram'}));

        //make sure that id from new uml doc ends up at the end of the array from the userDoc that we use in update
        assert(updateStub.calledWith(sinon.match.any,{ savedUML: ['saved_uml_id', 'new_uml_id']}));
    });

    
    it('should return error message when copy fails', async () => {
        getStub.callsFake(() => {
            throw new Error('Getting from database failed');
        });
        const res = await request(app).post('/copy-uml').send(req).expect(503);
    });

    it('should return success message when update succeeds', async () => { 
        docStub.returns({id: "some_uml_id"});

        //await createNewUml(req, res);
        const res = await request(app).post('/update-uml').send(req).expect(200);

        //make sure that the uml is set with the data we passed in
        assert(setStub.calledWith(sinon.match.any,{ content: 'content', privacy: 'privacy', name: 'name', description: 'description', timestamp: 'CurrTime', diagram: 'diagram'}));

    });

    it('should return error message when update fails', async () => {
        setStub.callsFake(() => {
            throw new Error('Getting from database failed');
        });
        const res = await request(app).post('/update-uml').send(req).expect(503);
    });

    it('should return success message when delete succeeds', async () => { 
        getStub.callsFake(() => ({
            data: () => ({ savedUML: ['saved_uml_id', 'test-uml_id'] })
        }));

        //await createNewUml(req, res);
        const res = await request(app).post('/delete-uml').send(req).expect(200);

        //make sure that id from input ends up being deleted from the user's saved UML
        assert(updateStub.calledWith(sinon.match.any,{ savedUML: ['saved_uml_id']}));
    });

    
    it('should return error message when delete fails', async () => {
        setStub.callsFake(() => {
            throw new Error('Getting from database failed');
        });
        const res = await request(app).post('/delete-uml').send(req).expect(503);
    });

    it('should return uml json when get-user-uml succeeds', async () => {
        getStub.onCall(0).callsFake(() => ({
            data: () => ({ savedUML: ['first_id', 'second_id'] })
        }));

        getStub.onCall(1).callsFake(() => ({
            data: () => ({ content: 'first_content', name: 'first_name', timestamp: 2 })
        }));

        getStub.onCall(2).callsFake(() => ({
            data: () => ({ content: 'second_content', name: 'second_name', timestamp: 1 })
        }));

        const res = await request(app).post('/get-user-uml').send(req).expect(200);

        //make sure res contains map with each uml id to its content
        jsonRes = JSON.stringify(res.body);
        jsonExpected = JSON.stringify([{ content: 'first_content', name: 'first_name', timestamp: 2, uml_id: 'first_id'}, { content: 'second_content', name: 'second_name', timestamp: 1, uml_id: 'second_id'}]);

        assert(jsonRes == jsonExpected);
    });

    it('should return uml content when get-uml succeeds', async () => {
        getStub.callsFake(() => ({
            data: () => ({ content: 'content', name: 'uml_name' })
        }));


        const res = await request(app).post('/get-uml').send(req).expect(200);

        //make sure res contains map with each uml id to its content
        jsonRes = JSON.stringify(res.body);
        jsonExpected = JSON.stringify({ content: 'content', name: 'uml_name' });

        assert(jsonRes == jsonExpected);
    });

    it('should return only public content from get-all-uml sorted by timestamp', async () => {
        var sequenceObj = { content: 'participant', name: 'uml_sueq', privacy: 'public', diagram: 'not_empty', timestamp: 5 };
        var classObj = { content: 'class', name: 'uml_class', privacy: 'public', diagram: 'not_empty', timestamp: 4 };
        var stateObj = { content: '[*]', name: 'uml_state', privacy: 'public', diagram: 'not_empty', timestamp: 3 };
        var useCaseObj = { content: 'usecase', name: 'uml_useCase', privacy: 'public', diagram: 'not_empty', timestamp: 2 };
        var activityObj = { content: 'start\n', name: 'uml_activity', privacy: 'public', diagram: 'not_empty', timestamp: 1 };
        var privateObj = { content: 'class', name: 'uml_class', privacy: 'private', diagram: 'not_empty', timestamp: 0 };

        collectionGetStub.callsFake(() => (
            {
                docs: [
                    {data: () => (classObj), id: 'uml_id_1'},
                    {data: () => (activityObj), id: 'uml_id_4'},
                    {data: () => (useCaseObj), id: 'uml_id_3'},
                    {data: () => (stateObj), id: 'uml_id_2'},
                    {data: () => (privateObj), id: 'uml_id_5'},
                    {data: () => (sequenceObj), id: 'uml_id_6'}
                ]
            }));

        const res = await request(app).post('/get-all-uml').send(req).expect(200);

        classObj['uml_id'] = 'uml_id_1';
        stateObj['uml_id'] = 'uml_id_2';
        useCaseObj['uml_id'] = 'uml_id_3';
        activityObj['uml_id'] = 'uml_id_4';
        sequenceObj['uml_id'] = 'uml_id_6';

        assert(res.body.length == 5);
        assert(JSON.stringify(res.body[0]) == JSON.stringify(sequenceObj));
        assert(JSON.stringify(res.body[1]) == JSON.stringify(classObj));
        assert(JSON.stringify(res.body[2]) == JSON.stringify(stateObj));
        assert(JSON.stringify(res.body[3]) == JSON.stringify(useCaseObj));
        assert(JSON.stringify(res.body[4]) == JSON.stringify(activityObj));

        //make sure res contains map with each uml id to its content
    });

    it('should return only content filtered by name from get-all-uml', async () => {
        var sequenceObj = { content: 'participant', name: 'uml_sueq', privacy: 'public', diagram: 'not_empty', timestamp: 5 };
        var classObj = { content: 'class', name: 'uml_class', privacy: 'public', diagram: 'not_empty', timestamp: 4 };
        var stateObj = { content: '[*]', name: 'uml_state', privacy: 'public', diagram: 'not_empty', timestamp: 3 };
        var useCaseObj = { content: 'usecase', name: 'uml_useCase', privacy: 'public', diagram: 'not_empty', timestamp: 2 };
        var activityObj = { content: 'start\n', name: 'uml_activity', privacy: 'public', diagram: 'not_empty', timestamp: 1 };
        var privateObj = { content: 'class', name: 'uml_class', privacy: 'private', diagram: 'not_empty', timestamp: 0 };

        req['nameContains'] = 'uSeCaSe'

        collectionGetStub.callsFake(() => (
            {
                docs: [
                    {data: () => (classObj), id: 'uml_id_1'},
                    {data: () => (activityObj), id: 'uml_id_4'},
                    {data: () => (useCaseObj), id: 'uml_id_3'},
                    {data: () => (stateObj), id: 'uml_id_2'},
                    {data: () => (privateObj), id: 'uml_id_5'},
                    {data: () => (sequenceObj), id: 'uml_id_6'}
                ]
            }));

        const res = await request(app).post('/get-all-uml').send(req).expect(200);

        classObj['uml_id'] = 'uml_id_1';
        stateObj['uml_id'] = 'uml_id_2';
        useCaseObj['uml_id'] = 'uml_id_3';
        activityObj['uml_id'] = 'uml_id_4';
        sequenceObj['uml_id'] = 'uml_id_6';

        assert(res.body.length == 1);
        assert(JSON.stringify(res.body[0]) == JSON.stringify(useCaseObj));
    });

    it('should return only content filtered by type from get-all-uml', async () => {
        var sequenceObj = { content: 'participant', name: 'uml_sueq', privacy: 'public', diagram: 'not_empty', timestamp: 5 };
        var classObj = { content: 'class', name: 'uml_class', privacy: 'public', diagram: 'not_empty', timestamp: 4 };
        var stateObj = { content: '[*]', name: 'uml_state', privacy: 'public', diagram: 'not_empty', timestamp: 3 };
        var useCaseObj = { content: 'usecase', name: 'uml_useCase', privacy: 'public', diagram: 'not_empty', timestamp: 2 };
        var activityObj = { content: 'start\n', name: 'uml_activity', privacy: 'public', diagram: 'not_empty', timestamp: 1 };
        var privateObj = { content: 'class', name: 'uml_class', privacy: 'private', diagram: 'not_empty', timestamp: 0 };

        req['c'] = false;
        req['a'] = false;
        req['u'] = false;
        req['s'] = true;
        req['seq'] = false;

        collectionGetStub.callsFake(() => (
            {
                docs: [
                    {data: () => (classObj), id: 'uml_id_1'},
                    {data: () => (activityObj), id: 'uml_id_4'},
                    {data: () => (useCaseObj), id: 'uml_id_3'},
                    {data: () => (stateObj), id: 'uml_id_2'},
                    {data: () => (privateObj), id: 'uml_id_5'},
                    {data: () => (sequenceObj), id: 'uml_id_6'}
                ]
            }));

        const res = await request(app).post('/get-all-uml').send(req).expect(200);

        classObj['uml_id'] = 'uml_id_1';
        stateObj['uml_id'] = 'uml_id_2';
        useCaseObj['uml_id'] = 'uml_id_3';
        activityObj['uml_id'] = 'uml_id_4';
        sequenceObj['uml_id'] = 'uml_id_6';

        assert(res.body.length == 1);
        assert(JSON.stringify(res.body[0]) == JSON.stringify(stateObj));
    });

    it('should delete user content when delete-account is caleld', async () => {
        const authDeleteStub = sinon.stub();

        const firebaseAuthStub = sinon.stub(firebase, 'auth').returns({
            currentUser: {delete: authDeleteStub},
        });

        getStub.callsFake(() => ({
            data: () => ({ savedUML: ['id1', 'id2'] })
        }));

        docStub.onCall(0).callsFake((uid) => {
            return uid
        });

        docStub.callsFake((uml_id) => {
            return uml_id
        });

        const res = await request(app).post('/delete-account').send(req).expect(200);

        sinon.assert.calledOnce(authDeleteStub);
        assert(deleteStub.getCall(0).args[0] == 'id1');
        assert(deleteStub.getCall(1).args[0] == 'id2');
        assert(deleteStub.getCall(2).args[0] == 'test-uid');

    });

    it('should delete user content when delete-google-account is caleld', async () => {

        getStub.callsFake(() => ({
            data: () => ({ savedUML: ['id1', 'id2'] })
        }));

        docStub.onCall(0).callsFake((uid) => {
            return uid
        });

        docStub.callsFake((uml_id) => {
            return uml_id
        });

        const res = await request(app).post('/delete-google-account').send(req).expect(200);

        assert(deleteStub.getCall(0).args[0] == 'id1');
        assert(deleteStub.getCall(1).args[0] == 'id2');
        assert(deleteStub.getCall(2).args[0] == 'test-uid');

    });
});

describe('PlantUML diagram fetching testing', () => {
    let getStub;

    beforeEach(() => {
        getStub = sinon.stub(axios, 'get');
    });

    afterEach(() => {
        sinon.reset();
        sinon.restore();
    });

    it('should return 400 when umlCode is missing', async () => {
        const req = {
            response_type: 'SVG'
        };
        const res = await request(app).post('/fetch-plant-uml').send(req).expect(400);
    });

    it('should return 400 when responseType is missing', async () => {
        const req = {
            uml_code: 'non-empty code'
        };
        const res = await request(app).post('/fetch-plant-uml').send(req).expect(400);
    });

    it('should return 400 when uml_code is not a string', async() => {
        const req = {
            uml_code: 5,
            response_type: 'SVG'
        };
        const res = await request(app).post('/fetch-plant-uml').send(req).expect(400);
    });

    it('should return 400 when response_type is invalid', async () => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'INVALID'
        };
        const res = await request(app).post('/fetch-plant-uml').send(req).expect(400);
    });

    it('should return 400 when return_as_uri is not a boolean', async() => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'SVG',
            return_as_uri: 0
        };
        const res = await request(app).post('/fetch-plant-uml').send(req).expect(400);
    });
    
    it('should return 500 when PlantUML server request times out', async() => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'SVG'
        };

        // Stub a server timeout
        getStub.rejects({ code: 'ECONNABORTED' });

        const res = await request(app).post('/fetch-plant-uml').send(req).expect(408);
    });

    it('should return 400 when PlantUML server returns invalid code error', async() => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'SVG'
        };

        // Stub invalid code error from server
        getStub.rejects({ response: { status: 400 } });

        const res = await request(app).post('/fetch-plant-uml').send(req).expect(400);
    });

    it('should return 500 when PlantUML server returns some other error', async() => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'SVG'
        };

        // Stub arbitrary error from server
        getStub.rejects(new Error('Some error'));

        const res = await request(app).post('/fetch-plant-uml').send(req).expect(500);
    });

    it('should return SVG when PlantUML SVG request succeeds', async () => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'SVG'
        };
        const svg_data = 'SVG DATA';

        // Stub successful SVG request
        getStub.resolves({ data: svg_data });

        const res = await request(app).post('/fetch-plant-uml').send(req).expect(200);

        // Ensure response is expected SVG data
        assert.strictEqual(res.text, svg_data);
    });

    it('should return PNG when PlantUML PNG request succeeds', async () => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'SVG'
        };
        const png_data = 'PNG DATA';

        // Stub successful PNG request
        getStub.resolves({ data: png_data });

        const res = await request(app).post('/fetch-plant-uml').send(req).expect(200);

        // Ensure response is expected PNG data
        assert.strictEqual(res.text, png_data);
    });

    it('should return SVG as URI when PlantUML SVG request succeeds and URI requested', async () => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'SVG',
            return_as_uri: true
        };
        const svg_data = 'SVG DATA';
        const svg_uri_prefix = 'data:image/svg+xml;base64,';

        // Stub successful SVG request
        getStub.resolves({ data: svg_data });

        const res = await request(app).post('/fetch-plant-uml').send(req).expect(200);

        // Ensure response URI starts with the correct mime type
        assert(res.text.startsWith(svg_uri_prefix));

        // Ensure response data decodes to the expected SVG data
        const base64_data = res.text.replace(svg_uri_prefix, '');
        const decoded_data = Buffer.from(base64_data, 'base64').toString();
        assert.strictEqual(decoded_data, svg_data);
    });

    it('should return PNG as URI when PlantUML PNG request succeeds and URI requested', async () => {
        const req = {
            uml_code: 'non-empty code',
            response_type: 'PNG',
            return_as_uri: true
        };
        const png_data = 'PNG DATA';
        const png_uri_prefix = 'data:image/png;base64,';

        // Stub successful PNG request
        getStub.resolves({ data: png_data });

        const res = await request(app).post('/fetch-plant-uml').send(req).expect(200);
        
        // Ensure response URI starts with the correct mime type
        assert(res.text.startsWith(png_uri_prefix));

        // Ensure response data decodes to the expected PNG data
        const base64_data = res.text.replace(png_uri_prefix, '');
        const decoded_data = Buffer.from(base64_data, 'base64').toString();
        assert.strictEqual(decoded_data, png_data);
    });
});

describe('Scale adding testing', () => {
    const check_scale_command = async (req, correct_scale_command) => {
        const res = await request(app).post('/add-scale-to-uml').send(req).expect(200);

        // Find index of @enduml line
        const lines = res.text.split('\n');
        const end_index = lines.findIndex(line => line.trim() === '@enduml');

        // Ensure line before @enduml is correct scale command
        assert.strictEqual(lines[end_index - 1], correct_scale_command);
    };

    it('should return 400 when umlCode is missing', async () => {
        const req = {
            scale_width: 100
        };
        const res = await request(app).post('/add-scale-to-uml').send(req).expect(400);
    });

    it('should return 400 when both scale_width and scale_height are missing', async () => {
        const req = {
            uml_code: '@enduml'
        };
        const res = await request(app).post('/add-scale-to-uml').send(req).expect(400);
    });

    it('should return 400 when uml_code is not a string', async() => {
        const req = {
            uml_code: 5,
            scale_width: 100
        };
        const res = await request(app).post('/add-scale-to-uml').send(req).expect(400);
    });

    it('should return 400 when scale_width is not an int', async() => {
        const req = {
            uml_code: '@enduml',
            scale_width: '100'
        };
        const res = await request(app).post('/add-scale-to-uml').send(req).expect(400);
    });

    it('should return 400 when scale_width is not an int', async() => {
        const req = {
            uml_code: '@enduml',
            scale_height: '100'
        };
        const res = await request(app).post('/add-scale-to-uml').send(req).expect(400);
    });

    it('should return 400 when max is not a boolean', async() => {
        const req = {
            uml_code: '@enduml',
            scale_width: 100,
            max: 10
        };
        const res = await request(app).post('/add-scale-to-uml').send(req).expect(400);
    });

    it('should return 400 when @enduml is missing', async() => {
        const req = {
            uml_code: '@startuml',
            scale_width: 100
        };
        const res = await request(app).post('/add-scale-to-uml').send(req).expect(400);
    });

    it('should return code with correct scale command when scale_width is specified and max is not passed', async() => {
        const req = {
            uml_code: '@startuml\nsome_line\n@enduml\n',
            scale_width: 100
        };
        const correct_scale_command = 'scale 100 width';
        await check_scale_command(req, correct_scale_command);
    });

    it('should return code with correct scale command when scale_height is specified and max is not passed', async() => {
        const req = {
            uml_code: '@startuml\nsome_line\n@enduml\n',
            scale_height: 100
        };
        const correct_scale_command = 'scale 100 height';
        await check_scale_command(req, correct_scale_command);
    });

    it('should return code with correct scale command when scale_width and scale_height are specified and max is not passed', async() => {
        const req = {
            uml_code: '@startuml\nsome_line\n@enduml\n',
            scale_width: 100,
            scale_height: 200
        };
        const correct_scale_command = 'scale 100x200';
        await check_scale_command(req, correct_scale_command);
    });

    it('should return same code with correct scale command as not passing max when max is passed as false', async() => {
        const req = {
            uml_code: '@startuml\nsome_line\n@enduml\n',
            scale_width: 100,
            scale_height: 200,
            max: false
        };
        const correct_scale_command = 'scale 100x200';
        await check_scale_command(req, correct_scale_command);
    });

    it('should return code with correct scale command when max is passed as true', async() => {
        const req = {
            uml_code: '@startuml\nsome_line\n@enduml\n',
            scale_width: 100,
            scale_height: 200,
            max: true
        };
        const correct_scale_command = 'scale max 100x200';
        await check_scale_command(req, correct_scale_command);
    });
});

describe('Code generation assistant testing', () => {
    let handleAssistantCallStub;

    const check_assistant_response = async (req) => {
        const pre_code = 'Some pre-code';
        const uml_code_response = '@startuml...@enduml';
        const post_code = 'Some post-code';
        const assistant_response = `${pre_code}\n${uml_code_response}\n${post_code}`;
        handleAssistantCallStub.resolves(assistant_response);

        const res = await request(app).post('/query-assistant-code-generator').send(req).expect(200);

        assert.strictEqual(res.body.pre_code, pre_code);
        assert.strictEqual(res.body.uml_code, uml_code_response);
        assert.strictEqual(res.body.post_code, post_code);
    };

    beforeEach(() => {
        handleAssistantCallStub = sinon.stub(AssistantUtils, 'handle_assistant_call');
    });

    afterEach(() => {
        sinon.reset();
        sinon.restore();
    });

    it('should return 400 when prompt is missing', async () => {
        const req = {};
        const res = await request(app).post('/query-assistant-code-generator').send(req).expect(400);
    });

    it('should return 400 when uml_code is not a string', async () => {
        const req = {
            uml_code: 5,
            prompt: 'non-empty prompt'
        };
        const res = await request(app).post('/query-assistant-code-generator').send(req).expect(400);
    });

    it('should return 400 when prompt is not a string', async () => {
        const req = {
            prompt: 5
        };
        const res = await request(app).post('/query-assistant-code-generator').send(req).expect(400);
    });

    it('should return 400 when timeout is not an integer', async () => {
        const req = {
            prompt: 'non-empty prompt',
            timeout: false
        };
        const res = await request(app).post('/query-assistant-code-generator').send(req).expect(400);
    });

    it('should return error when handle_assistant_call fails', async () => {
        const req = {
            prompt: 'non-empty prompt'
        };
        const error_status = 500;
        const error_to_send = { message: 'Some error message.' };
        const error_object = { status: error_status, to_send: error_to_send };
        handleAssistantCallStub.rejects(error_object);

        const res = await request(app).post('/query-assistant-code-generator').send(req).expect(error_status);

        assert.strictEqual(res.body.message, error_to_send.message);
    });

    it('should return 500 when no complete code was generated', async () => {
        const req = {
            prompt: 'non-empty prompt'
        };
        handleAssistantCallStub.resolves('@startuml...');

        const res = await request(app).post('/query-assistant-code-generator').send(req).expect(500);
    });

    it('should return proper response when no UML code or timeout provided', async () => {
        const req = {
            prompt: 'non-empty prompt'
        };
        await check_assistant_response(req);
    });

    it('should return proper response when no UML code provided but timeout provided', async () => {
        const req = {
            prompt: 'non-empty prompt',
            timeout: 20000
        };
        await check_assistant_response(req);
    });

    it('should return proper response when UML code provided but no timeout provided', async () => {
        const req = {
            uml_code: 'non-empty code',
            prompt: 'non-empty prompt'
        };
        await check_assistant_response(req);
    });

    it('should return proper response when UML code and timeout provided', async () => {
        const req = {
            uml_code: 'non-empty code',
            prompt: 'non-empty prompt',
            timeout: 20000
        };
        await check_assistant_response(req);
    });
});

describe('Code examination assistant testing', () => {
    let handleAssistantCallStub;

    const check_assistant_response = async (req) => {
        const assistant_response = "Some response";
        handleAssistantCallStub.resolves(assistant_response);

        const res = await request(app).post('/query-assistant-code-examiner').send(req).expect(200);

        assert.strictEqual(res.text, assistant_response);
    };

    beforeEach(() => {
        handleAssistantCallStub = sinon.stub(AssistantUtils, 'handle_assistant_call');
    });

    afterEach(() => {
        sinon.reset();
        sinon.restore();
    });

    it('should return 400 when uml_code is missing', async () => {
        const req = {
            query: 'non-empty query'
        };
        const res = await request(app).post('/query-assistant-code-examiner').send(req).expect(400);
    });
    
    it('should return 400 when query is missing', async () => {
        const req = {
            uml_code: 'non-empty code'
        };
        const res = await request(app).post('/query-assistant-code-examiner').send(req).expect(400);
    });

    it('should return 400 when uml_code is not a string', async () => {
        const req = {
            uml_code: 5,
            query: 'non-empty query'
        };
        const res = await request(app).post('/query-assistant-code-examiner').send(req).expect(400);
    });

    it('should return 400 when query is not a string', async () => {
        const req = {
            uml_code: 'non-empty code',
            query: 5
        };
        const res = await request(app).post('/query-assistant-code-examiner').send(req).expect(400);
    });

    it('should return 400 when timeout is not an integer', async () => {
        const req = {
            uml_code: 'non-empty code',
            query: 'non-empty query',
            timeout: false
        };
        const res = await request(app).post('/query-assistant-code-examiner').send(req).expect(400);
    });

    it('should return error when handle_assistant_call fails', async () => {
        const req = {
            uml_code: 'non-empty code',
            query: 'non-empty query'
        };
        const error_status = 500;
        const error_to_send = { message: 'Some error message.' };
        const error_object = { status: error_status, to_send: error_to_send };
        handleAssistantCallStub.rejects(error_object);

        const res = await request(app).post('/query-assistant-code-examiner').send(req).expect(error_status);

        assert.strictEqual(res.body.message, error_to_send.message);
    });

    it('should return proper response when no timeout provided', async () => {
        const req = {
            uml_code: 'non-empty code',
            query: 'non-empty query'
        };
        await check_assistant_response(req);
    });

    it('should return proper response when timeout provided', async () => {
        const req = {
            uml_code: 'non-empty code',
            query: 'non-empty query',
            timeout: 20000
        };
        await check_assistant_response(req);
    });
});