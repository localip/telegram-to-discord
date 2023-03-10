import { TelegramClient } from 'telegram';
import input from 'input';

import { ClientOptions, SessionName } from '@constants';
import config from '@config';

class Client extends TelegramClient {
  constructor() {
    super(SessionName, config.api.id, config.api.hash, ClientOptions);
  }

  async initialize() {
    await this.start({
      phoneNumber: config.phone,
      password: async () => input.text('Please enter your password: '),
      phoneCode: async () => input.text('Please enter the code you received: '),
      onError: (e) => console.error('Failed to log in:', e.message),
    });

    this._log.info('Successfully logged in.');

    import('@src/events');
  }
}

export default new Client();