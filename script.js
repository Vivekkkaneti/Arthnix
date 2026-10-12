const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.mobile-menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

const setMobileMenu = (open) => {
  menuToggle.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  mobileNav.classList.toggle('open', open);
  mobileNav.setAttribute('aria-hidden', String(!open));
};

menuToggle.addEventListener('click', () => setMobileMenu(!mobileNav.classList.contains('open')));
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMobileMenu(false)));

document.querySelectorAll('.dropdown-trigger').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    const parent = trigger.closest('.nav-dropdown');
    document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
      if (dropdown !== parent) {
        dropdown.classList.remove('open');
        dropdown.querySelector('.dropdown-trigger').setAttribute('aria-expanded', 'false');
      }
    });
    const isOpen = parent.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    dropdown.classList.remove('open');
    dropdown.querySelector('.dropdown-trigger').setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 10), { passive: true });

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelectorAll('details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (detail.open) {
      document.querySelectorAll('.faq-list details[open]').forEach((other) => {
        if (other !== detail) other.removeAttribute('open');
      });
    }
  });
});

document.querySelectorAll('.tool-category').forEach((category) => {
  category.addEventListener('click', () => {
    document.querySelectorAll('.tool-category').forEach((item) => item.classList.remove('active'));
    category.classList.add('active');
  });
});
