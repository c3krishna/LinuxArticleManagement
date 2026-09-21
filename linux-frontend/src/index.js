import React from 'react';

import ReactDOM from 'react-dom/client';

import './index.css';

import App from './App';

import {

    GoogleOAuthProvider

} from '@react-oauth/google';

const root = ReactDOM.createRoot(

    document.getElementById('root')
);

root.render(

    <GoogleOAuthProvider

        clientId="1035748293148-r8ornln6p7r54r5iu2u5059os3ddg99t.apps.googleusercontent.com"

    >

        <App />

    </GoogleOAuthProvider>
);
