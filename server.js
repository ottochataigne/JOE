const express = require('express');
const Twilio = require('twilio');

const app = express();

// Remplace ces valeurs par tes informations Twilio
const accountSid = 'AC5afe0cb4a5249684e633514aa2d7b526';  // Assure-toi que l'Account SID commence par 'AC'
const authToken = 'b654dc1b76b103e40d0d2a125d326467';

const client = new Twilio(accountSid, authToken);

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
const PORT = process.env.PORT || 3001;

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