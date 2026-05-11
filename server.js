const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const client_id = 'cfeb7e02981d4195b335a0f7045528ca';
const client_secret = '927c4bfa6e584eff817523da46f28eca';

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});