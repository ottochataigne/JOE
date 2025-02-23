const express = require('express');
const app = express();

// Route principale
app.get('/', (req, res) => {
  res.send('Bienvenue sur ton agent de nouvelles financières!');
});

// Serveur écoutant sur le port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Le serveur est en fonctionnement sur le port ${PORT}`);
});
const axios = require('axios');

// Route pour récupérer les nouvelles
app.get('/news', async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything?q=acquisition&apiKey=YOUR_API_KEY');
    const articles = response.data.articles;
    res.json(articles); // Retourne les articles en format JSON
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la récupération des nouvelles.');
  }
});
