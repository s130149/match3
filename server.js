const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const client_id = 'cfeb7e02981d4195b335a0f7045528ca';
const client_secret = '927c4bfa6e584eff817523da46f28eca';
const redirectUri = 'http://127.0.0.1:3000/';

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

app.post('/api/token', async (req, res) => {
    const { code, code_verifier } = req.body;

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: code_verifier
        })
    });

    const data = await response.json();
    res.json(data);
});