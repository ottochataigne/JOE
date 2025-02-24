require('dotenv').config(); // Charge les variables d'environnement à partir du fichier .env

const express = require('express');
const Twilio = require('twilio');
const fetch = require('node-fetch');
const cron = require('node-cron');

const app = express();

// Utilisation des variables d'environnement
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeyNews = process.env.NEWS_API_KEY;
const apiKeyAlphaVantage = process.env.ALPHA_VANTAGE_API_KEY;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const userPhoneNumber = process.env.USER_PHONE_NUMBER;

const client = new Twilio(accountSid, authToken);

// Fonction pour récupérer les nouvelles avec des mots-clés spécifiques
async function getNews() {
  const query = '(New venture OR "Contrat à long terme" OR "Deal signé" OR "Entreprise acquise" OR "Merger agreement" OR Acquisition OR "Acheté par" OR "Nouveau méga-contrat" OR "New mega-contract" OR "Levée de fonds record" OR "Strategic acquisition" OR "Major contract" OR "Long-term supply contract" OR "Record fundraising")';
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKeyNews}`;

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
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${companyName}&apikey=${apiKeyAlphaVantage}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

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
      // Envoi de la notification via Twilio
      client.messages
        .create({
          body: `Nouveau contrat ou acquisition: ${latestArticle.title}\nEntreprise: ${companyName}\n${latestArticle.url}`,
          from: twilioPhoneNumber,  // Numéro Twilio acheté
          to: userPhoneNumber,     // Ton numéro
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
      from: twilioPhoneNumber,  // Numéro Twilio acheté
      to: userPhoneNumber,     // Ton numéro
    })
    .then(message => {
      res.send(`Message envoyé avec succès : ${message.sid}`);
    })
    .catch(error => {
      res.status(500).send(`Erreur lors de l'envoi du message : ${error.message}`);
    });
});

// Route par défaut pour la racine
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API de notifications avec Twilio!');
});

// Définir le port dynamiquement
const PORT = process.env.PORT || 3000;

// Lancer le serveur sur le port dynamique
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
