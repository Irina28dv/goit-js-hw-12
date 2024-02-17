import axios from 'axios';
import iziToast from 'izitoast';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import 'izitoast/dist/css/iziToast.min.css';

const form = document.querySelector('.form');
const galleryGrid = document.querySelector('.js-gallery-grid');
const loader = document.querySelector('.loader');
const loadMoreBtn = document.querySelector('.js-load-more-btn');

let gallery = new SimpleLightbox('.gallery-grid a', {
  captionsData: 'alt',
});

form.addEventListener('submit', handleFormSubmit);
loadMoreBtn.addEventListener('click', handleLoadBtnClick);

let page = 1;
let inputValue;
let totalPages = 0;
let loading = false;

async function handleFormSubmit(event) {
  event.preventDefault();
  showLoader();

  galleryGrid.innerHTML = '';

  inputValue = event.target.elements.query.value.trim();

  if (!inputValue) {
    hideLoader();
    showErrorToast('Search field is empty');
    return;
  }

  try {
    page = 1;
    const data = await getImagesByInputValue();
    if (data?.hits?.length) {
      hideLoader();
      totalPages = Math.ceil(data.totalHits / 15);
      checkLoadBtnStatus();
      createMarkupByHits(data.hits);
      showLoadMoreBtn();
      updateScrollObserver();
      smoothScroll();
      return;
    }
    throw Error('Sorry, there are no images matching your search query. Please try again!');
  } catch (error) {
    hideLoader();
    showErrorToast(typeof error === 'string' ? error : 'Something went wrong, sorry!');
  }

  form.reset();
}

async function handleLoadBtnClick(event) {
  if (loading) {
    return;
  }

  loading = true;

  showLoader();
  hideLoadMoreBtn();

  try {
    page += 1;

    const data = await getImagesByInputValue();
    if (data?.hits?.length) {
      hideLoader();
      checkLoadBtnStatus();
      createMarkupByHits(data.hits);
    } else {
      hideLoadMoreBtn();
    }
  } catch (error) {
    hideLoader();
    showErrorToast(typeof error === 'string' ? error : 'Something went wrong, sorry!');
  } finally {
    loading = false;
  }

  form.reset();
}

function checkLoadBtnStatus() {
  if (totalPages !== page) {
    showLoadMoreBtn();
  } else {
    hideLoadMoreBtn();
    showInfoToast("We're sorry, but you've reached the end of search results.");
  }
}

function showLoader() {
  loader.classList.remove('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
}

function showLoadMoreBtn() {
  loadMoreBtn.classList.remove('hidden');
}

function hideLoadMoreBtn() {
  loadMoreBtn.classList.add('hidden');
}

async function getImagesByInputValue() {
  const response = await axios.get('https://pixabay.com/api/', {
    params: {
      key: '42317586-b983a1ee46e38e925d954d84d',
      q: inputValue,
      image_type: 'photo',
      orientation: 'horizontal',
      safeSearch: true,
      page: page,
      per_page: 15,
    },
  });
  return response.data;
}

function createMarkupByHits(hits) {
  const fragment = document.createDocumentFragment();
  hits.forEach(({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) => {
    const galleryItem = document.createElement('a');
    galleryItem.href = largeImageURL;
    galleryItem.classList.add('gallery-card');

    const image = document.createElement('img');
    image.src = webformatURL;
    image.alt = tags;

    const detailsBox = document.createElement('div');
    detailsBox.classList.add('img-details-box');

    const likesElement = createDetailItem('Likes', likes);
    const viewsElement = createDetailItem('Views', views);
    const commentsElement = createDetailItem('Comments', comments);
    const downloadsElement = createDetailItem('Downloads', downloads);

    detailsBox.append(likesElement, viewsElement, commentsElement, downloadsElement);
    galleryItem.append(image, detailsBox);
    fragment.appendChild(galleryItem);
  });

  galleryGrid.appendChild(fragment);
  gallery.refresh();
}

function createDetailItem(label, value) {
  const detailItem = document.createElement('p');
  detailItem.classList.add('detail-item');
  detailItem.innerHTML = `<b>${label}:</b> ${value}`;
  return detailItem;
}

function updateScrollObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          handleLoadBtnClick();
        }
      });
    },
    {
      rootMargin: '0px',
      threshold: 0.2,
    }
  );

  observer.observe(loadMoreBtn);
}

function smoothScroll() {
  const cardHeight = document.querySelector('.gallery-card')?.getBoundingClientRect().height || 0;
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function showErrorToast(message) {
  iziToast.error({
    message: message,
    position: 'topRight',
  });
}

function showInfoToast(message) {
  iziToast.info({
    message: message,
    position: 'topRight',
  });
}
