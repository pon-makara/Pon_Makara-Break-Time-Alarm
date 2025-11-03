(function(){
  function enhanceForm(id){
    const form = document.getElementById(id);
    if(!form) return;
    form.addEventListener('submit', async (e)=>{
      if(!window.fetch) return; // graceful: fall back to normal submit
      e.preventDefault();
      const action = form.getAttribute('action');
      const method = (form.getAttribute('method')||'post').toUpperCase();
      const data = new URLSearchParams(new FormData(form));
      try{
        const res = await fetch(action, { method, headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: data });
        // If server redirects, fetch won't auto-follow with SPA behavior; detect redirect by url change in res.redirected
        if(res.redirected){
          window.location.href = res.url;
          return;
        }
        // otherwise, replace document with returned HTML (in case server re-renders page with errors)
        const html = await res.text();
        document.open();
        document.write(html);
        document.close();
      }catch(err){
        console.error('Auth submit failed', err);
        alert('Network error, please try again.');
      }
    });
  }
  enhanceForm('login-form');
  enhanceForm('register-form');
})();
