import fs from 'fs';
import * as core from '@actions/core';
import JSON5 from 'json5';
import fetch from 'node-fetch';

/*
 * Return access token for OneLogin API
 */
const getAccessToken = async (baseUrl, clientId, secret) => {
  const resp = await fetch(
    `${baseUrl}/auth/oauth2/v2/token`,
    {
      method: 'post',
      body: JSON.stringify({ grant_type: 'client_credentials' }),
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return resp.json().then(({ access_token: token }) => token);
};

/*
 * Fetch user by username
 */
const findUserByUsername = async (baseUrl, token, username, fields) => {
  const params = new URLSearchParams({ username, fields });

  const resp = await fetch(
    `${baseUrl}/api/2/users?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return resp.json().then(([user]) => user);
};

/*
 * Update user by id
 */
const updateUser = async (baseUrl, token, id, fields) => {
  const resp = await fetch(
    `${baseUrl}/api/2/users/${id}`,
    {
      method: 'put',
      body: JSON.stringify(fields),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const { statusCode, message } = await resp.json();
  if (statusCode && statusCode >= 400) {
    throw Error(message);
  }
};

try {
  const apiClientId = core.getInput('apiClientId', { required: true });
  const apiSecret = core.getInput('apiSecret', { required: true });
  const apiRegion = core.getInput('apiRegion', { required: true });
  const valuesFilePath = core.getInput('valuesFilePath', { required: true });
  const valuesFileFormat = core.getInput('valuesFileFormat') || 'json5';

  if (valuesFileFormat !== 'json5') {
    throw new Error('valuesFileFormat could be only "json5"!');
  }

  const baseUrl = `https://api.${apiRegion}.onelogin.com`;
  const token = await getAccessToken(baseUrl, apiClientId, apiSecret);
  const values = JSON5.parse(fs.readFileSync(valuesFilePath, 'utf8'));
  for (const { username, ...customFields } of values) {
    const user = await findUserByUsername(baseUrl, token, username, 'id,custom_attributes');
    const { id, custom_attributes: existingFields } = user;
    const hasChanges = Object.entries(customFields).some(([key, value]) => existingFields[key] !== value);
    if (!hasChanges) {
      core.info(`Skipping update for ${username}. Custom fields already in sync!`);
      continue;
    }

    await updateUser(baseUrl, token, id, { custom_attributes: customFields });
    core.info(`Custom fields for ${username} has been updated!`);
  }
} catch (error) {
  core.setFailed(error.message);
}
