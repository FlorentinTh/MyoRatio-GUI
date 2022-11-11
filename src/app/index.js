// eslint-disable-next-line no-undef
const os = nw.require('os');
// eslint-disable-next-line no-undef
const path = nw.require('path');
// eslint-disable-next-line no-undef
const exec = nw.require('child_process').execFile;

const loaderOverlay = document.getElementById('loader-overlay');

function toggleLoaderOverlay() {
  loaderOverlay.classList.toggle('not-visible');
  loaderOverlay.classList.toggle('overlay-animate');
}

const openNavBtn = document.querySelector('.open-nav');

function toggleMenu() {
  document.querySelector('body').classList.toggle('nav-open');
  document.querySelector('nav').classList.toggle('open');
  document.querySelector('.content').classList.toggle('open');
  openNavBtn.classList.toggle('open');
}

openNavBtn.addEventListener('click', () => {
  toggleMenu();
});

// ----------------------

const hpfConverterLink = document.getElementById('hpf-converter');
const basePath = process.cwd();
const delsysExecutablePath = path.join(basePath, 'bin', 'DelsysFileUtil.exe');

hpfConverterLink.addEventListener('click', () => {
  toggleMenu();

  exec(delsysExecutablePath, (err, data) => {
    if (err) {
      console.error(err);
    }

    if (data) {
      console.log(data);
    }
  });
});

// ---------------------

const folderInput = document.querySelector('.folder-input');
const dropArea = document.querySelector('.folder-drop-area');
const chooseBtn = document.querySelector('.choose-btn');
const folderMsg = document.querySelector('.folder-msg');

folderInput.setAttribute('nwworkingdir', os.homedir());

function toggleDropAreaActive() {
  dropArea.classList.toggle('is-active');
  chooseBtn.classList.toggle('is-active');
  folderMsg.classList.toggle('is-active');
}

folderInput.addEventListener('dragenter', () => {
  toggleDropAreaActive();
});

folderInput.addEventListener('dragleave', () => {
  toggleDropAreaActive();
});

folderInput.addEventListener('drop', () => {
  toggleDropAreaActive();
});

const submitBtn = document.querySelector('button[type="submit"]');
const windowSizeInput = document.getElementById('window-size');

windowSizeInput.addEventListener('input', event => {
  const value = event.target.value;

  if (!(value === '') && value > 0) {
    if (submitBtn.disabled && folderInput.files.length > 0) {
      submitBtn.removeAttribute('disabled');
    }
  } else {
    if (!submitBtn.disabled) {
      submitBtn.setAttribute('disabled', '');
    }
  }
});

folderInput.addEventListener('change', event => {
  if (event && event.target.files.length > 0) {
    const folder = event.target.files[0];

    folderMsg.innerHTML = `selected folder path is <br> ${folder.path}`;

    if (
      submitBtn.disabled &&
      !(windowSizeInput.value === '') &&
      windowSizeInput.value > 0
    ) {
      submitBtn.removeAttribute('disabled');
    }
  } else {
    folderMsg.innerHTML = `or drag and drop the folder here`;

    if (!submitBtn.disabled) {
      submitBtn.setAttribute('disabled', '');
    }
  }
});

submitBtn.addEventListener('click', () => {
  if (!submitBtn.disabled) {
    toggleLoaderOverlay();

    setTimeout(() => {
      window.history.pushState('', '', window.location.href);
      window.location.replace(decodeURI('data.html'));
    }, 5000);
  }
});
