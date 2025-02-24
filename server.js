const express = require('express');
const Twilio = require('twilio');
const fetch = require('node-fetch');
const cron = require('node-cron');

const app = express();

// Remplace ces valeurs par tes informations Twilio
const accountSid = 'AC5afe0cb4a5249684e633514aa2d7b526'; // Assure-toi que l'Account SID commence par 'AC'
const authToken = 'b654dc1b76b103e40d0d2a125d326467';

const client = new Twilio(accountSid, authToken);

// Fonction pour récupérer les nouvelles avec des mots-clés spécifiques
async function getNews() {
  const apiKey = 'c3756f69184c414abfe988f21e1580ea';  // Remplace par ta clé API News
  const query = '(New venture OR "Contrat à long terme" OR "Deal signé" OR "Entreprise acquise" OR "Merger agreement" OR Acquisition OR "Acheté par" OR "Nouveau méga-contrat" OR "New mega-contract" OR "Levée de fonds record" OR "Strategic acquisition" OR "Major contract" OR "Long-term supply contract" OR "Record fundraising")';
  
  // Requête API avec des mots-clés spécifiques
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;

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

// Fonction pour extraire le nom de l'entreprise à partir du titre de l'article
function extractCompanyName(title) {
  const companyRegex = /\b[A-Z][A-Za-z0-9&\.\-]*\b/g;
  const companies = title.match(companyRegex);
  
  if (companies && companies.length > 0) {
    return companies[0]; // Prend le premier nom trouvé
  }
  return 'Entreprise inconnue';
}

// Fonction pour vérifier si une entreprise est cotée en bourse via Alpha Vantage
async function isCompanyListed(companyName) {
  const apiKey = 'L6KAZT0R76QGAK5Q';  // Remplace par ta clé API Alpha Vantage
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${companyName}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Vérifie si la société est cotée en bourse
    if (data['Global Quote'] && data['Global Quote']['01. symbol']) {
      return true;  // La société est cotée en bourse
    } else {
      return false;  // La société n'est pas cotée
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la société cotée en bourse :', error);
    return false;
  }
}

// Planifier une tâche toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('Récupération des nouvelles...');

  const articles = await getNews();
  if (articles.length > 0) {
    const latestArticle = articles[0];  // On prend le premier article de la liste

    // Extraire le nom de l'entreprise
    const companyName = extractCompanyName(latestArticle.title);

    // Vérifier si l'entreprise est cotée en bourse
    const isListed = await isCompanyListed(companyName);

    // Si l'entreprise est cotée en bourse, on envoie la notification
    if (isListed) {
      // Envoie de la notification via Twilio
      client.messages
        .create({
          body: `Nouveau contrat ou acquisition: ${latestArticle.title}\nEntreprise: ${companyName}\n${latestArticle.url}`,
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
      console.log(`L'entreprise ${companyName} n'est pas cotée en bourse.`);
    }
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

// Définir le port dynamiquement
const PORT = process.env.PORT || 3000;

function startServer(port) {
  app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
  }).on('error', (err) => {
    console.error('Erreur:', err);
    if (err.code === 'EADDRINUSE') {
      console.log(`Le port ${port} est déjà utilisé. Essayer un autre port...`);
      // Essayer un autre port dynamique
      const newPort = port + 1; // Choisir un port supérieur, ou tu peux rajouter une logique ici pour choisir un autre port.
      setTimeout(() => {
        startServer(newPort);
      }, 1000);
    }
  });
}

// Lancer le serveur sur le port initial
startServer(PORT);
