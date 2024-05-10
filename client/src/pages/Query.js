/**
 * @module client/query
 * @description Provides the Query component class
 */

import React, { useCallback, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { TextField, Card, CardMedia, TextareaAutosize, CardContent, IconButton } from '@mui/material';
import './Query.css'
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import LoadingButton from '@mui/lab/LoadingButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Missing from '../images/Missing.svg';
import SubmitIcon from '@mui/icons-material/ArrowUpward';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';

/**
 * The UmlInputBox component allows users to enter and edit PlantUML syntax.
 * @memberof module:client/query
 */
const UmlInputBox = ({umlText, handleUMLChange}) => {
    return (
      <Card className='uml-wrapper'>
        <CardContent style={{ paddingTop: '1.5vh'}}>
          <TextareaAutosize
            className='uml-box'
            variant="outlined"
            placeholder="Enter a search term"
            value={umlText}
            rows = {35}
            minRows= {35}
            maxRows= {35}
            onChange={handleUMLChange}
            data-testid = 'uml-box'
          />
        </CardContent>
      </Card>
    );
};

/**
 * The Diagram component contains a visualization of a UML diagram.
 * @memberof module:client/query
 */
const Diagram = ({image}) => {
  var displayImage = null;

  if (image !== ''){
    displayImage = image;
  }
  else
  {
    displayImage = Missing;
  }

  return (
    <Card className='diagram-card'>
      <CardMedia
        sx={{ height: '73vh', width: '49vw', objectFit: "contain" }}
        component="img"
        alt="UML Diagram"
        src={displayImage}
      />
    </Card>
  );
};

/**
 * The Prompt component allows the user to ask an AI assistant to generate or answer questions about UML diagrams.
 * @memberof module:client/query
 */
const Prompt = ({handlePromptChange, promptText, promptType, error}) => {
  return (
    <TextField 
      onChange={handlePromptChange}
      value={promptText}
      fullWidth
      label={"Your " + promptType.charAt(0).toUpperCase() + promptType.slice(1)}
      error={error}
    />
  );
};

/**
 * The Query component features a UmlInputBox, Diagram, and Prompt.
 * @memberof module:client/query
 */
const Query = () => {
  const {state} = useLocation();

  const [umlText, setUMLText] = useState(state && state.content ? state.content : '');
  const [promptText, setPromptText] = useState(state && state.prompt ? state.prompt : '');
  const [diagram, setDiagram] = useState(state && state.diagram ? state.diagram : ''); // i think this works nicely
  const [diagramLoaded, setDiagramLoaded] = useState(false);
  const [generatorResponded, setGeneratorResponded] = useState(true);
  const [examinerResponded, setExaminerResponded] = useState(true);
  const [examinerResponse, setExaminerResponse] = useState('');
  const [prompttoggle, setPromptToggle] = useState(state && state.prompttoggle ? state.prompttoggle: 'prompt');
  const [oneTimeLoad, setOneTimeLoad] = useState(state && state.oneTimeLoad ? state.oneTimeLoad : false);
  const [openDiagramSnackbar, setOpenDiagramSnackbar] = useState(false);
  const [diagramAlertText, setDiagramAlertText] = useState('');
  const [openUMLResponseSnackbar, setOpenUMLResponseSnackbar] = useState(false);
  const [openUMLErrorSnackbar, setOpenUMLErrorSnackbar] = useState(false);
  const [umlErrorAlertText, setUMLErrorAlertText] = useState('');

  const handleUMLChange = (event) => {
    setUMLText(event.target.value);
    setDiagramLoaded(false);
  };

  const handleSubmission = useCallback(
    async () => {
      const body = {
        uml_code: umlText,
        prompt: promptText,
        query: promptText
      };

      if (prompttoggle === 'prompt') {
        setGeneratorResponded(false);
        try {
          const res = await axios.post('http://localhost:4000/query-assistant-code-generator', body);
          setUMLText(res.data.uml_code);
          setDiagramLoaded(false);
        }
        catch (error) {
          setUMLErrorAlertText('Prompt failed with status: ' + error.response.data.type);
          setOpenUMLErrorSnackbar(true);
        }
        finally {
          setGeneratorResponded(true);
        }
      }
      else {
        setExaminerResponded(false);
        try {
          const res = await axios.post('http://localhost:4000/query-assistant-code-examiner', body);
          setExaminerResponse(res.data);
          setOpenUMLResponseSnackbar(true);
        }
        catch (error) {
          setUMLErrorAlertText('Query failed with status: ' + error.response.data.type);
          setOpenUMLErrorSnackbar(true);
        }
        finally {
          setExaminerResponded(true);
        }
      }
    },
    [umlText, promptText, prompttoggle]
  );

  const handlePromptChange = (event) => {
    setPromptText(event.target.value);
  };

  const handlePromptClick = (_, newPrompt) => {
    if (newPrompt !== null) {
      setPromptToggle(newPrompt);
    }
  };

  const loadDiagram = useCallback(
    async () => {
      try {
        const plantBody = {
          uml_code: umlText,
          response_type: 'SVG',
          return_as_uri: true
        };
        const res = await axios.post('http://localhost:4000/fetch-plant-uml', plantBody);
        setDiagram(res.data);
        setDiagramLoaded(true);
        setOpenDiagramSnackbar(false);
      }
      catch(error) {
        switch (error.response.data.type) {
          case 'InvalidUMLCodeError':
            setDiagramAlertText('Invalid UML Code');
            break;
          case 'TimeoutError':
            setDiagramAlertText('PlantUML Server Timeout');
            break;
          case 'ServerError':
            setDiagramAlertText('PlantUML Server Unavailable');
            break;
          default:
            setDiagramAlertText('Unknown PlantUML Server Error');
        }
        setOpenDiagramSnackbar(true);
      }      
    },
    [umlText]
  );

  useEffect(
    () => {
      if (umlText !== '' && !diagramLoaded)
        loadDiagram();
      if (oneTimeLoad && promptText !== '') {
        handleSubmission();
      }
      setOneTimeLoad(false);
    },
    [umlText, diagramLoaded, loadDiagram, oneTimeLoad, promptText, handleSubmission]
  );

  return (
    <div>
      <NavBar IndependentPageButtons={"QueryPage"} umlText={umlText} diagram={diagram} />
      <Grid container direction='row' className='query-container' spacing={2}>
        <Grid item className='uml-wrapper' xs = {6} mt={2} sx={{ position: 'relative' }}>
          <UmlInputBox handleUMLChange={handleUMLChange} umlText={umlText} className='uml-box' />
          <Snackbar
            open={openUMLResponseSnackbar}
            sx={{ position: 'absolute'}}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            message={examinerResponse}
            action={
              <IconButton
                size='small'
                aria-label='close'
                color='inherit'
                onClick={() => setOpenUMLResponseSnackbar(false)}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
            }
          >
          </Snackbar>
          <Snackbar
            open={openUMLErrorSnackbar}
            onClose={(_, reason) => setOpenUMLErrorSnackbar(false)}
            sx={{ position: 'absolute'}}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert onClose={() => setOpenUMLErrorSnackbar(false)} severity="error" sx={{ width: '100%' }}>
              {umlErrorAlertText}
            </Alert>
          </Snackbar>
        </Grid>
        <Grid item className='diagram-wrapper' xs={6} mt={2} sx={{ position: 'relative' }}>
          <Diagram image={diagram} />
          <Snackbar
            open={openDiagramSnackbar}
            onClose={() => setOpenDiagramSnackbar(false)}
            sx={{ position: 'absolute'}}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert onClose={() => setOpenDiagramSnackbar(false)} severity="error" sx={{ width: '100%' }}>
              {diagramAlertText}
            </Alert>
          </Snackbar>
        </Grid>
      </Grid>
      <Grid container direction='row' spacing={1}>
        <Grid item xs={9} mt={1.5}>
          <Prompt handlePromptChange={handlePromptChange} promptText={promptText} promptType={prompttoggle} error={openUMLErrorSnackbar} />
        </Grid>
        <Grid item xs={1.2} mt={2.5}>
          <LoadingButton
            onClick={handleSubmission}
            loading={(!generatorResponded || !examinerResponded)}
            loadingPosition="start"
            startIcon={<SubmitIcon />}
            variant="contained"
          >
            <span>Submit</span>
          </LoadingButton>
        </Grid>
        <Grid item xs={1} mt={2}>
          <ToggleButtonGroup
            value={prompttoggle}
            exclusive
            onChange={handlePromptClick}
            aria-label="UML Privacy"
          >
            <ToggleButton value="prompt" aria-label="Prompt">
                Prompt
            </ToggleButton>
            <ToggleButton value="query" aria-label="Query">
                Query
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>
    </div>
  );
};

export default Query;