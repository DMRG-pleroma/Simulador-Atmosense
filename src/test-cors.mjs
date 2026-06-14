import https from 'https';
https.get('https://apitempo.inmet.gov.br/estacoes/T', (res) => {
  console.log(res.headers);
});
