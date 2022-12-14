require('dotenv').config();
const auth = require('@adobe/jwt-auth');
const Reactor = require('@adobe/reactor-sdk').default;
const fs = require('fs');

const { CLIENTID, CLIENTSECRET, TECHNICALACCOUNTID, ORGID, METASCOPES, SANDBOX } = process.env;

const config = {
  clientId: CLIENTID,
  clientSecret: CLIENTSECRET,
  technicalAccountId: TECHNICALACCOUNTID,
  orgId: ORGID,
  privateKey: fs.readFileSync('private.key'),
  metaScopes: METASCOPES,
};

const buildReactor = async (token, options) =>
  Promise.resolve(new Reactor(token, options)).catch(error => {
    logger.error(error);
  });

module.exports = async () => {
  const { access_token: accessToken,
    expires_in: expiresIn,
    token_type: tokenType,
  } = await auth(config).catch(e => {
    throw new Error(`Error creating connection check .env for correct credentials`);
  });

  const reactor = await buildReactor(accessToken, { enableLogging: false, }).catch(e => {
    throw new Error(`Error building reactor, check accessToken from created connection`)
  });

  return {
    reactor,
  };
};
