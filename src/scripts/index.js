import '../styles/main.css';

import { LoaderOverlay } from './components/loader-overlay.js';
import { Router } from './routes/router.js';

// eslint-disable-next-line no-undef
const path = nw.require('path');
// eslint-disable-next-line no-undef
const { execFile } = nw.require('child_process');

const loaderOverlay = new LoaderOverlay();
loaderOverlay.toggle({ message: 'Loading Application Components...' });

const router = new Router();
router.disableBackButton();

const basePath = process.env.INIT_CWD ?? process.cwd();
const APIExecutablePath = path.join(basePath, 'bin', 'EMGTrignoAPI', 'EMGTrignoAPI.exe');

execFile(APIExecutablePath, error => {
  if (error) {
    sessionStorage.setItem(
      'app-error',
      JSON.stringify({
        message: 'Some required components cannot be launched',
        details: error.message
      })
    );
  }
});

setTimeout(() => {
  router.switchPage('data-discovering');
}, 3000);
