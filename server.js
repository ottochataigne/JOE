const express = require('express');
const Twilio = require('twilio');
const fetch = require('node-fetch');
const cron = require('node-cron');

const app = express();

// Remplace ces valeurs par tes informations Twilio
const accountSid = 'AC5afe0cb4a5249684e633514aa2d7b526';  // Assure-toi que l'Account SID commence par 'AC'
const authToken = 'b654dc1b76b103e40d0d2a125d326467';

const client = new Twilio(accountSid, authToken);

// Fonction pour récupérer les nouvelles
async function getNews() {
  const apiKey = 'ton_API_KEY';  // Remplace par ta clé API News
  const url = `https://newsapi.org/v2/everything?q=acquisition%20contract&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok') {
      return data.articles; // Retourne les articles trouvés
    } else {
      throw new Error('Problème avec l\'API News');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des nouvelles :', error);
    return [];
  }
}

// Planifier une tâche toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('Récupération des nouvelles...');
  
  const articles = await getNews();
  if (articles.length > 0) {
    const latestArticle = articles[0]; // On prend le premier article de la liste

    // Envoie de la notification via Twilio
    client.messages
      .create({
        body: `Nouveau contrat ou acquisition: ${latestArticle.title}\n${latestArticle.url}`,
        from: '+13308827147',  // Numéro Twilio acheté
        to: '+33601172634',    // Ton numéro
      })
      .then(message => {
        console.log('Notification envoyée:', message.sid);
      })
      .catch(error => {
        console.error('Erreur lors de l\'envoi du message :', error.message);
      });
  } else {
    console.log('Aucune nouvelle trouvée.');
  }
});

// Route pour envoyer une notification de test
app.get('/send-notification', (req, res) => {
  client.messages
    .create({
      body: 'Voici ta notification de test',
      from: '+13308827147',  // Numéro Twilio acheté
      to: '+33601172634',  // Ton numéro WhatsApp
    })
    .then(message => {
      res.send(`Message envoyé avec succès : ${message.sid}`);
    })
    .catch(error => {
      res.status(500).send(`Erreur lors de l'envoi du message : ${error.message}`);
    });
});

// Essayer d'écouter sur un autre port en cas de conflit
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}).on('error', (err) => {
  console.error('Erreur:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`Le port ${PORT} est déjà utilisé. Essayer un autre port...`);
    setTimeout(() => {
      app.listen(3003, () => {
        console.log('Serveur redémarré sur le port 3003');
      });
    }, 1000);
  }
});
