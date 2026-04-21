const screens = {
  main: document.getElementById('screen-main'),
  loading: document.getElementById('screen-loading'),
  photo: document.getElementById('screen-photo'),
  video: document.getElementById('screen-video'),
};

const progressBar = document.querySelector('.progress-bar');
const steps = document.querySelectorAll('.step');

function show(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

document.getElementById('btn-upload').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', startLoading);

function startLoading(target = 'photo') {
  show('loading');
  progressBar.classList.remove('running');
  steps.forEach(s => s.classList.remove('done'));
  void progressBar.offsetWidth;
  progressBar.classList.add('running');
  setTimeout(() => steps[0].classList.add('done'), 800);
  setTimeout(() => steps[1].classList.add('done'), 1800);
  setTimeout(() => steps[2].classList.add('done'), 2700);
  setTimeout(() => {
    if (target === 'video') document.getElementById('result-video').load();
    show(target);
  }, 3000);
}

document.getElementById('btn-make-video').addEventListener('click', () => {
  startLoading('video');
});

document.getElementById('btn-restart').addEventListener('click', () => {
  document.getElementById('file-input').value = '';
  show('main');
});
