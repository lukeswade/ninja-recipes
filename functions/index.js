const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from functions scaffold' });
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Functions scaffold listening on ${port}`));
