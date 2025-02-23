// server.js
const express = require('express');
const NewsAPI = require('newsapi');  // Utilisation de la bibliothèque officielle NewsAPI
const newsapi = new NewsAPI('TA_CLÉ_API');  // Remplace 'TA_CLÉ_API' par ta vraie clé API NewsAPI
const twilio = require('twilio');  // Intégration de Twilio pour l'envoi de WhatsApp

const app = express();

// Ton SID et Auth Token Twilio (obtenus depuis le dashboard Twilio)
const accountSid = 'TON_ACCOUNT_SID'; // Remplace par ton Account SID
const authToken = 'TON_AUTH_TOKEN';   // Remplace par ton Auth Token
const client = twilio(accountSid, authToken);

// Numéro WhatsApp de Twilio et ton numéro WhatsApp (remplace-les par tes numéros)
const twilioWhatsAppNumber = 'whatsapp:+14155238886';  // Ton numéro Twilio WhatsApp
const userWhatsAppNumber = 'whatsapp:+TON_NUMERO';      // Ton numéro WhatsApp

// Fonction pour envoyer un message WhatsApp via Twilio
const sendWhatsAppNotification = (article) => {
  const message = `Nouvelle acquisition/fusion/contrat détectée :\n\nTitre: ${article.title}\nURL: ${article.url}`;

  client.messages.create({
    from: twilioWhatsAppNumber,
    to: userWhatsAppNumber, // Envoi à ton numéro WhatsApp
    body: message,
  })
  .then(message => console.log('Message envoyé :', message.sid))
  .catch(error => console.error('Erreur lors de l\'envoi du message:', error));
};

// Fonction pour récupérer les dernières nouvelles
const fetchNews = () => {
  newsapi.v2.everything({
    q: 'acquisition OR contrat OR fusion',  // Recherche d'articles sur les acquisitions, fusions ou contrats
    language: 'fr',                       // Recherche en français
    sortBy: 'publishedAt',                // Trier les résultats par date de publication
  })
  .then(response => {
    const articles = response.articles;
    if (articles.length > 0) {
      articles.forEach(article => {
        console.log(`Nouveau article trouvé : ${article.title}`);
        sendWhatsAppNotification(article);  // Envoie la notification WhatsApp
      });
    } else {
      console.log('Aucun nouvel article trouvé.');
    }
  })
  .catch(error => {
    console.error('Erreur lors de la récupération des nouvelles', error);
  });
};

// Exécuter la fonction au démarrage du serveur
fetchNews();

// Utiliser setInterval pour vérifier toutes les 30 minutes (1800000 ms)
setInterval(fetchNews, 1800000);  // Vérifier toutes les 30 minutes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
