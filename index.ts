import express from 'express';

const app = express();
const port = process.env.PORT || 8080; // default port to listen

app.get('/', (req, res) => {
  res.send('Hi, there!');
});

app.listen(port, () => {
  console.log(`listening on port: ${port}`);
});
