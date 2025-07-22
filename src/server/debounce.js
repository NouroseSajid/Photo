import { broadcast, addLog, getClientCount } from '../shared/logStore.js';
import { CONFIG } from './config.js';

export const debouncedBroadcastRefresh = (() => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      broadcast({ type: 'refresh', timestamp: Date.now() });
      addLog(`Sent debounced refresh to ${getClientCount()} clients`);
    }, CONFIG.DEBOUNCE_DELAY);
  };
})();