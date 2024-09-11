document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.querySelector('.Back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = 'start.html';
      });
    }
  });

document.addEventListener('DOMContentLoaded', () => {
    const gptButton = document.querySelector('.gptbutton');
    if (gptButton) {
      gptButton.addEventListener('click', () => {
        window.location.href = 'chat.html';
      });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const knowButton = document.querySelector('.knowbutton');
    if (knowButton) {
      knowButton.addEventListener('click', () => {
        window.location.href = 'patientinfo.html';
      });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const logButton = document.querySelector('.logbutton');
    if (logButton) {
      logButton.addEventListener('click', () => {
        window.location.href = 'second.html';
      });
    }
});


