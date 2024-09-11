document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.querySelector('.Back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = 'mainpage_1.html';
      });
    }
  });
document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.querySelector('.askbutton');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = 'voicestart.html';
      });
    }
  });
