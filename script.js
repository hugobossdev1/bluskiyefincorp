const listings = [
  {
    title: 'BluSky Growth Equity',
    description: 'A technology-focused growth equity designed for investors seeking long-term appreciation and innovation exposure.',
    price: '$142.75',
    status: 'Recommended',
  },
  {
    title: 'BluSky Income Bond',
    description: 'A fixed-income offering providing predictable yield and capital stability in a diversified bond sleeve.',
    price: '$1,000.00',
    status: 'Available',
  },
  {
    title: 'BluSky Real Estate Fund',
    description: 'A diversified property fund with exposure to commercial and residential assets across developed markets.',
    price: '$56.20',
    status: 'Limited availability',
  },
  {
    title: 'BluSky Global ETF',
    description: 'A broad-market international ETF covering developed and emerging economies for global diversification.',
    price: '$78.90',
    status: 'Open',
  },
  {
    title: 'BluSky Green Energy',
    description: 'A sustainable energy allocation focused on renewable infrastructure and low-carbon innovators.',
    price: '$103.40',
    status: 'Watch list',
  },
];

const listingCards = document.getElementById('listingCards');
const formResponse = document.getElementById('formResponse');
const searchInput = document.getElementById('listingSearch');
const clearButton = document.getElementById('clearSearch');
const projectedValue = document.getElementById('projectedValue');
const calculatorForm = document.getElementById('calculatorForm');
const yearsInput = document.getElementById('investmentYears');
const yearsValue = document.getElementById('yearsValue');
const listingModal = document.getElementById('listingModal');
const modalDescription = document.getElementById('modalDescription');
const modalMeta = document.getElementById('modalMeta');
const closeModal = document.getElementById('closeModal');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobileMenu');

function renderListings(filter = '') {
  listingCards.innerHTML = '';
  const normalizedFilter = filter.toLowerCase();
  const filtered = listings.filter((item) => {
    return item.title.toLowerCase().includes(normalizedFilter) || item.description.toLowerCase().includes(normalizedFilter);
  });

  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No listings match that search. Try another term.';
    empty.style.color = '#475569';
    listingCards.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      <div class="card-meta">
        <span><strong>Price:</strong> ${item.price}</span>
        <span><strong>Status:</strong> ${item.status}</span>
      </div>
      <button type="button">View details</button>
    `;

    const button = card.querySelector('button');
    button.addEventListener('click', () => openListingModal(item));

    listingCards.appendChild(card);
  });
}

function openListingModal(item) {
  modalDescription.textContent = item.description;
  modalMeta.innerHTML = `
    <span><strong>Price:</strong> ${item.price}</span>
    <span><strong>Status:</strong> ${item.status}</span>
    <span><strong>Theme:</strong> ${item.theme || 'Core growth'}</span>
  `;
  listingModal.classList.add('open');
  listingModal.setAttribute('aria-hidden', 'false');
}

function closeListingModal() {
  listingModal.classList.remove('open');
  listingModal.setAttribute('aria-hidden', 'true');
}

function setupSearch() {
  searchInput.addEventListener('input', () => {
    renderListings(searchInput.value);
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    renderListings();
  });
}

function setupForm() {
  const contactForm = document.getElementById('contactForm');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      formResponse.textContent = 'Please complete all required fields before submitting.';
      return;
    }

    formResponse.textContent = 'Submitting your inquiry...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        throw new Error('Unable to submit form at this time. Please try again later.');
      }

      formResponse.textContent = `Thank you, ${name}. Your inquiry has been received and our team will contact you shortly.`;
      contactForm.reset();
    } catch (error) {
      console.error(error);
      formResponse.textContent = 'There was a problem submitting your message. Please try again or contact us directly.';
    }
  });
}

function formatCurrency(value) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function calculateProjection(amount, years, rate = 0.065) {
  return amount * Math.pow(1 + rate, years);
}

function updateProjection() {
  const amount = Number(document.getElementById('investmentAmount').value) || 0;
  const years = Number(yearsInput.value);
  yearsValue.textContent = years;
  const projected = calculateProjection(amount, years);
  projectedValue.textContent = formatCurrency(projected);
}

function setupCalculator() {
  if (!calculatorForm || !yearsInput) return;

  calculatorForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateProjection();
  });

  yearsInput.addEventListener('input', () => updateProjection());
  document.getElementById('investmentAmount').addEventListener('input', () => updateProjection());
  updateProjection();
}

function setupModal() {
  if (!listingModal || !closeModal) return;

  closeModal.addEventListener('click', closeListingModal);
  listingModal.addEventListener('click', (event) => {
    if (event.target === listingModal) closeListingModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && listingModal.classList.contains('open')) {
      closeListingModal();
    }
  });
}

function setupMobileMenu() {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  });
}

renderListings();
setupSearch();
setupForm();
setupCalculator();
setupModal();
setupMobileMenu();
