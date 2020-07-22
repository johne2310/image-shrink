// modules
const { ipcRenderer } = require('electron');

// set constants
const path = require('path');
const os = require('os');

const form = document.getElementById('image-form');
const slider = document.getElementById('slider');
const img = document.getElementById('img');

// set output path text
let destination = path.join(os.homedir(), 'imageshrink');
document.getElementById('output-path').innerText = destination;

// form submission
form.addEventListener('submit', e => {
  //prevent default action
  e.preventDefault();

  //set image path and quality
  const imgPath = img.files[0].path;
  const quality = slider.value;

  ipcRenderer.send('image:minimise', { imgPath, quality });
});

//listen for done message and create materialize toast
ipcRenderer.on('image:done', (e, quality) => {
  M.toast({
    html: `Image has been resized to ${ quality } quality`
  });
});

//listen for error message and create materialize toast
ipcRenderer.on('image:error', () => {
  M.toast({
      html: `Image could not be resized due to an error with the file`,
      classes: 'toast-error',
      displayLength: 6000
    }
  );
});
