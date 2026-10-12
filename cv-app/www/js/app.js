const skills = [
  'JavaScript',
  'HTML & CSS',
  'Node.js / Express',
  'MongoDB',
  'Research & Academic Writing'
];
const projects = [
  { title: 'Smart Farm Web App', desc: 'Full-stack app with Node.js, Express and MongoDB.' },
];
const pages = ['profile', 'education', 'skills', 'contact'];
const contactEmail = 'aarejamiu1@gmail.com';

const $ = (id) => document.getElementById(id);

function setStatus(message) {
  const status = $('app-status');
  if (status) status.textContent = '';
}

// ---------- Multi-page navigation ----------
function showPage(id) {
  if (!pages.includes(id)) return;

  document.querySelectorAll('.page').forEach((page) => {
    const isActive = page.id === id;
    page.classList.toggle('active', isActive);
    page.setAttribute('aria-hidden', String(!isActive));
  });
  document.querySelectorAll('nav button').forEach((button) => {
    const isActive = button.dataset.page === id;
    button.classList.toggle('active', isActive);
    if (isActive) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  const activeButton = document.querySelector(`nav button[data-page="${id}"]`);
  $('page-title').textContent = activeButton.querySelector('span').textContent;
  try {
    localStorage.setItem('lastPage', id);
  } catch (error) {
    // Ignore storage errors without showing a visible status label.
  }
  setStatus('');
}

function changePage(offset) {
  const currentPage = pages.findIndex((id) => $(`${id}`).classList.contains('active'));
  const nextPage = (currentPage + offset + pages.length) % pages.length;
  showPage(pages[nextPage]);
}

function renderLists() {
  $('skill-list').innerHTML = skills.map((skill) =>
    `<div class="card"><p>${skill}</p></div>`).join('');
  $('project-list').innerHTML = projects.map((project) =>
    `<div class="card"><h3>${project.title}</h3><p>${project.desc}</p></div>`).join('');
}

// ---------- Native: Camera (cordova-plugin-camera) ----------
function normalizePhotoSource(source) {
  if (!source) return null;

  const trimmed = String(source).trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('file:') || trimmed.startsWith('content:')) return trimmed;
  return `data:image/jpeg;base64,${trimmed}`;
}

function displaySelectedImage(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const photo = event.target.result;
    $('photo').src = photo;
    try {
      localStorage.setItem('photo', photo);
      setStatus('Profile photo updated.');
    } catch (error) {
      setStatus('Photo updated for this session, but could not be saved on this device.');
    }
  };
  reader.readAsDataURL(file);
}

function choosePhoto(sourceType) {
  const camera = window.Camera;
  if (navigator.camera && camera) {
    navigator.camera.getPicture(
      (imageData) => {
        const photo = normalizePhotoSource(imageData);
        if (!photo) {
          setStatus('The selected photo could not be loaded.');
          return;
        }

        $('photo').src = photo;
        try {
          localStorage.setItem('photo', photo);
          setStatus('Profile photo updated.');
        } catch (error) {
          setStatus('Photo updated for this session, but could not be saved on this device.');
        }
      },
      (error) => {
        if (error === 'Camera cancelled.' || (error && error.code === 20)) return;
        setStatus(`Camera error: ${typeof error === 'string' ? error : error.message || 'Unable to take a photo.'}`);
      },
      {
        quality: 70,
        destinationType: camera.DestinationType.DATA_URL,
        sourceType,
        encodingType: camera.EncodingType.JPEG,
        targetWidth: 512,
        targetHeight: 512,
        correctOrientation: true
      }
    );
    return;
  }

  const fileInput = $('photo-input');
  if (sourceType === (window.Camera ? window.Camera.PictureSourceType.CAMERA : 1)) {
    fileInput.setAttribute('capture', 'environment');
  } else {
    fileInput.removeAttribute('capture');
  }
  fileInput.onchange = (event) => {
    const [file] = event.target.files;
    displaySelectedImage(file);
    fileInput.value = '';
  };
  fileInput.click();
}

function takePhoto() {
  choosePhoto(window.Camera ? window.Camera.PictureSourceType.CAMERA : 1);
}

function choosePhotoFromGallery() {
  choosePhoto(window.Camera ? window.Camera.PictureSourceType.PHOTOLIBRARY : 0);
}

// ---------- Contact and sharing ----------
function sendMessage() {
  const name = $('msg-name').value.trim();
  const body = $('msg-body').value.trim();
  if (!name || !body) {
    setStatus('Enter your name and a message before sending.');
    return;
  }

  const subject = encodeURIComponent(`Message from ${name}`);
  const message = encodeURIComponent(body);
  window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${message}`;
  setStatus('Opening your email app…');
}

async function shareCV() {
  const shareData = {
    title: 'Aare Jamiu - CV',
    text: `Aare Jamiu — First-class Mathematics Graduate and Developer. Contact: ${contactEmail}`
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      setStatus('CV shared.');
    } catch (error) {
      if (error.name !== 'AbortError') setStatus(`Unable to share the CV: ${error.message}`);
    }
    return;
  }

  const subject = encodeURIComponent(shareData.title);
  const body = encodeURIComponent(`${shareData.text}\n\nEmail: ${contactEmail}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  setStatus('Opening your email app to share the CV…');
}

function restorePhoto() {
  try {
    const savedPhoto = localStorage.getItem('photo');
    if (savedPhoto && savedPhoto.startsWith('data:image/') && savedPhoto.length > 100) {
      $('photo').src = savedPhoto;
    }
  } catch (error) {
    setStatus('Saved profile photo could not be loaded.');
  }
}

function enableSwipeNavigation() {
  let startX = 0;
  let startY = 0;
  const main = document.querySelector('main');

  main.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive: true });

  main.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.3) return;
    changePage(deltaX < 0 ? 1 : -1);
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  renderLists();
  document.querySelectorAll('nav button').forEach((button) => {
    button.addEventListener('click', () => showPage(button.dataset.page));
  });
  $('btn-camera').addEventListener('click', takePhoto);
  $('btn-gallery').addEventListener('click', choosePhotoFromGallery);
  $('btn-send').addEventListener('click', sendMessage);
  $('btn-share').addEventListener('click', shareCV);
  $('photo-input').addEventListener('change', (event) => {
    const [file] = event.target.files;
    displaySelectedImage(file);
    event.target.value = '';
  });
  restorePhoto();
  enableSwipeNavigation();

  let savedPage;
  try {
    savedPage = localStorage.getItem('lastPage');
  } catch (error) {
    setStatus('Page preferences could not be loaded; showing your profile.');
  }
  showPage(pages.includes(savedPage) ? savedPage : 'profile');
});