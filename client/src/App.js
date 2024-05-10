/**
 * @module client/app
 * @description Provides the App component class
 */

import React, { Component } from 'react'
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Query from './pages/Query'
import Dashboard from './pages/Dashboard';

/**
 * The App component uses the React router to switch among the pages of 'Home', 'Signup', 'Login', 'Query', and 'Dashboard'.
 * @memberof module:client/app
 */
class App extends Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route
            exact path={"/"}
            element = {<Home />}
          />
          <Route
            exact path={"/signup"}
            element = {<Signup />}
          />
          <Route
            exact path={"/login"}
            element = {<Login />}
          />
          <Route
            exact path={"/query"}
            element = {<Query />}
          />
          <Route
            exact path={"/dashboard"}
            element = {<Dashboard />}
          />
        </Routes>
      </Router>
    );
  };
};

export default App