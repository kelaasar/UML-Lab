/**
 * @module client/login
 * @description Provides the Login component class
 */

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../redux/user';
import {TextField} from "@mui/material";
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import NavBar from './NavBar';
import axios from 'axios';
import firebase from '../firebase';
import LoadingButton from '@mui/lab/LoadingButton';

/**
 * The Login component allows users to log in to their accounts with an email and password or via Google OAuth.
 * @memberof module:client/login
 */
const Login = () => {
    const dispatch = useDispatch();
    
    const [email,setEmail] = useState('');
    const [password,SetPassword] =useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [emailerror,setEmailerror] = useState(false);
    const [passworderror,SetPassworderror] =useState(false);
    const [emailerrorMsg,setEmailerrorMsg] = useState('');
    const [passworderrorMsg,SetPassworderrorMsg] =useState('');
    const body = { email: email, password:password };
    const [normalLoading, setNormalLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();

    const handleValidation = () => {
        var valid = true;
        setEmailerrorMsg('');
        SetPassworderrorMsg('');
        setEmailerror(false);
        SetPassworderror(false);
        const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === '') {
            setEmailerror(true);
            setEmailerrorMsg('Please enter an email');
            valid = false;
        }
        else if (!emailRegEx.test(email)) {
            setEmailerror(true);
            setEmailerrorMsg('Invalid email address');
            valid = false;
        }
        if (password === '') {
            SetPassworderror(true);
            SetPassworderrorMsg('Please enter a password');
            valid = false;
        }
        else if (password.length < 6) {
            SetPassworderror(true);
            SetPassworderrorMsg('Invalid password');
            valid = false;
        }
        return valid;
    };
    const handleLogIn = async () => {
        setNormalLoading(true);
        if (!handleValidation()) {
            setNormalLoading(false);
            return;
        }
        try {
            const res = await axios.post('http://localhost:4000/login', body);
            setNormalLoading(false);
            dispatch(login(res.data.user.uid));
            navigate("/");
        }
        catch (error) {
            setNormalLoading(false);
            // If the request encounters an error (status code outside 2xx range)
            console.error('Error:', error.message, 'with', error);
            setEmailerror(true);
            setEmailerrorMsg('Invalid email address or password');
            SetPassworderror(true);
            SetPassworderrorMsg('Invalid email address or password');
        }
    };

    const handleGoogleLogIn = async () => {
        setGoogleLoading(true);
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            const userId = user.uid;
            // Check if user exists in your database
            await axios.post('http://localhost:4000/google-login', { user: user, uid: userId });
            setGoogleLoading(false);
            dispatch(login(userId));
            navigate('/');
        }
        catch (error) {
            setGoogleLoading(false);
            if (error.response && error.response.status === 400 && error.response.data === "User does not exist") {
                await firebase.auth().currentUser.delete();
                setErrorMessage('User does not exist. Please sign up instead.');
            } else {
                setErrorMessage('An error occurred. Please try again.');
            }
        }
    };

    return (
        <div> 
            <NavBar />  
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 15,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginBottom: 10,
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'primary.main' , width: 48, height: 48 }}>
                        <AccountTreeIcon />
                    </Avatar>
                    <Typography component="h1" variant="h4" sx = {{marginTop: 3}}>
                        Sign in
                    </Typography>
                    <Box component="form"  noValidate sx={{ mt: 5 }}>
                        <TextField
                            inputProps={{ "data-testid": "email-box" }}
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value = {email}
                            onChange = {(e) => setEmail(e.target.value)}
                            error={emailerror}
                            helperText={emailerrorMsg}
                        />
                        <TextField
                            inputProps={{ "data-testid": "password-box" }}
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value = {password}
                            onChange = {(e) => SetPassword(e.target.value)}
                            error={passworderror}
                            helperText={passworderrorMsg}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleLogIn();
                                }
                            }}
                        />
                        <LoadingButton
                            type="button"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 5, mb: 2 }}
                            onClick={handleLogIn}
                            loading={normalLoading}
                        >
                            Sign In
                        </LoadingButton>
                        <LoadingButton
                            type="button"
                            fullWidth
                            variant="contained"
                            sx={{mt: 1, mb: 2}}
                            onClick={handleGoogleLogIn}
                            loading={googleLoading}
                        >
                            Sign In with Google
                        </LoadingButton>
                        <p style={{color: 'red'}}>
                            {errorMessage}
                        </p>
                        <Grid container justifyContent="flex-end">
                            <Grid item>
                                <Link to ="/signup">
                                    {"Don't have an account? Sign Up"}
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Container>
        </div>
    );
};

export default Login;