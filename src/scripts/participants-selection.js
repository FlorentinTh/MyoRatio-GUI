import '../styles/participants-selection.css';
import participantCard from '../views/partials/participants-list/participant-card.hbs';
import emptyCard from '../views/partials/participants-list/empty-card.hbs';
import report from '../views/partials/pdf-report/report.hbs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { Menu } from './components/menu.js';
import { Router } from './routes/router.js';
import { LoaderOverlay } from './components/loader-overlay.js';
import { ErrorOverlay } from './components/error-overlay';
import { getAllParticipants } from './components/participants';
import { Metadata } from './utils/metadata.js';
import { PathHelper } from './helpers/path-helper.js';
import { StringHelper } from './helpers/string-helper';
import { Switch } from './utils/switch';
import { DOMElement } from './utils/dom-element';
import { SessionStore } from './utils/session-store';

const path = nw.require('path');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Toronto');

const router = new Router();
router.disableBackButton();

const loaderOverlay = new LoaderOverlay();

const menu = new Menu();

const additionalMenuButtons = document.querySelectorAll('[class^="export-"]');
menu.init(additionalMenuButtons);

const dataFolderPathSession = sessionStorage.getItem('data-path');
const analysisType = sessionStorage.getItem('analysis');

const stageSwitchRadios = Switch.init('stage');

const changeButton = document.getElementById('change-btn');
const exportPDFButton = document.querySelector('.export-pdf-btn');
const dataPath = document.getElementById('data-path');
const analysisTitle = document.querySelector('.analysis h3');
const previewButton = document.getElementById('btn-preview');
const selectButtonAll = document.getElementById('btn-all');
const selectButtonNotCompleted = document.getElementById('btn-not-completed');
const submitButton = document.querySelector('button[type="submit"]');
const participantsList = document.querySelector('ul.list');

dataPath.querySelector('p').innerText = ` ${
  sessionStorage.getItem('data-path') || 'ERROR'
}`;

analysisTitle.innerText += ` ${analysisType}`;

const analysisFolderPath = path.join(dataFolderPathSession, analysisType);
const sanitizedAnalysisFolderPath = PathHelper.sanitizePath(analysisFolderPath);
const participants = await getAllParticipants(sanitizedAnalysisFolderPath);
const metadata = new Metadata(dataFolderPathSession);

const participantsObject = [];
let selectedParticipants = [];

let participantItems;
let isAllSelected = false;
let isAllNotCompletedSelected = false;
let totalCompleted = 0;

const displayEmptyCard = () => {
  previewButton.setAttribute('disabled', '');
  selectButtonAll.setAttribute('disabled', '');
  selectButtonNotCompleted.setAttribute('disabled', '');

  for (const stageSwitchRadio of stageSwitchRadios) {
    stageSwitchRadio.setAttribute('disabled', '');

    if (stageSwitchRadio.checked) {
      stageSwitchRadio.checked = false;
    }
  }

  if ('stage' in sessionStorage) {
    sessionStorage.removeItem('stage');
  }

  participantsList.insertAdjacentHTML('afterbegin', emptyCard());
};

const displayParticipantCard = (participant, infos, stage) => {
  participantsList.insertAdjacentHTML(
    'afterbegin',
    participantCard({ participant, infos, stage })
  );
};

const renderParticipantsList = async () => {
  for (const participant of participants) {
    const participantName = StringHelper.formatParticipantName(participant);

    let infos;
    try {
      infos = await metadata.getParticipantInfo(
        PathHelper.sanitizePath(analysisType),
        participantName
      );
    } catch (error) {
      const errorOverlay = new ErrorOverlay({
        message: `Participant ${participant} cannot be processed`,
        details: error.message,
        interact: true
      });

      errorOverlay.show();
    }

    participantsObject.push({
      name: participant,
      infos
    });

    const stage = sessionStorage.getItem('stage');
    displayParticipantCard(participantName, infos, infos.stages[stage]);
  }
};

const toggleSubmitButton = () => {
  if (selectedParticipants.length > 0) {
    if (submitButton.disabled) {
      submitButton.removeAttribute('disabled');
    }
  } else {
    if (!submitButton.disabled) {
      submitButton.setAttribute('disabled', '');
    }
  }
};

const toggleSelectedParticipantStorage = () => {
  if (selectedParticipants.length > 0) {
    sessionStorage.setItem('selected-participants', selectedParticipants.join(','));
  } else {
    sessionStorage.removeItem('selected-participants');
  }
};

const disableNotRequiredButton = total => {
  if (total === participants.length) {
    selectButtonNotCompleted.setAttribute('disabled', '');
  } else if (!(total > 0)) {
    selectButtonAll.setAttribute('disabled', '');
  }
};

const selectParticipant = participantItem => {
  const participantName = participantItem
    .querySelector('.line-1')
    .innerText.toLowerCase();
  selectedParticipants.push(participantName.trim());
  participantItem.classList.toggle('selected');
};

const toggleSelectButtons = (selected, total, all = true) => {
  if (all) {
    const baseText = 'All';
    selectButtonAll.innerText = selected ? `Unselect ${baseText}` : baseText;
    isAllSelected = selected;
  } else {
    const baseText = 'Not Completed';
    selectButtonNotCompleted.innerText = selected ? `Unselect ${baseText}` : baseText;
    isAllNotCompletedSelected = selected;
  }

  if (selected) {
    if (all) {
      selectButtonNotCompleted.setAttribute('disabled', '');
    } else {
      selectButtonAll.setAttribute('disabled', '');
    }
  } else {
    if (all) {
      selectButtonNotCompleted.removeAttribute('disabled');
    } else {
      selectButtonAll.removeAttribute('disabled');
    }
  }

  disableNotRequiredButton(total);
};

const resetSelectButtons = () => {
  selectButtonAll.innerText = 'All';
  selectButtonNotCompleted.innerText = 'Not Completed';
  isAllSelected = false;
  isAllNotCompletedSelected = false;
  selectButtonNotCompleted.removeAttribute('disabled');
  selectButtonAll.removeAttribute('disabled');

  if (!(totalCompleted > 0)) {
    selectButtonAll.setAttribute('disabled', '');
  }
};

const initCard = items => {
  if ('selected-participants' in sessionStorage) {
    selectedParticipants = sessionStorage.getItem('selected-participants').split(',');
  }

  toggleSubmitButton();

  for (const participantItem of items) {
    if (participantItem.classList.contains('completed')) {
      totalCompleted++;
    }

    const participantName = participantItem
      .querySelector('.line-1')
      .innerText.toLowerCase();

    participantItem.querySelector('.content').addEventListener('click', () => {
      if (participantItem.classList.contains('selected')) {
        selectedParticipants = selectedParticipants.filter(
          participant => participant !== participantName.trim()
        );
      } else {
        selectedParticipants.push(participantName.trim());
      }

      participantItem.classList.toggle('selected');

      toggleSubmitButton();
      toggleSelectedParticipantStorage();
    });

    const resultsButton = participantItem.querySelector('.actions > button');

    if (!(resultsButton === null)) {
      resultsButton.addEventListener('click', () => {
        loaderOverlay.toggle({ message: 'Preparing results...' });
        sessionStorage.setItem('participant-result', participantName.trim());
        setTimeout(() => {
          router.switchPage('results');
        }, 1000);
      });
    }
  }

  disableNotRequiredButton(totalCompleted);
};

if (!(participants?.length > 0)) {
  participantsList.classList.add('empty');
  displayEmptyCard();
} else {
  participantItems = document.querySelector('ul.list').children;
  await renderParticipantsList();

  for (const stageSwitchRadio of stageSwitchRadios) {
    stageSwitchRadio.addEventListener(
      'change',
      async event => {
        DOMElement.clear(participantsList);
        participantsList.parentElement.classList.add('change');

        setTimeout(async () => {
          selectedParticipants = [];
          totalCompleted = 0;
          toggleSelectedParticipantStorage();
          await renderParticipantsList();
          initCard(participantItems);
          resetSelectButtons();
          toggleSubmitButton();
          participantsList.parentElement.classList.remove('change');
        });
      },
      200
    );
  }

  initCard(participantItems);

  previewButton.addEventListener('click', () => {
    if (!previewButton.disabled) {
      router.switchPage('angles-preview');
    }
  });

  selectButtonAll.addEventListener('click', () => {
    if (!isAllSelected) {
      for (const participantItem of participantItems) {
        if (!participantItem.classList.contains('selected')) {
          selectParticipant(participantItem);
        }
      }

      toggleSelectButtons(true, totalCompleted);
    } else {
      for (const participantItem of participantItems) {
        participantItem.classList.toggle('selected');
        selectedParticipants.pop();
      }

      toggleSelectButtons(false, totalCompleted);
    }

    toggleSubmitButton();
    toggleSelectedParticipantStorage();
  });

  selectButtonNotCompleted.addEventListener('click', () => {
    if (!isAllNotCompletedSelected) {
      for (const participantItem of participantItems) {
        const participantItemClasses = participantItem.classList;

        if (
          participantItemClasses.contains('not-completed') &&
          !participantItemClasses.contains('selected')
        ) {
          selectParticipant(participantItem);
        }
      }

      toggleSelectButtons(true, totalCompleted, false);
    } else {
      for (const participantItem of participantItems) {
        const participantItemClasses = participantItem.classList;

        if (
          participantItemClasses.contains('not-completed') &&
          participantItemClasses.contains('selected')
        ) {
          participantItem.classList.toggle('selected');
          selectedParticipants.pop();
        }
      }

      toggleSelectButtons(false, totalCompleted, false);
    }

    toggleSubmitButton();
    toggleSelectedParticipantStorage();
  });

  submitButton.addEventListener('click', () => {
    if (!submitButton.disabled) {
      loaderOverlay.toggle({ message: 'Preparing data...' });

      setTimeout(() => {
        router.switchPage('angles-selection');
      }, 1000);
    }
  });

  exportPDFButton.addEventListener('click', async () => {
    loaderOverlay.toggle({ message: 'Creating PDF report...' });

    try {
      await metadata.writeHTMLReport(
        analysisType,
        report({
          analysis: analysisType,
          participants: participantsObject,
          dateTime: dayjs().format('YYYY-MM-DD hh:mm')
        })
      );
    } catch (error) {
      const errorOverlay = new ErrorOverlay({
        message: `Error occurs while trying to create HTML report`,
        details: error.message,
        interact: true
      });

      errorOverlay.show();
    }

    setTimeout(() => {
      loaderOverlay.toggle();
    }, 2000);
  });
}

changeButton.addEventListener('click', () => {
  SessionStore.clear({ keep: ['data-path', 'analysis'] });
  router.switchPage('data-discovering');
});
