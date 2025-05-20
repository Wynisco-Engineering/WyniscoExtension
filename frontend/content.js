const btn = document.createElement('button');
btn.id = 'fixed-right-image-btn';
btn.title = 'Click me!';

// Create the image element
const img = document.createElement('img');
img.src = chrome.runtime.getURL('icon.png');
img.alt = 'Extension Icon';
img.style.width = '32px';
img.style.height = '32px';
img.style.display = 'block';
img.style.pointerEvents = 'none'; // So only the button handles clicks

btn.appendChild(img);

// Example click handler
btn.onclick = () => {
  alert('Button clicked!');
};

document.body.appendChild(btn);
