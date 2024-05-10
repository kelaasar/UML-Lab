/**
 * @module client/dashboard
 * @description Provides the Dashboard component class
 */

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Masonry from '@mui/lab/Masonry';
import { useMediaQuery } from '@mui/material';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import ButtonGroup from '@mui/material-next/ButtonGroup';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

import Diagram_img from '../images/Not-Found.svg'
import NavBar from './NavBar';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { setUML } from '../redux/uml';
import { useDispatch, useSelector } from 'react-redux';

/**
 * The UserDiagrams component features the user's UML diagrams, with the option to edit, download, or delete them.
 * @memberof module:client/dashboard
 */
const UserDiagrams = () => {
    const isSmallScreen = useMediaQuery('(max-width:600px)');
    const columns = isSmallScreen ? 1 : 3;
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);
    const [userUML, setUserUML] = useState([]);
    const dispatch = useDispatch();
    const { uid } = useSelector((state) => state.user);

    const handleEditClick = (event, UML) => {
        dispatch(setUML(UML.uml_id));
        navigate("/query", {state: UML});   
    };

    const handleDownloadClick = (event, UML) => {
        const umlContent = UML.content;

        const blob = new Blob([umlContent], { type: 'text/plain' });
    
        const url = window.URL.createObjectURL(blob);
    
        const link = document.createElement('a');
        link.href = url;
        link.download = `${UML.name}.txt`; 
        document.body.appendChild(link);
        link.click();
    
        // Clean up the URL
        window.URL.revokeObjectURL(url);
    };

    const handleDeleteClick = async (event, UML) => {
        const body = {
            uid: uid,
            uml_id: UML.uml_id
        };
        try {
            await axios.post('http://localhost:4000/delete-uml', body);
            const newUserUML = userUML.filter(uml => uml.uml_id !== UML.uml_id);
            setUserUML(newUserUML);
        }
        catch(error)
        {
        }
    };

    useEffect(() => {
        async function loadUML() {
            const body = {
                uid: uid
            };
            try {
                const res = await axios.post('http://localhost:4000/get-user-uml', body);
                setUserUML(res.data);
                setLoaded(true);
            }
            catch(error) {
            }
        }

        if (!loaded) {
            loadUML();
        }
    });

    if (!loaded) {
        return (<div className="loaderlong" />);
    }

    return (
        <Masonry columns={columns} spacing={2}>
            {userUML.map((UML, index) => (
                <Card key={index} sx={{ p: 1 }}>
                    <CardMedia 
                        sx={{ height: 180, objectFit: "contain"}}
                        component="img"
                        image={UML.diagram ? UML.diagram : Diagram_img}
                        scale='20'
                        title='UML Diagram' 
                    /> 
                    <ButtonGroup>
                        <Button variant='filled' onClick={event => handleEditClick(event, UML)} startIcon={<EditIcon />}>
                            Edit
                        </Button>
                        <Button variant='filled' onClick={event => handleDownloadClick(event, UML)} startIcon={<DownloadIcon />}>
                            Download
                        </Button>
                        <Button variant='filled' onClick={event => handleDeleteClick(event, UML)} startIcon={<DeleteIcon />}>
                            Delete
                        </Button>
                    </ButtonGroup>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}
                    >
                        <CardHeader
                            title={UML.name}
                            subheader={UML.description}
                        />
                    </Box>
                </Card>
            ))}
        </Masonry>
    );
};

/**
 * The Dashboard component allows users to create a new UML diagram, and also contains UserDiagrams.
 * @memberof module:client/dashboard
 */
const Dashboard = () => {
    const navigate = useNavigate();

    const handleCreateClick = () => {
        navigate('/query');
    };

    return (
        <div>
            <NavBar />
            <Container                 
                sx={{
                    pt: "7rem",
                    pb: "5rem",
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: { xs: 3, sm: 6 },
                }}
            >
                <Box>
                    <Button onClick={handleCreateClick} variant='outlined' startIcon={<AddIcon />}>
                        Create
                    </Button>
                </Box>
                <UserDiagrams />
            </Container>
        </div>
    );
};

export default Dashboard;