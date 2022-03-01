import { BackgroundProxy } from '../messaging';

const proxy = new BackgroundProxy();

setTimeout(() => {
  proxy
    .preflightMethodCall({ method: 'eth_sign', params: [1, 2, 3, 4] })
    .then(console.log);
}, 1000);
