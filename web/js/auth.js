const auth = {
    saveToken(t){ localStorage.setItem('token', t); },
    token(){ return localStorage.getItem('token'); },
    isLogged(){ return !!localStorage.getItem('token'); },
    logout(){ localStorage.removeItem('token'); }
  };
  
  // Redirecciones simples si hace falta
  if (document.location.pathname.endsWith('app.html') && !auth.isLogged()) {
    window.location.href = 'login.html';
  }

