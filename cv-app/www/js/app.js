// App.js - CV navigation and Cordova native features
const skills = [
  { name: 'JavaScript / Node.js', level: 85 },
  { name: 'HTML & CSS', level: 90 },
  { name: 'MongoDB', level: 70 },
  { name: 'Academic Writing', level: 80 }
];
const projects = [
  { title: 'Smart Farm Web App', desc: 'Full-stack app with Node.js, Express and MongoDB.' },
  { title: 'CV Mobile App', desc: 'Multi-page Cordova app with camera and geolocation.' }
];
const pages = ['profile', 'education', 'skills', 'contact'];
const contactEmail = 'aarejamiu1@gmail.com';

const $ = (id) => document.getElementById(id);

function setStatus(message) {
  $('app-status').textContent = message;
}

// ---------- Multi-page navigation ----------
function showPage(id) {
  const pageIndex = pages.indexOf(id);
  if (pageIndex === -1) return;

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
  let preferenceSaved = true;
  try {
    localStorage.setItem('lastPage', id);
  } catch (error) {
    preferenceSaved = false;
  }
  const saveNotice = preferenceSaved ? '' : ' Page preference could not be saved.';
  setStatus(`Page ${pageIndex + 1} of ${pages.length}: ${$('page-title').textContent}.${saveNotice}`);
}

function changePage(offset) {
  const currentPage = pages.findIndex((id) => $(`${id}`).classList.contains('active'));
  const nextPage = (currentPage + offset + pages.length) % pages.length;
  showPage(pages[nextPage]);
}

function renderLists() {
  $('skill-list').innerHTML = skills.map((skill) =>
    `<div><strong>${skill.name}</strong> (${skill.level}%)<div class="bar" role="meter" aria-label="${skill.name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${skill.level}"><div style="width:${skill.level}%"></div></div></div>`).join('');
  $('project-list').innerHTML = projects.map((project) =>
    `<div class="card"><h3>${project.title}</h3><p>${project.desc}</p></div>`).join('');
}

// ---------- Native: Camera (cordova-plugin-camera) ----------
function choosePhoto(sourceType) {
  const camera = window.Camera;
  if (!navigator.camera || !camera) {
    setStatus('Camera is unavailable. Open this app on a device with the Cordova camera plugin installed.');
    return;
  }

  navigator.camera.getPicture(
    (imageData) => {
      const photo = `data:image/jpeg;base64,${imageData}`;
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
}

function takePhoto() {
  choosePhoto(window.Camera ? window.Camera.PictureSourceType.CAMERA : 1);
}

function choosePhotoFromGallery() {
  choosePhoto(window.Camera ? window.Camera.PictureSourceType.PHOTOLIBRARY : 0);
}

// ---------- Native: Geolocation (cordova-plugin-geolocation) ----------
function getLocation() {
  if (!navigator.geolocation) {
    setStatus('Location is unavailable on this device.');
    return;
  }

  $('geo-out').textContent = 'Locating…';
  $('map-link').style.display = 'none';
  setStatus('Requesting your location. Allow location access if prompted.');
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      $('geo-out').textContent = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)} (±${Math.round(accuracy)} m)`;
      const mapLink = $('map-link');
      mapLink.href = `https://www.google.com/maps?q=${latitude},${longitude}`;
      mapLink.style.display = 'inline';
      setStatus('Location found. Your coordinates are shown on this page.');
    },
    (error) => {
      const messages = {
        1: 'Location permission was denied. Enable location access in your device settings.',
        2: 'Your current location could not be determined. Check that location services are enabled.',
        3: 'Location request timed out. Please try again.'
      };
      $('geo-out').textContent = messages[error.code] || `Location error: ${error.message}`;
      setStatus($('geo-out').textContent);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// ---------- Native: Device info (cordova-plugin-device, when installed) ----------
function showDevice() {
  $('device-out').textContent = window.device
    ? `${device.manufacturer} ${device.model} · ${device.platform} ${device.version}`
    : 'Device details are unavailable. Install cordova-plugin-device to enable this feature.';
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
    text: `Aare Jamiu — Mathematics Graduate and Developer. Contact: ${contactEmail}`
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
    if (savedPhoto) $('photo').src = savedPhoto;
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
  $('btn-geo').addEventListener('click', getLocation);
  $('btn-send').addEventListener('click', sendMessage);
  $('btn-share').addEventListener('click', shareCV);
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

document.addEventListener('deviceready', showDevice, false);