// Esta función ha sido migrada a Firebase Cloud Functions nativas.
export const handler = async () => {
  return {
    statusCode: 200,
    body: "Esta función ha sido migrada a Firebase Cloud Functions. Por favor, desactiva este Cron Job en Netlify/Fastcron.",
  };
};
