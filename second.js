document.addEventListener('DOMContentLoaded', () => {
    const backbutton = document.querySelector('.ArrowBack');
    if (backbutton) {
      backbutton.addEventListener('click', () => {
        window.location.href = 'mainpage_1.html';
      });
    }
  });


document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();
    var errorMessage = document.getElementById('errorMessage');

    if (username === '' || password === '') {
        errorMessage.textContent = 'Please enter username and password';
        return;
    }

    // 假设正确的用户名和密码是 'patient001' 和 '123456'
    if (username === 'patient001' && password === '123456') {
        // 登录成功，跳转到下一个页面
        window.location.href = 'mainpage_login.html'; // 替换为你的下一个页面的URL
    } else {
        // 登录失败，显示错误消息
        errorMessage.textContent = 'Invalid username or password';
    }
});
document.getElementById('sendBtn').addEventListener('click', function() {
  const userInput = document.getElementById('chatInput').value.trim();
  if (userInput) {
      sendMessage(userInput);
  }
});

document.getElementById('chatInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
      const userInput = document.getElementById('chatInput').value.trim();
      if (userInput) {
          sendMessage(userInput);
      }
  }
});


