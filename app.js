const KEY = 'dgsl-site-register-v1';

let records = JSON.parse(localStorage.getItem(KEY) || '[]');
let editing = null;
let filter = 'All';

const $ = s => document.querySelector(s);
const rows = $('#rows');
const dlg = $('#formDialog');
const form = $('#handoverForm');

const today = () => new Date().toISOString().slice(0, 10);

function save() {
  localStorage.setItem(KEY, JSON.stringify(records));
  render();
}

function esc(x = '') {
  return String(x).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function render() {
  const q = $('#search').value.toLowerCase();

  let a = records.filter(x =>
    (filter === 'All' || x.status === filter) &&
    Object.values(x).join(' ').toLowerCase().includes(q)
  );

  $('#total').textContent = records.length;
  $('#progress').textContent =
    records.filter(x => x.status === 'In Progress').length;
  $('#closed').textContent =
    records.filter(x => x.status === 'Closed Out').length;
  $('#hold').textContent =
    records.filter(x => x.status === 'On Hold').length;

  rows.innerHTML = a.map(x => `
    <tr>
      <td>
        <b>${esc(x.zone)}</b><br>
        <small>${esc(x.drawing)}</small>
      </td>

      <td>${esc(x.level)}</td>

      <td>${esc(x.trade)}</td>

      <td>
        ${esc(x.contractor)}<br>
        <small>${esc(x.foreman)}</small>
      </td>

      <td>${esc(x.description)}</td>

      <td>
        <span class="status ${x.status.split(' ')[0]}">
          ${esc(x.status)}
        </span>
      </td>

      <td>${esc(x.handover)}</td>

      <td>${esc(x.closedDate || '')}</td>

      <td>
        <button data-edit="${x.id}">Edit</button>
      </td>
    </tr>
  `).join('');

  $('#empty').classList.toggle('hidden', a.length > 0);

  document.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () =>
      open(records.find(x => x.id === b.dataset.edit));
  });
}


// ----------------------------------------------------
// OPEN FORM
// ----------------------------------------------------

function open(x) {
  editing = x || null;

  $('#formTitle').textContent =
    x ? 'Edit handover' : 'New handover';

  $('#delete').classList.toggle('hidden', !x);

  form.reset();

  clearSignature($('#contractorSignature'));
  clearSignature($('#dgslSignature'));

  $('#photoPreview').innerHTML = '';

  for (const [k, v] of Object.entries(
    x || { handoverDate: today() }
  )) {
    if (form.elements[k]) {
      form.elements[k].value = v;
    }
  }

  dlg.showModal();
}


// ----------------------------------------------------
// CANCEL
// ----------------------------------------------------

$('#newZone').onclick = () => open();

$('#cancel').onclick =
$('#cancel2').onclick = () => dlg.close();


// ----------------------------------------------------
// SAVE HANDOVER
// ----------------------------------------------------

form.onsubmit = e => {
  e.preventDefault();

  let x = Object.fromEntries(new FormData(form));

  x.id = editing?.id || crypto.randomUUID();

  if (x.status === 'Closed Out' && !x.closedDate) {
    x.closedDate = today();
  }

  if (editing) {
    records = records.map(a =>
      a.id === x.id ? x : a
    );
  } else {
    records.unshift(x);
  }

  dlg.close();
  save();
};


// ----------------------------------------------------
// DELETE
// ----------------------------------------------------

$('#delete').onclick = () => {

  if (
    confirm('Delete this handover record?')
  ) {
    records = records.filter(
      x => x.id !== editing.id
    );

    dlg.close();
    save();
  }
};


// ----------------------------------------------------
// FILTERS
// ----------------------------------------------------

document.querySelectorAll('[data-filter]').forEach(b => {

  b.onclick = () => {

    filter = b.dataset.filter;

    document
      .querySelectorAll('[data-filter]')
      .forEach(x =>
        x.classList.toggle(
          'active',
          x === b
        )
      );

    render();
  };

});


// ----------------------------------------------------
// SEARCH
// ----------------------------------------------------

$('#search').oninput = render;


// ----------------------------------------------------
// EXPORT BACKUP
// ----------------------------------------------------

$('#export').onclick = () => {

  let a = document.createElement('a');

  a.href = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          records,
          null,
          2
        )
      ],
      {
        type: 'application/json'
      }
    )
  );

  a.download =
    `DGSL-site-register-${today()}.json`;

  a.click();

  URL.revokeObjectURL(a.href);
};


// ----------------------------------------------------
// IMPORT BACKUP
// ----------------------------------------------------

$('#import').onchange = e => {

  let f = e.target.files[0];

  if (!f) return;

  let r = new FileReader();

  r.onload = () => {

    try {

      let a = JSON.parse(r.result);

      if (!Array.isArray(a)) {
        throw 0;
      }

      records = a;

      save();

      alert('Backup imported.');

    } catch {

      alert(
        'That file is not a valid DGSL backup.'
      );

    }

  };

  r.readAsText(f);
};


// ----------------------------------------------------
// PHOTO PREVIEW
// ----------------------------------------------------

$('#photos').onchange = e => {

  const preview = $('#photoPreview');

  preview.innerHTML = '';

  const files = Array.from(e.target.files);

  files.forEach(file => {

    if (!file.type.startsWith('image/')) {
      return;
    }

    const img = document.createElement('img');

    img.style.width = '110px';
    img.style.height = '80px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '6px';
    img.style.border = '1px solid #ccc';

    img.src = URL.createObjectURL(file);

    preview.appendChild(img);

  });

};


// ----------------------------------------------------
// SIGNATURE PAD
// ----------------------------------------------------

function setupSignature(canvas) {

  const ctx = canvas.getContext('2d');

  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let drawing = false;

  function position(e) {

    const rect = canvas.getBoundingClientRect();

    const source =
      e.touches ? e.touches[0] : e;

    return {
      x:
        (source.clientX - rect.left) *
        (canvas.width / rect.width),

      y:
        (source.clientY - rect.top) *
        (canvas.height / rect.height)
    };
  }

  function start(e) {

    e.preventDefault();

    drawing = true;

    const p = position(e);

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e) {

    if (!drawing) return;

    e.preventDefault();

    const p = position(e);

    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function stop(e) {

    if (!drawing) return;

    e.preventDefault();

    drawing = false;
    ctx.closePath();
  }

  canvas.addEventListener(
    'mousedown',
    start
  );

  canvas.addEventListener(
    'mousemove',
    move
  );

  canvas.addEventListener(
    'mouseup',
    stop
  );

  canvas.addEventListener(
    'mouseleave',
    stop
  );

  canvas.addEventListener(
    'touchstart',
    start,
    { passive: false }
  );

  canvas.addEventListener(
    'touchmove',
    move,
    { passive: false }
  );

  canvas.addEventListener(
    'touchend',
    stop,
    { passive: false }
  );
}


function clearSignature(canvas) {

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
}


// Set up signature pads

setupSignature(
  $('#contractorSignature')
);

setupSignature(
  $('#dgslSignature')
);


// Clear buttons

$('#clearContractorSignature').onclick =
  () => clearSignature(
    $('#contractorSignature')
  );

$('#clearDgslSignature').onclick =
  () => clearSignature(
    $('#dgslSignature')
  );


// ----------------------------------------------------
// GENERATE PDF
// ----------------------------------------------------

$('#generatePdf').onclick = async () => {

  try {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 15;
    const pageWidth = 210;

    let y = 20;


    // TITLE

    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');

    pdf.text(
      'DGSL SITE HANDOVER',
      margin,
      y
    );

    y += 8;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');

    pdf.text(
      'Site Handover Record',
      margin,
      y
    );

    y += 10;


    // LINE

    pdf.line(
      margin,
      y,
      pageWidth - margin,
      y
    );

    y += 8;


    // GET FORM VALUES

    const data =
      Object.fromEntries(
        new FormData(form)
      );


    // HELPER FOR TEXT

    function addField(label, value) {

      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);

      pdf.text(
        `${label}:`,
        margin,
        y
      );

      pdf.setFont(undefined, 'normal');

      const lines =
        pdf.splitTextToSize(
          value || '',
          pageWidth - margin * 2 - 35
        );

      pdf.text(
        lines,
        margin + 35,
        y
      );

      y += Math.max(
        6,
        lines.length * 5
      );
    }


    // DETAILS

    addField(
      'Zone / Area',
      data.zone
    );

    addField(
      'Block / Level',
      data.level
    );

    addField(
      'Drawing / Reference',
      data.drawing
    );

    addField(
      'Trade',
      data.trade
    );

    addField(
      'Contractor',
      data.contractor
    );

    addField(
      'Site Foreman',
      data.foreman
    );

    addField(
      'Status',
      data.status
    );

    addField(
      'Handover State',
      data.handover
    );

    addField(
      'Handover Date',
      data.handoverDate
    );

    addField(
      'Closed Out Date',
      data.closedDate
    );


    // DESCRIPTION

    y += 3;

    pdf.setFont(undefined, 'bold');

    pdf.text(
      'Work Description',
      margin,
      y
    );

    y += 6;

    pdf.setFont(undefined, 'normal');

    let descriptionLines =
      pdf.splitTextToSize(
        data.description || '',
        pageWidth - margin * 2
      );

    pdf.text(
      descriptionLines,
      margin,
      y
    );

    y += Math.max(
      8,
      descriptionLines.length * 5
    );


    // NOTES

    y += 3;

    pdf.setFont(undefined, 'bold');

    pdf.text(
      'Notes / Outstanding Items',
      margin,
      y
    );

    y += 6;

    pdf.setFont(undefined, 'normal');

    let noteLines =
      pdf.splitTextToSize(
        data.notes || '',
        pageWidth - margin * 2
      );

    pdf.text(
      noteLines,
      margin,
      y
    );

    y += Math.max(
      12,
      noteLines.length * 5
    );


    // SIGNATURES

    if (y > 230) {

      pdf.addPage();

      y = 20;

    }

    pdf.setFont(undefined, 'bold');

    pdf.text(
      'Signatures',
      margin,
      y
    );

    y += 8;

    pdf.setFont(undefined, 'normal');

    pdf.text(
      `Contractor / Foreman: ${data.contractorSigner || ''}`,
      margin,
      y
    );

    y += 5;

    pdf.addImage(
      $('#contractorSignature').toDataURL('image/png'),
      'PNG',
      margin,
      y,
      80,
      24
    );

    y += 32;

    pdf.text(
      `DGSL Representative: ${data.dgslSigner || ''}`,
      margin,
      y
    );

    y += 5;

    pdf.addImage(
      $('#dgslSignature').toDataURL('image/png'),
      'PNG',
      margin,
      y,
      80,
      24
    );


    // ------------------------------------------------
    // PHOTOS
    // ------------------------------------------------

    const photoFiles =
      Array.from(
        $('#photos').files
      );

    if (photoFiles.length > 0) {

      pdf.addPage();

      y = 20;

      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');

      pdf.text(
        'SITE PHOTOS',
        margin,
        y
      );

      y += 10;


      for (const file of photoFiles) {

        if (
          !file.type.startsWith('image/')
        ) {
          continue;
        }

        const imageData =
          await readFileAsDataURL(file);

        const dimensions =
          await getImageDimensions(
            imageData
          );

        const maxWidth = 80;
        const maxHeight = 65;

        let width = maxWidth;

        let height =
          dimensions.height /
          dimensions.width *
          width;

        if (height > maxHeight) {

          height = maxHeight;

          width =
            dimensions.width /
            dimensions.height *
            height;
        }

        if (y + height > 280) {

          pdf.addPage();

          y = 20;

        }

        pdf.addImage(
          imageData,
          'JPEG',
          margin,
          y,
          width,
          height
        );

        y += height + 8;

      }

    }


    // ------------------------------------------------
    // SAVE
    // ------------------------------------------------

    const safeZone =
      (data.zone || 'Handover')
        .replace(
          /[^a-z0-9-_ ]/gi,
          ''
        )
        .replace(
          /\s+/g,
          '-'
        );

    const filename =
      `DGSL-${safeZone}-Handover-${today()}.pdf`;

    pdf.save(filename);


  } catch (error) {

    console.error(error);

    alert(
      'There was a problem creating the PDF. Check the browser console for details.'
    );

  }

};


// ----------------------------------------------------
// FILE READER
// ----------------------------------------------------

function readFileAsDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(reader.result);

      reader.onerror =
        reject;

      reader.readAsDataURL(file);
    }
  );
}


// ----------------------------------------------------
// IMAGE DIMENSIONS
// ----------------------------------------------------

function getImageDimensions(src) {

  return new Promise(
    resolve => {

      const img =
        new Image();

      img.onload = () => {

        resolve({
          width: img.width,
          height: img.height
        });

      };

      img.src = src;

    }
  );
}


// ----------------------------------------------------
// INITIAL DISPLAY
// ----------------------------------------------------

render();