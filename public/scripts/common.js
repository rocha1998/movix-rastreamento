const API_BASE = '/api';

function showMessage(element, message, type = 'error') {
  element.textContent = message;
  element.className = `message show ${type}`;
}

function clearMessage(element) {
  element.textContent = '';
  element.className = 'message';
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatCpf(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatCep(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, '$1-$2');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const navToggle = document.querySelector('.nav-toggle');
const siteHeader = document.querySelector('.site-header');
const siteNav = document.querySelector('.site-nav');
const navCloseTargets = document.querySelectorAll('[data-nav-close]');

function setNavOpenState(isOpen) {
  if (!navToggle || !siteHeader || !siteNav) {
    return;
  }

  siteHeader.classList.toggle('nav-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  document.body.classList.toggle('nav-lock', isOpen);
}

if (navToggle && siteHeader && siteNav) {
  navToggle.addEventListener('click', () => {
    setNavOpenState(!siteHeader.classList.contains('nav-open'));
  });

  navCloseTargets.forEach((element) => {
    element.addEventListener('click', () => {
      setNavOpenState(false);
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      setNavOpenState(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setNavOpenState(false);
    }
  });
}
