document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.querySelector('.Back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = 'mainpage_login.html';
      });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.querySelector('.Frame35');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = 'pepperchat_selection.html';
      });
    }
});