const express = require('express');
const Twilio = require('twilio');

const app = express();

// Remplace ces valeurs par tes informations Twilio
const accountSid = 'AC5afe0cb4a5249684e633514aa2d7b526';  // Assure-toi que l'Account SID commence par 'AC'
const authToken = 'TON_AUTH_TOKEN';

const client = new Twilio(accountSid, authToken);

app.get('/send-notification', (req, res) => {
  client.messages
    .create({
      body: 'Voici ta notification de test',
      from: 'TON_NUMERO_TWILIO',  // Numéro Twilio acheté
      to: 'TON_NUMERO_WHATSAPP',  // Ton numéro WhatsApp
    })
    .then(message => {
      res.send(`Message envoyé avec succès : ${message.sid}`);
    })
    .catch(error => {
      res.status(500).send(`Erreur lors de l'envoi du message : ${error.message}`);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
