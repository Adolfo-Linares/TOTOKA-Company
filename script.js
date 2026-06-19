function toggleMenu(){
  document.body.classList.toggle('menu-open');
}

document.addEventListener('DOMContentLoaded', ()=>{
  setupProductLightbox();
  setupGmailLinks();
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

function openGmailCompose(subject, body = ''){
  const mailtoUrl = `mailto:totokainnovat@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmailUrl = `https://mail.google.com/mail/?extsrc=mailto&url=${encodeURIComponent(mailtoUrl)}`;
  const gmailWindow = window.open(gmailUrl, 'totokaGmailCompose');

  if(!gmailWindow){
    window.location.href = gmailUrl;
  }
}

function setupGmailLinks(){
  document.querySelectorAll('a[href^="mailto:totokainnovat@gmail.com"]').forEach((link)=>{
    link.addEventListener('click', (event)=>{
      event.preventDefault();
      openGmailCompose('Informacion TOTOKA', 'Hola, quiero informacion sobre TOTOKA.');
    });
  });
}

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
  openGmailCompose(subject, body);
}
