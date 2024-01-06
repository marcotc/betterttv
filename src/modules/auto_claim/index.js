import debounce from 'lodash.debounce';
import {AutoClaimFlags, PlatformTypes, SettingIds} from '../../constants.js';
import domObserver from '../../observers/dom.js';
import settings from '../../settings.js';
import {hasFlag} from '../../utils/flags.js';
import {loadModuleForPlatforms} from '../../utils/modules.js';
import twitch from '../../utils/twitch.js';
import watcher from '../../watcher.js';

const AUTO_CLAIM_SELECTOR = '.inventory-max-width';
const AUTO_CLAIM_BUTTON_SELECTOR = `${AUTO_CLAIM_SELECTOR} button[class*="ScCoreButtonPrimary"]`;

let autoClaimListener;

// HERE!
document.querySelector(".onsite-notifipcations .onsite-notifications__badge") 

function handleClaim(node) {
  const autoClaim = settings.get(SettingIds.AUTO_CLAIM);

  const eligibleEventTypes = [];
  if (hasFlag(autoClaim, AutoClaimFlags.DROPS)) {
    eligibleEventTypes.push('drop');
  }

  const event = twitch.getPrivateCalloutEvent(node);
  if (event == null || !eligibleEventTypes.includes(event.type)) {
    return;
  }

  document.querySelectorAll(AUTO_CLAIM_BUTTON_SELECTOR).forEach(claimButton => claimButton.click());
}

const handleClaimDebounced = debounce(handleClaim, 1000);

class AutoClaimModule {
  constructor() {
    watcher.on('load.inventory', () => this.load());
    settings.on(`changed.${SettingIds.AUTO_CLAIM}`, () => this.load());
  }

  load() {
    const autoClaim = settings.get(SettingIds.AUTO_CLAIM);
    const autoClaimDrops = hasFlag(autoClaim, AutoClaimFlags.DROPS);
    const shouldAutoClaim = autoClaimDrops;

    if (!shouldAutoClaim && autoClaimListener != null) {
      autoClaimListener();
      autoClaimListener = undefined;
    } else if (shouldAutoClaim && autoClaimListener == null) {
      autoClaimListener = domObserver.on(AUTO_CLAIM_SELECTOR, (node, isConnected) => {
        if (!isConnected) return;
        handleClaimDebounced(node);
      });
    }
  }
}

export default loadModuleForPlatforms([PlatformTypes.TWITCH, () => new AutoClaimModule()]);
