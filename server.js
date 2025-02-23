const express = require('express');
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('TA_CLÉ_API');  // Remplace par ta clé API NewsAPI
const app = express();

app.get('/acquisitions', (req, res) => {
  // Utilisation de NewsAPI sans axios
  newsapi.v2.everything({
    q: 'acquisition OR contrat', // Recherche d'articles sur l'acquisition ou le contrat
    language: 'fr',               // Recherche en français
  })
  .then(response => {
    res.json(response.articles);  // Renvoyer les articles trouvés
  })
  .catch(error => {
    res.status(500).send('Erreur lors de la récupération des nouvelles');
  });
});

// Utilisation de process.env.PORT pour Glitch
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
