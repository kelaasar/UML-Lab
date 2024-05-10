/**
 * @module client/navbar
 * @description Provides the NavBar component class
 */

import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import {Box, Container, Toolbar, Tooltip, Menu, MenuItem, Button, Slide, DialogActions} from '@mui/material';
import {IconButton,ListItemIcon} from '@mui/material';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/icons-material/AccountCircle';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import LoadingButton from '@mui/lab/LoadingButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';

import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/user';
import { setUML, removeUML} from '../redux/uml';
import { useNavigate, useLocation} from 'react-router-dom';
import axios from 'axios';  

import DashboardIcon from '@mui/icons-material/Dashboard';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SaveIcon from '@mui/icons-material/Save';
import { Logout } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditNoteIcon from '@mui/icons-material/EditNote';
import firebase from '../firebase';

function HideOnScroll(props) {
    const { children} = props;
    const trigger = useScrollTrigger();
  
    return (
      <Slide appear={false} direction="down" in={!trigger}>
        {children}
      </Slide>
    );
};

/**
 * The UserMenu component links to the Login and Signup pages if the user is not signed in, otherwise it features a collapsible menu which allows the user to visit his or her Dashboard, log out, or delete the account.
 * @memberof module:client/navbar
 */
const UserMenu = () => {
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { uid } = useSelector((state) => state.user);
    const [open, setOpen] = useState(false); 

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleCloseDialog = (event) => {
        setOpen(false);
    };
    const handleOpenDialog = () => {
        setOpen(true);
      };

    function flogout() {
        dispatch(logout());
        firebase.auth().signOut();
    };

    const handleDashboardClick = () => {
        dispatch(removeUML());
        navigate("/dashboard");
    };

    const handleDeleteClick = async () => {
        const body = {
            uid: uid
        };

        if (firebase.auth().currentUser === null)
        {
            try {
                await axios.post('http://localhost:4000/delete-account', body);
            }
            catch (error){}
        }
        else{
            try {
                await axios.post('http://localhost:4000/delete-google-account', body);
            }
            catch (error){}
        }
        dispatch(logout());
        dispatch(removeUML());
        firebase.auth().signOut();
        window.location.href = '/'; //need to refresh page
    };

    const handleLoginClick = () => {
        dispatch(removeUML());
        navigate("/login");
    };

    const handleSignUpClick = () => {
        dispatch(removeUML());
        navigate("/signup");
    };

    if (uid !== null){
        return (
            <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Open options">
                    <IconButton data-testid = 'usericon' onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        <Avatar fontSize ="large" sx={{color: '#FFFFFF'}} />
                    </IconButton>
                </Tooltip>
                <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                >
                <MenuItem onClick={handleDashboardClick}><ListItemIcon ><DashboardIcon/></ListItemIcon>Dashboard </MenuItem>
                <MenuItem onClick={flogout}><ListItemIcon><Logout/></ListItemIcon>Logout</MenuItem>
                <MenuItem onClick={handleOpenDialog}><ListItemIcon><DeleteIcon/></ListItemIcon>Delete Account</MenuItem>
                <Dialog onClose={handleCloseDialog} open={open} fullWidth         
                    sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    }}>
                    <DialogTitle>This will permanently delete your account</DialogTitle>
                    <DialogActions>
                        <Button onClick={handleDeleteClick}>Delete account</Button>
                    </DialogActions>
                </Dialog>
                </Menu>
            </Box>
        );
    }
    else {
        return (
            
            <Box sx={{ flexGrow: 0 , display: 'flex'}}>
                <Button
                key="Register"
                onClick={handleSignUpClick}
                sx={{ my: 2, mr: 1, color: 'white', display: 'block', fontWeight:600, fontSize:'1.2vmax'}}
                >
                Register
                </Button>
                <Button
                key="Log in"
                onClick={handleLoginClick}
                sx={{ my: 2, color: 'white', display: 'block', fontWeight:600, fontSize:'1.2vmax'}}
                >
                Log In
                </Button>
            </Box>
        );
    }
};

/**
 * The PageButtons contain nothing when not on the query page. Otherwise, if not logged in, it contains a message saying you must sign in to save your diagram, and if logged in allows users to set a name, description, and privacy setting before saving the UML diagram.
 * @memberof module:client/navbar
 */
const PageButtons = ({ IndependentPageButtons=null, umlText=null, diagram=null }) => {
    const {state} = useLocation();

    const { uid } = useSelector((state) => state.user);
    const { uml_id } = useSelector((state) => state.uml);
    const [nameText, setNameText] = useState(state && state.name ? state.name: 'untitled');
    const [privacy, setPrivacy] = useState(state && state.privacy ? state.privacy: 'public');
    const [descriptionText, setDescriptionText] = useState(state && state.description ? state.description: '');
    const dispatch = useDispatch();

    const [open, setOpen] = useState(false);    //description dialog button
    const [loadingb, setLoadingb] = useState(false); //save loading button state
  
    const handleNameChange = (event) => {
        setNameText(event.target.value);
    };

    const handleDescriptionChange = (event) => {
        setDescriptionText(event.target.value);
    };
  
    const handleClickDescription = () => {
      setOpen(true);
    };
  
    const handleClose = (event) => {
      setDescriptionText(descriptionText);
      setOpen(false);
    };

    const handlePrivacyClick = (event, newPrivacy) => {
        if (newPrivacy !== null) {
            setPrivacy(newPrivacy);
        }
    };

    const handleSaveClick = async () => {
        setLoadingb(true);
        const body = {
          uml_id : uml_id,
          uid: uid,
          content: umlText,
          privacy: privacy,
          name: nameText,
          description: descriptionText,
          diagram: diagram
        };

        if (uid != null && uml_id == null) { // if we are logged in but this is a new diagram
          try {
            const res = await axios.post('http://localhost:4000/create-new-uml', body);
            dispatch(setUML(res.data));
          }
          catch(error)
          {}
        }
        else if(uml_id != null) // if we know what uml we are changing
        {
          try {
            await axios.post('http://localhost:4000/update-uml', body);
          }
          catch(error) {}
        }
        setLoadingb(false);
    };

    if(IndependentPageButtons === null){
        return(
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}/>
        );
    }
    else if (IndependentPageButtons === "QueryPage" && uid !== null) {
        return(
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'flex' ,lg:'flex'} }}>
                <TextField 
                    sx={{ml:"8rem", mr:'5rem', input: {color: 'white'}}}
                    onChange={handleNameChange}
                    placeholder='Untitled'
                    value={nameText}
                    hiddenLabel
                    variant="outlined"
                    color="grey"
                />
                <Button sx={{ mr:'5rem', color:'white', borderColor:'#135ba2', '&:hover': {borderColor: 'black', backgroundColor: '#176cc1'},}} variant="outlined" onClick={handleClickDescription}>
                    <EditNoteIcon/>Description
                </Button>
                <Dialog onClose={handleClose} open={open} 
                    fullWidth         
                    sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    }}>
                    <DialogTitle sx={{ my: "1rem"}}>UML Diagram Description</DialogTitle>
                    <TextField 
                        onChange={handleDescriptionChange}
                        value={descriptionText}
                        label="Description..."
                        multiline
                    />
                </Dialog>
                <ToggleButtonGroup sx={{ ml:'2rem', mr:'5rem'}}
                    value={privacy}
                    exclusive
                    onChange={handlePrivacyClick}
                    aria-label="UML Privacy"
                    >
                    <Tooltip title="Public" arrow><ToggleButton value="public" aria-label="Public">
                        <VisibilityIcon />
                    </ToggleButton></Tooltip>
                    <Tooltip title="Private" arrow><ToggleButton value="private" aria-label="Private">
                        <VisibilityOffIcon />
                    </ToggleButton></Tooltip>
                </ToggleButtonGroup>
                <LoadingButton
                    onClick={handleSaveClick}
                    loading={loadingb}
                    loadingPosition="start"
                    startIcon={<SaveIcon />}
                    variant="contained"
                    >
                    <span>Save</span>
                </LoadingButton>
            </Box>
        );
    }
    else if (IndependentPageButtons === "QueryPage" && uid === null) {
        return(
            <Box justifyContent={"center"} sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                <Typography fontSize={"1.5vmax"}>Log in to save your work</Typography>
            </Box>
        );
    }
};

/**
 * The NavBar contains the UML Lab name and logo, PageButtons, and UserMenu.
 * @memberof module:client/navbar
 */
const NavBar = ({IndependentPageButtons=null, umlText=null, diagram=null}) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const handleHomeClick = () => {
        dispatch(removeUML());
        navigate("/");
    };

    return (
        <HideOnScroll>
            <AppBar>
                <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Button
                        variant='text'
                        onClick = {handleHomeClick}
                        style={{ color: "white" , fontSize: '1.3vmax', fontWeight: 650, letterSpacing: ".2vmax" }}
                        > <AccountTreeIcon sx={{ mr:"1rem" }} />
                        UML Lab
                    </Button>
                    <PageButtons IndependentPageButtons={IndependentPageButtons} umlText={umlText} diagram={diagram} />
                    <UserMenu />
                </Toolbar>
                </Container>
            </AppBar>
        </HideOnScroll>
    );
};

export default NavBar;