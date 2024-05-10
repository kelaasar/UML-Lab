import React from "react";
import { cleanup, render, fireEvent, screen, waitFor} from "@testing-library/react";
import { Provider, useSelector } from 'react-redux';
import configureStore from 'redux-mock-store';
import axios from "axios";
import Dashboard from "./Dashboard";
import Home from "./Home";
import * as router from 'react-router'
import Query from "./Query";
import NavBar from "./NavBar";
import Login from "./Login";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import Signup from "./Signup";
import firebase from '../firebase'

jest.mock("axios");

jest.mock('../firebase', () => {
  const auth = jest.fn();
  auth.GoogleAuthProvider = jest.fn();
  return {auth};
});

describe("Dashboard Testing", () => {
    let store, navigateStub, useLocationStub, axiosStub;

    beforeEach(() => {
        const mockStore = configureStore([]);
        store = mockStore({
            user: {uid: 'uid'},
            uml: {uml_id: 'uml_id'}
          });
        navigateStub = jest.fn();
        axiosStub = jest.spyOn(axios, 'post');
        jest.spyOn(router, 'useNavigate').mockImplementation(() => navigateStub);
        useLocationStub = jest.spyOn(router, 'useLocation').mockImplementation(() => {return {state: ''}})
      });

    afterEach(() => {
        cleanup();
        jest.restoreAllMocks();
      });

    it("should fetch user uml diagrams based on the uid in redux", async () => {
        axiosStub.mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
        }));

        render(
            <Provider store={store}>
              <Dashboard />
            </Provider>
          );

        await waitFor(() => { // Wait for the apis to be called, wont fail immediately
            expect(axiosStub).toHaveBeenCalledTimes(1);
            expect(axiosStub).toBeCalledWith("http://localhost:4000/get-user-uml", {"uid": "uid"});
        });
        
        // Using findByText, the tests wont fail immediately, but will wait for up to 1 second to find the item, then fail
        // No need to wrap in waitFor
        expect(await screen.findByText('name1')).toBeInTheDocument();
        expect(await screen.findByText('description1')).toBeInTheDocument();
        expect(await screen.findByText('name2')).toBeInTheDocument();
        expect(await screen.findByText('description2')).toBeInTheDocument();
    });

    it("should take user to query page w/ loaded uml if edit is clicked", async () => {
        axiosStub.mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
        }));

        render(
            <Provider store={store}>
              <Dashboard />
            </Provider>
          );

        const editButton = await screen.findAllByText('Edit');
        fireEvent.click(editButton[0]);

        await waitFor(() => { 
            expect(axiosStub).toHaveBeenCalledTimes(1);
            expect(navigateStub).toHaveBeenCalledTimes(1);
            expect(axiosStub).toBeCalledWith("http://localhost:4000/get-user-uml", {"uid": "uid"});
            expect(navigateStub).toBeCalledWith("/query", {"state": {"content": "c", "description": "description1", "diagram": "", "name": "name1", "privacy": "public", "timestamp": 1, "uml_id": "1"}});
        });
    });

    it("should take user to query page w/ nothing loaded if create is clicked", async () => {
        axiosStub.mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
        }));

        render(
            <Provider store={store}>
              <Dashboard />
            </Provider>
          );

        const createButton = await screen.findByText('Create');
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(axiosStub).toHaveBeenCalledTimes(1);
            expect(navigateStub).toHaveBeenCalledTimes(1);
            expect(axios.post).toBeCalledWith("http://localhost:4000/get-user-uml", {"uid": "uid"});
            expect(navigateStub).toBeCalledWith("/query");
        });
    });

    it("should delete a uml if delete button is pressed", async () => {
        axiosStub.mockImplementationOnce(() =>
            Promise.resolve({
            status: 200,
            data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
        }));

        axiosStub.mockImplementationOnce(() =>
            Promise.resolve({
            status: 200,
        }));

        render(
            <Provider store={store}>
              <Dashboard />
            </Provider>
          );

        const deleteButton = await screen.findAllByText('Delete');
        fireEvent.click(deleteButton[0]);
        
        await waitFor(() => {
            expect(axiosStub).toHaveBeenCalledTimes(2);
            expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/get-user-uml", {"uid": "uid"});
            expect(axiosStub).toHaveBeenNthCalledWith(2, "http://localhost:4000/delete-uml", {"uid": "uid", "uml_id": "1"});
        });

        expect(await screen.findByText('name2')).toBeInTheDocument();
        await waitFor(() => { // Needs to have wait for or else we will query right away
            expect(screen.queryByText('name1')).toBeNull();
        });
    });

    it("should download uml content if download button is pressed", async () => {
      axiosStub.mockImplementationOnce(() =>
          Promise.resolve({
          status: 200,
          data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
      }));

      axiosStub.mockImplementationOnce(() =>
          Promise.resolve({
          status: 200,
      }));

      window.URL.createObjectURL = jest.fn(() => 'details');
      window.URL.revokeObjectURL = jest.fn(() => 'details');
      const blobStub = jest.spyOn(global, 'Blob').mockImplementationOnce((a, b) => {
        return {a: a, b: b};
      });

      render(
          <Provider store={store}>
            <Dashboard />
          </Provider>
        );

      const downloadButton = await screen.findAllByText('Download');
      fireEvent.click(downloadButton[0]);
      
      await waitFor(() => {
        expect(blobStub).toBeCalledWith(["c"], {"type": "text/plain"});
        expect(window.URL.createObjectURL).toBeCalledWith({"a": ["c"], "b": {"type": "text/plain"}} );
        expect(window.URL.revokeObjectURL).toBeCalledWith('details');

      });
  });
});

describe("Home Testing", () => {
  let store, navigateStub, useLocationStub, axiosStub;

  beforeEach(() => {
      const mockStore = configureStore([]);
      store = mockStore({
          user: {uid: 'uid'},
          uml: {uml_id: 'uml_id'}
        });
      navigateStub = jest.fn();
      axiosStub = jest.spyOn(axios, 'post');
      jest.spyOn(router, 'useNavigate').mockImplementation(() => navigateStub);
      useLocationStub = jest.spyOn(router, 'useLocation').mockImplementation(() => {return {state: ''}});
    });

  afterEach(() => {
      cleanup();
      jest.restoreAllMocks(); 
    });

  it("should fetch public user uml diagrams on home page", async () => {
      axiosStub.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
      }));

      render(
          <Provider store={store}>
            <Home />
          </Provider>
        );

      await waitFor(() => { // Wait for the apis to be called, wont fail immediately
          expect(axiosStub).toHaveBeenCalledTimes(1);
          expect(axiosStub).toBeCalledWith("http://localhost:4000/get-all-uml", {"a": true, "c": true, "s": true, "seq":true, "u":true, "nameContains": ""});
      });
      
      // Using findByText, the tests wont fail immediately, but will wait for up to 1 second to find the item, then fail
      // No need to wrap in waitFor
      expect(await screen.findByText('name1')).toBeInTheDocument();
      expect(await screen.findByText('description1')).toBeInTheDocument();
      expect(await screen.findByText('name2')).toBeInTheDocument();
      expect(await screen.findByText('description2')).toBeInTheDocument();
  });

  it("filter buttons should change call to route", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
    }));

    render(
        <Provider store={store}>
          <Home />
        </Provider>
      );

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
        expect(axiosStub).toHaveBeenCalledTimes(1);
        expect(axiosStub).toBeCalledWith("http://localhost:4000/get-all-uml", {"a": true, "c": true, "s": true, "seq":true, "u":true, "nameContains": ""});
    });

    const filterBar = await screen.findByText('Filter');
    fireEvent.click(filterBar);

    const stateButton = await screen.findAllByRole('checkbox');
    fireEvent.click(stateButton[0]);

    const applyButton = await screen.findByText('Apply');
    fireEvent.click(applyButton);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(axiosStub).toHaveBeenCalledTimes(2);
      expect(axiosStub).toBeCalledWith("http://localhost:4000/get-all-uml", {"a": true, "c": true, "s": false, "seq":true, "u":true, "nameContains": ""});
  });
  });

  it("filter nameContains input should change call to route", async () => {
    axiosStub.mockImplementation(() =>
    Promise.resolve({
      status: 200,
      data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
    }));

    render(
        <Provider store={store}>
          <Home />
        </Provider>
      );

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
        expect(axiosStub).toHaveBeenCalledTimes(1);
        expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/get-all-uml", {"a": true, "c": true, "s": true, "seq":true, "u":true, "nameContains": ""});
    });

    const filterBar = await screen.findByText('Filter');
    fireEvent.click(filterBar);

    const nameContainsBox = await screen.findByLabelText("Name Contains");
    fireEvent.change(nameContainsBox, { target: { value: "name" } });
    expect(await screen.findByDisplayValue('name')).toBeInTheDocument();

    const applyButton = await screen.findByText('Apply');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(2);
      expect(axiosStub).toHaveBeenNthCalledWith(2, "http://localhost:4000/get-all-uml", {"a": true, "c": true, "s": true, "seq":true, "u":true, "nameContains": "name"});
  });
  });

  it("content from promptBar is routed to query page with state set", async () => {
    axiosStub.mockImplementation(() =>
    Promise.resolve({
      status: 200,
      data: [{content: "c", description: "description1", diagram: '', name: 'name1', privacy: 'public', timestamp: 1, uml_id: '1'}, {content: "c", description: "description2", diagram: '', name: 'name2', privacy: 'public', timestamp: 2, uml_id: '2'}]
    }));

    render(
        <Provider store={store}>
          <Home />
        </Provider>
      );

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
        expect(axiosStub).toHaveBeenCalledTimes(1);
        expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/get-all-uml", {"a": true, "c": true, "s": true, "seq":true, "u":true, "nameContains": ""});
    });

    const promptBar = await screen.findByLabelText('unload your ideas...');
    fireEvent.change(promptBar, { target: { value: "prompt" } });

    expect(await screen.findByDisplayValue('prompt')).toBeInTheDocument();

    fireEvent.keyDown(promptBar, { key: "Enter", code: 13 });

    await waitFor(() => {
      expect(navigateStub).toHaveBeenCalledTimes(1);
      expect(navigateStub).toBeCalledWith("/query", {"state": {"prompt": "prompt", "oneTimeLoad": true}});
    });
  });
});

describe("Query Testing", () => {
  let store, navigateStub, useLocationStub, axiosStub;

  beforeEach(() => {
      const mockStore = configureStore([]);
      store = mockStore({
          user: {uid: 'uid'},
          uml: {uml_id: 'uml_id'}
        });
      navigateStub = jest.fn();
      axiosStub = jest.spyOn(axios, 'post');
      jest.spyOn(router, 'useNavigate').mockImplementation(() => navigateStub);
      useLocationStub = jest.spyOn(router, 'useLocation').mockImplementation(() => {return {state: ''}});
    });

  afterEach(() => {
      cleanup();
      jest.restoreAllMocks(); 
    });

  it("should call plant uml visualizer after editing uml text box and display the result", async () => {
      axiosStub.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: 'diagram'
      }));

      render(
          <Provider store={store}>
            <Query />
          </Provider>
        );

      const umlBox = await screen.findByTestId("uml-box")
      fireEvent.change(umlBox, { target: { value: "uml_code" } });

      expect(await screen.findByDisplayValue('uml_code')).toBeInTheDocument();

      await waitFor(() => {
        expect(axiosStub).toHaveBeenCalledTimes(1);
        expect(axiosStub).toBeCalledWith("http://localhost:4000/fetch-plant-uml", {uml_code: "uml_code", response_type: 'SVG', return_as_uri: true});
      });

      const diagramBox = await screen.findByAltText('UML Diagram');
      
      await waitFor(() => {
        expect(diagramBox.src).toContain('diagram');
      });
  });

  it("should call plant uml visualizer after editing uml text box and display the error", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.reject({
      status: 500,
      response: { data: { type: "SomeError" } }
    }));

    render(
        <Provider store={store}>
          <Query />
        </Provider>
      );

    const umlBox = await screen.findByTestId("uml-box")
    fireEvent.change(umlBox, { target: { value: "uml_code" } });

    expect(await screen.findByDisplayValue('uml_code')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toBeCalledWith("http://localhost:4000/fetch-plant-uml", {uml_code: "uml_code", response_type: 'SVG', return_as_uri: true});
    });

    expect(await screen.findByText('Unknown PlantUML Server Error')).toBeInTheDocument();
});

  it("should query ai with info from prompt box and uml code and then display & visualize the generated code", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "first_diagram"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "first_diagram_refreshed"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: {uml_code: "generated_code"}
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "final_diagram"
    }));

    render(
        <Provider store={store}>
          <Query />
        </Provider>
      );

    const umlBox = await screen.findByTestId("uml-box")
    fireEvent.change(umlBox, { target: { value: "uml_code" } });

    expect(await screen.findByDisplayValue('uml_code')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/fetch-plant-uml", {uml_code: "uml_code", response_type: 'SVG', return_as_uri: true});
    });

    const promptBox = await screen.findByLabelText("Your Prompt");
    fireEvent.change(promptBox, { target: { value: "prompt" } });

    expect(await screen.findByDisplayValue('prompt')).toBeInTheDocument();

    const submitButton = await screen.findByText("Submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(3); // 1 for after code is entered, 1 after prompt is entered, 1 after submit
      expect(axiosStub).toHaveBeenNthCalledWith(3, "http://localhost:4000/query-assistant-code-generator", {uml_code: "uml_code", prompt: "prompt", query: "prompt"});
    });

    expect(await screen.findByDisplayValue('generated_code')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(4);
      expect(axiosStub).toHaveBeenNthCalledWith(4, "http://localhost:4000/fetch-plant-uml", {uml_code: "generated_code", response_type: 'SVG', return_as_uri: true});
    });

    const diagramBox = await screen.findByAltText('UML Diagram');

    await waitFor(() => {
      expect(diagramBox.src).toContain('final_diagram');
    });
  });

  it("should query ai with info from prompt box and uml code and then display error", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "first_diagram"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "first_diagram_refreshed"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.reject({
      status: 500,
      response : { data: {type: "SomeErrorStatus"} }
    }));

    render(
        <Provider store={store}>
          <Query />
        </Provider>
      );

    const umlBox = await screen.findByTestId("uml-box")
    fireEvent.change(umlBox, { target: { value: "uml_code" } });

    expect(await screen.findByDisplayValue('uml_code')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/fetch-plant-uml", {uml_code: "uml_code", response_type: 'SVG', return_as_uri: true});
    });

    const promptBox = await screen.findByLabelText("Your Prompt");
    fireEvent.change(promptBox, { target: { value: "prompt" } });

    expect(await screen.findByDisplayValue('prompt')).toBeInTheDocument();

    const submitButton = await screen.findByText("Submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(3); // 1 for after code is entered, 1 after prompt is entered, 1 after submit
      expect(axiosStub).toHaveBeenNthCalledWith(3, "http://localhost:4000/query-assistant-code-generator", {uml_code: "uml_code", prompt: "prompt", query: "prompt"});
    });

    expect(await screen.findByText('Prompt failed with status: SomeErrorStatus')).toBeInTheDocument();
  });

  it("should create new uml if this is a new document and set redux state to the newly generated uml_id", async () => {
    const mockStore1 = configureStore([]);
    const store1 = mockStore1({
        user: {uid: 'uid'},
        uml: {uml_id: null}
      });

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "diagram"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "result_uml_id"
    }));

    render(
        <Provider store={store1}>
          <Query />
        </Provider>
      );

    const umlBox = await screen.findByTestId("uml-box")
    fireEvent.change(umlBox, { target: { value: "uml_code" } });

    expect(await screen.findByDisplayValue('uml_code')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/fetch-plant-uml", {uml_code: "uml_code", response_type: 'SVG', return_as_uri: true});
    });

    const diagramBox = await screen.findByAltText('UML Diagram');
      
    await waitFor(() => {
      expect(diagramBox.src).toContain('diagram');
    });

    const saveButton = await screen.findByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(2);
      expect(axiosStub).toHaveBeenNthCalledWith(2, "http://localhost:4000/create-new-uml", {content: "uml_code", description: "", diagram: "diagram", privacy: "public", name: "untitled", uid: "uid", "uml_id": null});
      expect(store1.getActions()).toEqual([{ type: 'uml/setUML', payload: "result_uml_id" }]);
    });

  });

  it("should update uml if uml_id is set by redux", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "diagram"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "result_uml_id"
    }));

    render(
        <Provider store={store}>
          <Query />
        </Provider>
      );

    const umlBox = await screen.findByTestId("uml-box")
    fireEvent.change(umlBox, { target: { value: "uml_code" } });

    expect(await screen.findByDisplayValue('uml_code')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/fetch-plant-uml", {uml_code: "uml_code", response_type: 'SVG', return_as_uri: true});
    });

    const diagramBox = await screen.findByAltText('UML Diagram');
      
    await waitFor(() => {
      expect(diagramBox.src).toContain('diagram');
    });

    const saveButton = await screen.findByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(2);
      expect(axiosStub).toHaveBeenNthCalledWith(2, "http://localhost:4000/update-uml", {content: "uml_code", description: "", diagram: "diagram", privacy: "public", name: "untitled", uid: "uid", uml_id: "uml_id"});
    });

  });

  it("should load in uml file data and display based on useLocation state", async () => {
    useLocationStub.mockImplementationOnce(() => ({
      state: {
        name: 'file_name',
        description: 'file_description',
        privacy: 'private',
        content: 'file_content',
      }
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "diagram"
    }));

    render(
        <Provider store={store}>
          <Query />
        </Provider>
      );


    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/fetch-plant-uml", {uml_code: "file_content", response_type: 'SVG', return_as_uri: true});
    });

    expect(await screen.findByDisplayValue('file_content')).toBeInTheDocument();
  });

  it("should change saved file properties with buttons on nav bar", async () => {

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "diagram"
    }));

    render(
        <Provider store={store}>
          <Query />
        </Provider>
      );

    const nameBox = await screen.findByDisplayValue('untitled');
    fireEvent.change(nameBox, { target: { value: "name" } });
    expect(await screen.findByDisplayValue('name')).toBeInTheDocument();

    const descriptionButton = await screen.findByText('Description');
    fireEvent.click(descriptionButton);
    const descriptionBox = await screen.findByLabelText('Description...');
    fireEvent.change(descriptionBox, { target: { value: "newdescription" } });
    expect(await screen.findByDisplayValue('newdescription')).toBeInTheDocument();
    fireEvent.keyDown(descriptionBox, { key: "Escape", code: 27 });

    const privateButton = await screen.findByLabelText('Private');
    fireEvent.click(privateButton);

    const saveButton = await screen.findByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/update-uml", {content: "", description: "newdescription", diagram: "", privacy: "private", name: "name", uid: "uid", uml_id: "uml_id"});
    });
  });

  it("should ask for assistance from ai when button is toggled and display result to screen", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "first_diagram"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "first_diagram_refreshed"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "query_response"
    }));

    render(
        <Provider store={store}>
          <Query />
        </Provider>
      );

    const umlBox = await screen.findByTestId("uml-box")
    fireEvent.change(umlBox, { target: { value: "uml_code" } });

    expect(await screen.findByDisplayValue('uml_code')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/fetch-plant-uml", {uml_code: "uml_code", response_type: 'SVG', return_as_uri: true});
    });

    const promptBox = await screen.findByLabelText("Your Prompt");
    fireEvent.change(promptBox, { target: { value: "prompt" } });

    expect(await screen.findByDisplayValue('prompt')).toBeInTheDocument();

    const toggleButton = await screen.findByLabelText("Query");
    fireEvent.click(toggleButton);

    const submitButton = await screen.findByText("Submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(3); // 1 for after code is entered, 1 after prompt is entered, 1 after submit
      expect(axiosStub).toHaveBeenNthCalledWith(3, 'http://localhost:4000/query-assistant-code-examiner', {uml_code: "uml_code", prompt: "prompt", query: "prompt"});
    });

    expect(await screen.findByText('query_response')).toBeInTheDocument();
  });

  it("should ask for assistance from ai when button is toggled and display error to screen", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "first_diagram"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: "first_diagram_refreshed"
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.reject({
      status: 500,
      response: { data: { type: "SomeErrorStatus" } }
    }));

    render(
        <Provider store={store}>
          <Query />
        </Provider>
      );

    const umlBox = await screen.findByTestId("uml-box")
    fireEvent.change(umlBox, { target: { value: "uml_code" } });

    expect(await screen.findByDisplayValue('uml_code')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/fetch-plant-uml", {uml_code: "uml_code", response_type: 'SVG', return_as_uri: true});
    });

    const promptBox = await screen.findByLabelText("Your Prompt");
    fireEvent.change(promptBox, { target: { value: "prompt" } });

    expect(await screen.findByDisplayValue('prompt')).toBeInTheDocument();

    const toggleButton = await screen.findByLabelText("Query");
    fireEvent.click(toggleButton);

    const submitButton = await screen.findByText("Submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axiosStub).toHaveBeenCalledTimes(3); // 1 for after code is entered, 1 after prompt is entered, 1 after submit
      expect(axiosStub).toHaveBeenNthCalledWith(3, 'http://localhost:4000/query-assistant-code-examiner', {uml_code: "uml_code", prompt: "prompt", query: "prompt"});
    });

    expect(await screen.findByText('Query failed with status: SomeErrorStatus')).toBeInTheDocument();
  });
});

describe("NavBar Testing", () => {
  let store, navigateStub, useLocationStub, axiosStub;

  beforeEach(() => {
      const mockStore = configureStore([]);
      store = mockStore({
          user: {uid: 'uid'},
          uml: {uml_id: 'uml_id'}
        });
      navigateStub = jest.fn();
      axiosStub = jest.spyOn(axios, 'post');
      jest.spyOn(router, 'useNavigate').mockImplementation(() => navigateStub);
      useLocationStub = jest.spyOn(router, 'useLocation').mockImplementation(() => {return {state: ''}});
      firebase.auth.mockImplementation(() => ({
        signOut: jest.fn(),
        currentUser: null
      }));
    });

  afterEach(() => {
      cleanup();
      jest.restoreAllMocks(); 
    });

  it("should route to home page if image is clicked", async () => {
    render(
        <Provider store={store}>
          <NavBar />
        </Provider>
      );

    const homeButton = await screen.findByText('UML Lab');
    fireEvent.click(homeButton);

    await waitFor(() => {
      expect(navigateStub).toBeCalledWith("/");
    });
  });

  it("should route to login page if not logged in ", async () => {
    const mockStore1 = configureStore([]);
    const store1 = mockStore1({
        user: {uid: null},
        uml: {uml_id: null}
      });

    render(
        <Provider store={store1}>
          <NavBar />
        </Provider>
      );

    const loginButton = await screen.findByText('Log In');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(navigateStub).toBeCalledWith("/login");
    });
  });

  it("should display user settings menu on click if logged in", async () => {
    render(
        <Provider store={store}>
          <NavBar />
        </Provider>
      );

    const userIcon = await screen.findByTestId('usericon');
    fireEvent.click(userIcon);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Logout')).toBeInTheDocument();
    expect(await screen.findByText('Delete Account')).toBeInTheDocument();
  });

  it("should navigate to dashboard if dashboard is clicked", async () => {
    render(
        <Provider store={store}>
          <NavBar />
        </Provider>
      );

    const userIcon = await screen.findByTestId('usericon');
    fireEvent.click(userIcon);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Logout')).toBeInTheDocument();
    expect(await screen.findByText('Delete Account')).toBeInTheDocument();

    const dashboardButton = await screen.findByText('Dashboard');
    fireEvent.click(dashboardButton);

    await waitFor(() => {
      expect(navigateStub).toBeCalledWith("/dashboard");
    });


  });

  
  it("should logout user if logout is clicked", async () => {
    render(
        <Provider store={store}>
          <NavBar />
        </Provider>
      );

    const userIcon = await screen.findByTestId('usericon');
    fireEvent.click(userIcon);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Logout')).toBeInTheDocument();
    expect(await screen.findByText('Delete Account')).toBeInTheDocument();

    const logoutButton = await screen.findByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(store.getActions()).toEqual([{ type: 'user/logout', payload: undefined }]);
    });
  });

  it("should call delete account route if clicked and user is email/password", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200
    }));

    render(
        <Provider store={store}>
          <NavBar />
        </Provider>
      );

    const userIcon = await screen.findByTestId('usericon');
    fireEvent.click(userIcon);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Logout')).toBeInTheDocument();
    expect(await screen.findByText('Delete Account')).toBeInTheDocument();

    const deleteButton = await screen.findByText('Delete Account');
    fireEvent.click(deleteButton);

    const confirmDelete = await screen.findByText('Delete account');
    fireEvent.click(confirmDelete);

    await waitFor(() => {
      expect(axiosStub).toBeCalledWith("http://localhost:4000/delete-account", {"uid": "uid"});
      expect(store.getActions()).toEqual([{ type: 'user/logout', payload: undefined },  {type: 'uml/removeUML', payload: undefined }]);
    });
  });

  it("should call delete google account route if clicked and user is from google provider", async () => {

    firebase.auth.mockImplementationOnce(() => ({
      signOut: jest.fn(),
      currentUser: {a: "a", b: "b"}
    }));

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200
    }));

    render(
        <Provider store={store}>
          <NavBar />
        </Provider>
      );

    const userIcon = await screen.findByTestId('usericon');
    fireEvent.click(userIcon);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Logout')).toBeInTheDocument();
    expect(await screen.findByText('Delete Account')).toBeInTheDocument();

    const deleteButton = await screen.findByText('Delete Account');
    fireEvent.click(deleteButton);

    const confirmDelete = await screen.findByText('Delete account');
    fireEvent.click(confirmDelete);

    await waitFor(() => {
      expect(axiosStub).toBeCalledWith("http://localhost:4000/delete-google-account", {"uid": "uid"});
      expect(store.getActions()).toEqual([{ type: 'user/logout', payload: undefined },  {type: 'uml/removeUML', payload: undefined }]);
    });
  });

  it("should display use location state values if coming from query page", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200
    }));

    useLocationStub.mockImplementationOnce(() => ({
      state: {
        name: 'file_name',
        description: 'file_description',
        privacy: 'private',
        content: 'file_content',
      }
    }));

    render(
        <Provider store={store}>
          <NavBar IndependentPageButtons={"QueryPage"} umlText={"umlText"} diagram={"diagram"}/>
        </Provider>
      );

      expect(await screen.findByDisplayValue('file_name')).toBeInTheDocument();
  
      const descriptionButton = await screen.findByText('Description');
      fireEvent.click(descriptionButton);

      const descriptionBox = await screen.findByLabelText('Description...');
      expect(await screen.findByDisplayValue('file_description')).toBeInTheDocument();
      fireEvent.keyDown(descriptionBox, { key: "Escape", code: 27 });
  
      const saveButton = await screen.findByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() => { // Wait for the apis to be called, wont fail immediately
        expect(axiosStub).toHaveBeenCalledTimes(1);
        expect(axiosStub).toHaveBeenNthCalledWith(1, "http://localhost:4000/update-uml", {content: "umlText", description: "file_description", diagram: "diagram", privacy: "private", name: "file_name", uid: "uid", uml_id: "uml_id"});
    });
  });


});

describe("Login Testing", () => {
  let store, navigateStub, useLocationStub, axiosStub;

  beforeEach(() => {
      const mockStore = configureStore([]);
      store = mockStore({
          user: {uid: 'uid'},
          uml: {uml_id: 'uml_id'}
        });
      navigateStub = jest.fn();
      axiosStub = jest.spyOn(axios, 'post');
      jest.spyOn(router, 'useNavigate').mockImplementation(() => navigateStub);
      useLocationStub = jest.spyOn(router, 'useLocation').mockImplementation(() => {return {state: ''}});
      firebase.auth.mockImplementation(() => ({
        signOut: jest.fn(),
        currentUser: null
      }));
    });

  afterEach(() => {
      cleanup();
      jest.restoreAllMocks(); 
    });

  it("should signin user based on values within text boxes, route to home page, and set redux", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: {user: {uid: "uid"}}
    }));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path='/login' element={<Provider store={store}><Login /></Provider>} />
          <Route path='/signup' element={<div> Sign Up </div>} />
        </Routes>
      </MemoryRouter>);

    const emailBox = await screen.findByTestId('email-box');
    fireEvent.change(emailBox, { target: { value: "email@gmail.com" } });

    const passwordBox = await screen.findByTestId('password-box');
    fireEvent.change(passwordBox, { target: { value: "password" } });

    expect(await screen.findByDisplayValue('email@gmail.com')).toBeInTheDocument();

    const signinButton = await screen.findByText('Sign In');
    fireEvent.click(signinButton);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toBeCalledWith("http://localhost:4000/login", {email: "email@gmail.com", password: "password"});
      expect(navigateStub).toBeCalledWith('/');
      expect(store.getActions()).toEqual([{ type: 'user/login', payload: "uid" }]);
    });

  });

  it("should display errors if form fields are invalid", async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path='/login' element={<Provider store={store}><Login /></Provider>} />
          <Route path='/signup' element={<div> Sign Up </div>} />
        </Routes>
      </MemoryRouter>);

    const emailBox = await screen.findByTestId('email-box');
    fireEvent.change(emailBox, { target: { value: "bademail" } });

    const passwordBox = await screen.findByTestId('password-box');
    fireEvent.change(passwordBox, { target: { value: "p" } });

    expect(await screen.findByDisplayValue('bademail')).toBeInTheDocument();

    const signinButton = await screen.findByText('Sign In');
    fireEvent.click(signinButton);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(axiosStub).toHaveBeenCalledTimes(0);
    });

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(await screen.findByText('Invalid password')).toBeInTheDocument();

  });

  it("should tell user if no account exists with credentials", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.reject({
      status: 400
    }))

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path='/login' element={<Provider store={store}><Login /></Provider>} />
          <Route path='/signup' element={<div> Sign Up </div>} />
        </Routes>
      </MemoryRouter>);

    const emailBox = await screen.findByTestId('email-box');
    fireEvent.change(emailBox, { target: { value: "no_exist@gmail.com" } });

    const passwordBox = await screen.findByTestId('password-box');
    fireEvent.change(passwordBox, { target: { value: "password" } });

    expect(await screen.findByDisplayValue('no_exist@gmail.com')).toBeInTheDocument();

    const signinButton = await screen.findByText('Sign In');
    fireEvent.click(signinButton);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(axiosStub).toBeCalledWith("http://localhost:4000/login", {email: "no_exist@gmail.com", password: "password"});
    });

    expect((await screen.findAllByText('Invalid email address or password'))[0]).toBeInTheDocument();

  });

  it("signup link should link to signup page", async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path='/login' element={<Provider store={store}><Login /></Provider>} />
          <Route path='/signup' element={<div> Sign Up Page </div>} />
        </Routes>
      </MemoryRouter>);

    const link = await screen.getByRole('link', { name: "Don't have an account? Sign Up" });
    fireEvent.click(link);

    expect(navigateStub).toBeCalledWith('/signup', expect.anything());
  });

  it("should allow user to log in with google account", async () => {

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200
    }));

    const popUpStub = jest.fn().mockImplementation((x) => ({
      user: {
        uid: "google_uid",
        email: "google_email"
      }
    }));

    firebase.auth.mockImplementation(() => ({
      signOut: jest.fn(),
      currentUser: null,
      signInWithPopup: popUpStub,
    }));


    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path='/login' element={<Provider store={store}><Login /></Provider>} />
          <Route path='/singup' element={<div> Sign Up </div>} />
        </Routes>
      </MemoryRouter>);

    const link = await screen.getByText('Sign In with Google');
    fireEvent.click(link);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(firebase.auth.GoogleAuthProvider).toHaveBeenCalledTimes(1);
      expect(popUpStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toBeCalledWith('http://localhost:4000/google-login', { uid: "google_uid", user: {uid: "google_uid", email: "google_email"}});
      expect(store.getActions()).toEqual([{ type: 'user/login', payload: "google_uid" }]);
    });
  });

  it("should tell user if google account is not already associated with webapp", async () => {

    axiosStub.mockImplementationOnce(() =>
    Promise.reject({
      response: {
        data: 'User does not exist',
        status: 400
      }
    }));

    const popUpStub = jest.fn().mockImplementation((x) => ({
      user: {
        uid: "google_uid",
        email: "google_email"
      }
    }));

    const deleteStub = jest.fn();

    firebase.auth.mockImplementation(() => ({
      signOut: jest.fn(),
      currentUser: {
        delete: deleteStub
      },
      signInWithPopup: popUpStub,
    }));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path='/login' element={<Provider store={store}><Login /></Provider>} />
          <Route path='/signup' element={<div> Sign Up </div>} />
        </Routes>
      </MemoryRouter>);

    const link = await screen.getByText('Sign In with Google');
    fireEvent.click(link);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(firebase.auth.GoogleAuthProvider).toHaveBeenCalledTimes(1);
      expect(popUpStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toBeCalledWith('http://localhost:4000/google-login', { uid: "google_uid", user: {uid: "google_uid", email: "google_email"}});
      expect(deleteStub).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('User does not exist. Please sign up instead.')).toBeInTheDocument();
  });
});

describe("Signup Testing", () => {
  let store, navigateStub, useLocationStub, axiosStub;

  beforeEach(() => {
      const mockStore = configureStore([]);
      store = mockStore({
          user: {uid: 'uid'},
          uml: {uml_id: 'uml_id'}
        });
      navigateStub = jest.fn();
      axiosStub = jest.spyOn(axios, 'post');
      jest.spyOn(router, 'useNavigate').mockImplementation(() => navigateStub);
      useLocationStub = jest.spyOn(router, 'useLocation').mockImplementation(() => {return {state: ''}});
      firebase.auth.mockImplementation(() => ({
        signOut: jest.fn(),
        currentUser: null
      }));
    });

  afterEach(() => {
      cleanup();
      jest.restoreAllMocks(); 
    });

  it("should signup user based on values within text boxes, route to home page, and set redux", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: {user: {uid: "uid"}}
    }));

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path='/signup' element={<Provider store={store}><Signup /></Provider>} />
          <Route path='/login' element={<div> Log In </div>} />
        </Routes>
      </MemoryRouter>);

    const emailBox = await screen.findByTestId('email-box');
    fireEvent.change(emailBox, { target: { value: "email@gmail.com" } });

    const passwordBox = await screen.findByTestId('password-box');
    fireEvent.change(passwordBox, { target: { value: "password" } });

    const cpasswordBox = await screen.findByTestId('cpassword-box');
    fireEvent.change(cpasswordBox, { target: { value: "password" } });

    expect(await screen.findByDisplayValue('email@gmail.com')).toBeInTheDocument();

    const signinButton = await screen.findByText('Sign Up');
    fireEvent.click(signinButton);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toBeCalledWith("http://localhost:4000/signup", {email: "email@gmail.com", password: "password", confirmPassword: "password"});
      expect(navigateStub).toBeCalledWith('/');
      expect(store.getActions()).toEqual([{ type: 'user/login', payload: "uid" }]);
    });

  });

  it("should display errors if input fields are invalid", async () => {
    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      data: {user: {uid: "uid"}}
    }));

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path='/signup' element={<Provider store={store}><Signup /></Provider>} />
          <Route path='/login' element={<div> Log In </div>} />
        </Routes>
      </MemoryRouter>);

    const emailBox = await screen.findByTestId('email-box');
    fireEvent.change(emailBox, { target: { value: "abc" } });

    const passwordBox = await screen.findByTestId('password-box');
    fireEvent.change(passwordBox, { target: { value: "p" } });

    const cpasswordBox = await screen.findByTestId('cpassword-box');
    fireEvent.change(cpasswordBox, { target: { value: "password" } });

    expect(await screen.findByDisplayValue('abc')).toBeInTheDocument();

    const signinButton = await screen.findByText('Sign Up');
    fireEvent.click(signinButton);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(axiosStub).toHaveBeenCalledTimes(0);
    });

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(await screen.findByText('Confirm password does not match your password')).toBeInTheDocument();
  });


  it("login link should link to login page", async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path='/signup' element={<Provider store={store}><Signup /></Provider>} />
          <Route path='/login' element={<div> Log In </div>} />
        </Routes>
      </MemoryRouter>);

    const link = await screen.getByRole('link', { name: "Already have an account? Sign in" });
    fireEvent.click(link);

    expect(navigateStub).toBeCalledWith('/login', expect.anything());
  });

  it("should allow user to sign up with google account", async () => {

    axiosStub.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200
    }));

    const popUpStub = jest.fn().mockImplementation((x) => ({
      user: {
        uid: "google_uid",
        email: "google_email"
      }
    }));

    firebase.auth.mockImplementation(() => ({
      signOut: jest.fn(),
      currentUser: null,
      signInWithPopup: popUpStub,
    }));


    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path='/signup' element={<Provider store={store}><Signup /></Provider>} />
          <Route path='/login' element={<div> Log In </div>} />
        </Routes>
      </MemoryRouter>);

    const link = await screen.getByText('Sign Up with Google');
    fireEvent.click(link);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(firebase.auth.GoogleAuthProvider).toHaveBeenCalledTimes(1);
      expect(popUpStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toBeCalledWith('http://localhost:4000/google-signup', { uid: "google_uid", email: "google_email" });
      expect(store.getActions()).toEqual([{ type: 'user/login', payload: "google_uid" }]);
    });
  });

  it("should tell user if google account is already associated with webapp", async () => {

    axiosStub.mockImplementationOnce(() =>
    Promise.reject({
      response: {
        data: 'User already exists.',
        status: 400
      }
    }));

    const popUpStub = jest.fn().mockImplementation((x) => ({
      user: {
        uid: "google_uid",
        email: "google_email"
      }
    }));

    firebase.auth.mockImplementation(() => ({
      signOut: jest.fn(),
      currentUser: null,
      signInWithPopup: popUpStub,
    }));

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path='/signup' element={<Provider store={store}><Signup /></Provider>} />
          <Route path='/login' element={<div> Log In </div>} />
        </Routes>
      </MemoryRouter>);

    const link = await screen.getByText('Sign Up with Google');
    fireEvent.click(link);

    await waitFor(() => { // Wait for the apis to be called, wont fail immediately
      expect(firebase.auth.GoogleAuthProvider).toHaveBeenCalledTimes(1);
      expect(popUpStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toHaveBeenCalledTimes(1);
      expect(axiosStub).toBeCalledWith('http://localhost:4000/google-signup', { uid: "google_uid", email: "google_email" });
    });

    expect(await screen.findByText('User already exists. Please sign in instead.')).toBeInTheDocument();
  });
});
