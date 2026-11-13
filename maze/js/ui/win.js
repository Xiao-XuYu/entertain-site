const CHARS = ['💖', '🎀', '⭐', '🌸', '✨', '👑', '🦄', '🩰'];

export function bindWinButtons({ onAgain, onClose }) {
  document.getElementById('btn-again').addEventListener('click', onAgain);
  document.getElementById('btn-close').addEventListener('click', onClose);
}

export function showWin(infoText) {
  document.getElementById('win-info').textContent = infoText;
  document.getElementById('overlay').classList.remove('hidden');
  confetti();
}

export function hideWin() {
  document.getElementById('overlay').classList.add('hidden');
}

function confetti() {
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('span');
    el.className = 'confetti';
    el.textContent = CHARS[i % CHARS.length];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.fontSize = `${14 + Math.random() * 22}px`;
    el.style.animationDuration = `${2.2 + Math.random() * 2}s`;
    el.style.animationDelay = `${Math.random() * 0.8}s`;
    el.addEventListener('animationend', () => el.remove());
    document.body.appendChild(el);
  }
}
