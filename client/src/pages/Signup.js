/**
 * @module client/signup
 * @description Provides the Signup component class
 */

import React , {useState} from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../redux/user';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TextField from '@mui/material/TextField';
import NavBar from './NavBar';
import axios from 'axios';
import firebase from '../firebase';
import LoadingButton from '@mui/lab/LoadingButton';

/**
 * The Signup component allows users to sign up for an account with an email and password or via Google OAuth.
 * @memberof module:client/signup
 */
const Signup = () => {
    const dispatch = useDispatch();

    const [email, setEmail] = useState('');
    const [password, SetPassword] =useState('');
    const [conPassword, SetConPassword] =useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [emailerror, setEmailerror] = useState(false);
    const [passworderror, SetPassworderror] =useState(false);
    const [conPassworderror, SetConPassworderror] =useState(false);
    const [emailerrorMsg, setEmailerrorMsg] = useState('');
    const [passworderrorMsg, SetPassworderrorMsg] =useState('');
    const [conPassworderrorMsg, SetConPassworderrorMsg] =useState('');
    const [normalLoading, setNormalLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const body = { email: email, password: password, confirmPassword: conPassword };
    const navigate = useNavigate();

    const handleValidation = () => {
        setEmailerror(false);
        SetPassworderror(false);
        SetConPassworderror(false);
        setEmailerrorMsg('');
        SetPassworderrorMsg('');
        SetConPassworderrorMsg('');
        var valid = true;
        if (password === '') {
            SetPassworderror(true);
            SetPassworderrorMsg('Please enter a password');
            valid = false;
        }
        if (conPassword === '') {
            SetConPassworderror(true);
            SetConPassworderrorMsg('Please confirm your password');
            valid = false;
        }
        const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegEx.test(email)) {
            setEmailerror(true);
            setEmailerrorMsg('Invalid email address');
            valid = false;
        }
        if (password.length < 6) {
            SetPassworderror(true);
            SetPassworderrorMsg('Password must be at least 6 characters');
            valid = false;
        }
        if (conPassword !== password) {
            SetConPassworderror(true);
            SetConPassworderrorMsg('Confirm password does not match your password')
            valid = false;
        }

        return valid;
    };

    const handleSignup = async () => {
        setNormalLoading(true);
        if (!handleValidation()) {
            setNormalLoading(false);
            return;
        }
        try {
            const res = await axios.post('http://localhost:4000/signup', body);
            setNormalLoading(false);
            dispatch(login(res.data.user.uid))
            navigate("/");
        }
        catch (error) {
            setNormalLoading(false);
            // If the request encounters an error (status code outside 2xx range)
            console.error('Error:', error.message,'with',error.response.data.message);
            if (error.response.data.message) {
                setEmailerror(true);
                setEmailerrorMsg(error.response.data.message);
            }
        }
    };

    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            const userId = user.uid;

            await axios.post('http://localhost:4000/google-signup', { uid: userId, email: user.email });
            setGoogleLoading(false);
            dispatch(login(userId));
            navigate('/');
        }
        catch (error) {
            setGoogleLoading(false);
            if (error.response && error.response.status === 400 && error.response.data === "User already exists.") {
                setErrorMessage('User already exists. Please sign in instead.');
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
                    <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 48, height: 48  }}>
                        <AccountTreeIcon />
                    </Avatar>
                    <Typography component="h1" variant="h4" sx ={{mt: 3}}>
                        Sign up
                    </Typography>
                    <Box component="form" noValidate  sx={{ mt: 5 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    inputProps={{ "data-testid": "email-box" }}
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                    value = {email}
                                    onChange = {(e) => setEmail(e.target.value)}
                                    error={emailerror}
                                    helperText={emailerrorMsg}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    inputProps={{ "data-testid": "password-box" }}
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="new-password"
                                    value = {password}
                                    onChange = {(e) => SetPassword(e.target.value)}
                                    error={passworderror}
                                    helperText={passworderrorMsg}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    inputProps={{ "data-testid": "cpassword-box" }}
                                    required
                                    fullWidth
                                    name="confirmpassword"
                                    label="Confirm Password"
                                    type="password"
                                    id="confirmpassword"
                                    autoComplete="new-password"
                                    value = {conPassword}
                                    onChange = {(e) => SetConPassword(e.target.value)}
                                    error={conPassworderror}
                                    helperText={conPassworderrorMsg}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSignup();
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                        <LoadingButton
                            type="button"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 5, mb: 2 }}
                            onClick={handleSignup}
                            loading={normalLoading}
                        >
                            Sign Up
                        </LoadingButton>
                        <LoadingButton
                            type="button"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 1, mb: 2 }}
                            onClick={handleGoogleSignup}
                            loading={googleLoading}
                        >
                            Sign Up with Google
                        </LoadingButton>
                        <p style={{ color: 'red' }}>
                            {errorMessage}
                        </p>
                        <Grid container justifyContent="flex-end">
                            <Grid item>
                                <Link to ="/login">
                                    Already have an account? Sign in
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Container>
        </div>
    );
};

export default Signup;