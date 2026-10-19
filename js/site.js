'use strict';

document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu(returnFocus = false) {
  if (!menuButton || !navigation) return;
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('span').textContent = '＋';
  if (returnFocus) menuButton.focus();
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  menuButton.querySelector('span').textContent = open ? '−' : '＋';
});
navigation?.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
const desktop = window.matchMedia('(min-width: 801px)');
desktop.addEventListener('change', () => closeMenu());
document.querySelectorAll('[data-year]').forEach(item => { item.textContent = new Date().getFullYear(); });

// Gallery uses ordinary image links as a no-script fallback.
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const galleryItems = [...document.querySelectorAll('.gallery-item')];
filterButtons.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  galleryItems.forEach(item => { item.hidden = filter !== 'all' && item.dataset.group !== filter; });
  const visible = galleryItems.filter(item => !item.hidden).length;
  document.querySelector('#gallery-status').textContent = `Показано экранов: ${visible}.`;
}));

const lightbox = document.querySelector('#lightbox');
const galleryLinks = [...document.querySelectorAll('[data-lightbox]')];
let currentImage = 0;
let opener = null;
function visibleLinks() { return galleryLinks.filter(link => !link.closest('figure').hidden); }
function showImage(link) {
  const image = document.querySelector('#lightbox-image');
  const links = visibleLinks();
  currentImage = links.indexOf(link);
  image.src = link.href;
  image.alt = link.querySelector('img').alt;
  document.querySelector('#lightbox-caption').textContent = link.dataset.caption;
  document.querySelector('#lightbox-count').textContent = `${currentImage + 1} / ${links.length}`;
}
function stepImage(step) {
  const links = visibleLinks();
  if (links.length) showImage(links[(currentImage + step + links.length) % links.length]);
}
galleryLinks.forEach(link => link.addEventListener('click', event => {
  if (!lightbox || typeof lightbox.showModal !== 'function') return;
  event.preventDefault();
  opener = link;
  showImage(link);
  lightbox.showModal();
  document.body.classList.add('modal-open');
}));
lightbox?.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  opener?.focus({ preventScroll: true });
});
lightbox?.addEventListener('click', event => {
  if (event.target !== lightbox) return;
  const box = lightbox.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) lightbox.close();
});
lightbox?.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); stepImage(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); stepImage(1); }
});
document.querySelector('#lightbox-prev')?.addEventListener('click', () => stepImage(-1));
document.querySelector('#lightbox-next')?.addEventListener('click', () => stepImage(1));

// No backend: prepare a message, then let the visitor choose how to send it.
const form = document.querySelector('#brief-form');
const labels = { landing: 'Лендинг', company: 'Сайт компании', catalog: 'Каталог / сервис', redesign: 'Обновление сайта', unsure: 'Пока выбираю' };
let preparedBrief = '';
if (form) {
  const selected = new URLSearchParams(window.location.search).get('service');
  if (Object.prototype.hasOwnProperty.call(labels, selected)) {
    const input = [...form.querySelectorAll('input[name="service"]')].find(item => item.value === selected);
    if (input) input.checked = true;
  }
  const taskInput = form.querySelector('#task');
  const nameInput = form.querySelector('#name');
  const contactInput = form.querySelector('#contact');
  [taskInput, nameInput, contactInput].forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
  form.addEventListener('submit', event => {
    event.preventDefault();
    taskInput.setCustomValidity(taskInput.value.trim().length < 10 ? 'Опишите задачу хотя бы в нескольких словах.' : '');
    nameInput.setCustomValidity(!nameInput.value.trim() ? 'Укажите, как к вам обращаться.' : '');
    const contact = contactInput.value.trim();
    const validContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || /^@[a-zA-Z0-9_]{5,32}$/.test(contact) || /^(https?:\/\/)?t\.me\/[a-zA-Z0-9_]{5,32}\/?$/.test(contact);
    contactInput.setCustomValidity(validContact ? '' : 'Введите email или Telegram: например, @username.');
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    preparedBrief = [
      'Здравствуйте, deko agents!', '',
      `Меня зовут: ${nameInput.value.trim()}`,
      `Связаться со мной: ${contact}`,
      `Тип проекта: ${labels[data.get('service')] || labels.unsure}`, '',
      'Задача:', taskInput.value.trim(), '',
      `Сроки и пожелания: ${String(data.get('timing')).trim() || 'Обсудим'}`
    ].join('\n');
    document.querySelector('#brief-text').value = preparedBrief;
    const mail = document.querySelector('#email-brief');
    mail.href = `mailto:arsensteamru@gmail.com?subject=${encodeURIComponent('Новый сайт — ' + nameInput.value.trim())}&body=${encodeURIComponent(preparedBrief)}`;
    const longMessage = mail.href.length > 7000;
    mail.hidden = longMessage;
    document.querySelector('#brief-status').textContent = longMessage ? 'Бриф получился длинным. Скопируйте его или скачайте и отправьте на arsensteamru@gmail.com.' : '';
    document.querySelector('#brief-result').hidden = false;
    document.querySelector('#brief-title').focus({ preventScroll: true });
    document.querySelector('#brief-result').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  form.addEventListener('input', () => {
    // Invalidate the old draft immediately when any source field changes.
    document.querySelector('#brief-result').hidden = true;
    preparedBrief = '';
  });
}
document.querySelector('#copy-brief')?.addEventListener('click', async () => {
  if (!preparedBrief) return;
  const status = document.querySelector('#brief-status');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(preparedBrief);
    status.textContent = 'Бриф скопирован. Вставьте его в письмо или сообщение.';
  } catch {
    const text = document.querySelector('#brief-text');
    text.focus();
    text.select();
    status.textContent = 'Текст выделен. Нажмите Ctrl+C (или Cmd+C), чтобы скопировать его.';
  }
});
document.querySelector('#download-brief')?.addEventListener('click', () => {
  if (!preparedBrief) return;
  const blob = new Blob(['\uFEFF' + preparedBrief], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'deko-agents-brief.txt';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#brief-status').textContent = 'Скачивание брифа запущено. Прикрепите файл к письму или сообщению.';
});
