function toggleMenu(){
  document.body.classList.toggle('menu-open');
}

function getDisplayName(email){
  return String(email || '').split('@')[0].trim() || 'Usuario';
}

function updateLoginButtons(){
  const username = localStorage.getItem('totokaUserName');
  if(!username) return;

  document.querySelectorAll('.login-btn').forEach((button)=>{
    const icon = button.querySelector('svg');
    button.textContent = '';
    if(icon) button.appendChild(icon);
    button.append(document.createTextNode(username));
    button.setAttribute('title', `Sesion iniciada como ${username}`);
  });
}

function setupLoginForm(){
  const form = document.getElementById('loginForm');
  if(!form) return;

  form.addEventListener('submit', (event)=>{
    event.preventDefault();
    if(!form.reportValidity()) return;

    const data = new FormData(form);
    const username = getDisplayName(data.get('email'));
    localStorage.setItem('totokaUserName', username);
    updateLoginButtons();
    window.location.href = 'index.html';
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateLoginButtons();
  setupLoginForm();
  setupProductLightbox();
});

function setupProductLightbox(){
  const productImages = document.querySelectorAll(
    '.mini-product img, .product-card img, .presentations img, .detail-gallery img, [data-zoom-src]'
  );
  if(!productImages.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'image-lightbox';
  lightbox.innerHTML = `
    <button class="image-lightbox-close" type="button" aria-label="Cerrar imagen">x</button>
    <img alt="">
    <p></p>
  `;
  document.body.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('p');
  const closeButton = lightbox.querySelector('button');

  function closeLightbox(){
    lightbox.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    lightboxImage.removeAttribute('src');
  }

  productImages.forEach((image)=>{
    image.classList.add('zoomable-product');
    image.setAttribute('title', 'Ver imagen grande');

    image.addEventListener('click', (event)=>{
      event.preventDefault();
      event.stopPropagation();
      const zoomSrc = image.dataset.zoomSrc || image.src;
      const zoomAlt = image.dataset.zoomAlt || image.alt || 'Producto TOTOKA';
      lightboxImage.src = zoomSrc;
      lightboxImage.alt = zoomAlt;
      lightboxCaption.textContent = zoomAlt;
      lightbox.classList.add('open');
      document.body.classList.add('lightbox-open');
    });
  });

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event)=>{
    if(event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event)=>{
    if(event.key === 'Escape') closeLightbox();
  });
}

let sendingContact = false;

function sendContactEmail(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  if(sendingContact) return;
  if(!form.reportValidity()) return;

  sendingContact = true;
  setTimeout(()=>{ sendingContact = false; }, 1600);

  const data = new FormData(form);
  const name = data.get('name') || '';
  const email = data.get('email') || '';
  const company = data.get('company') || 'No especificada';
  const message = data.get('message') || '';
  const subject = `Mensaje de ${name} desde la pagina web`;
  const body =
    `Nombre: ${name}\n` +
    `Correo: ${email}\n` +
    `Empresa: ${company}\n\n` +
    `Mensaje:\n${message}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=totokainnovat@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, 'totokaGmailCompose');
}
