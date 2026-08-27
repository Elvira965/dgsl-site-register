// ============================================================
// DGSL SITE REGISTER
// Supabase + Live Updates + Photos + Signatures + PDF
// ============================================================

const SUPABASE_URL =
  'https://mgxbsxqgjxpdvdjsixqi.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_XWLtSyttiEMQA86unKN37A_ZC9OY19j';


// ============================================================
// SUPABASE CLIENT
// ============================================================

let supabaseClient = null;

async function loadSupabase() {

  if (window.supabase) {

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    return;
  }


  await new Promise(
    (resolve, reject) => {

      const script =
        document.createElement('script');

      script.src =
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

      script.onload =
        resolve;

      script.onerror =
        reject;

      document.head.appendChild(
        script
      );

    }
  );


  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
}


// ============================================================
// VARIABLES
// ============================================================

let records = [];

let editing = null;

let filter = 'All';

const $ =
  s => document.querySelector(s);

const rows =
  $('#rows');

const dlg =
  $('#formDialog');

const form =
  $('#handoverForm');


// ============================================================
// DATE
// ============================================================

const today = () =>
  new Date()
    .toISOString()
    .slice(0, 10);


// ============================================================
// DATABASE → WEBSITE
// ============================================================

function fromDatabase(x) {

  return {

    id:
      x.id,

    zone:
      x.zone || '',

    level:
      x.level || '',

    drawing:
      x.drawing || '',

    trade:
      x.trade || '',

    contractor:
      x.contractor || '',

    foreman:
      x.foreman || '',

    description:
      x.description || '',

    status:
      x.status || '',

    handover:
      x.handover || '',

    handoverDate:
      x.handover_date || '',

    closedDate:
      x.closed_date || '',

    notes:
      x.notes || '',

    contractorSigner:
      x.contractor_signer || '',

    dgslSigner:
      x.dgsl_signer || '',

    contractorSignature:
      x.contractor_signature || '',

    dgslSignature:
      x.dgsl_signature || '',

    photos:
      x.photos || ''
  };
}


// ============================================================
// WEBSITE → DATABASE
// ============================================================

function toDatabase(x) {

  return {

    id:
      x.id,

    zone:
      x.zone || null,

    level:
      x.level || null,

    drawing:
      x.drawing || null,

    trade:
      x.trade || null,

    contractor:
      x.contractor || null,

    foreman:
      x.foreman || null,

    description:
      x.description || null,

    status:
      x.status || null,

    handover:
      x.handover || null,

    handover_date:
      x.handoverDate || null,

    closed_date:
      x.closedDate || null,

    notes:
      x.notes || null,

    contractor_signer:
      x.contractorSigner || null,

    dgsl_signer:
      x.dgslSigner || null,

    contractor_signature:
      x.contractorSignature || null,

    dgsl_signature:
      x.dgslSignature || null,

    photos:
      x.photos || null
  };
}


// ============================================================
// LOAD RECORDS
// ============================================================

async function loadRecords() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from('handovers')
        .select('*')
        .order(
          'id',
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    records =
      (data || [])
        .map(
          fromDatabase
        );


    render();

  } catch (error) {

    console.error(
      'Load error:',
      error
    );


    alert(
      'Could not load the handover register.'
    );
  }
}


// ============================================================
// LIVE REAL-TIME UPDATES
// ============================================================

function setupRealtime() {

  supabaseClient
    .channel(
      'handovers-live'
    )

    .on(

      'postgres_changes',

      {
        event: '*',

        schema: 'public',

        table: 'handovers'

      },

      async () => {

        await loadRecords();

      }

    )

    .subscribe();

}


// ============================================================
// ESCAPE HTML
// ============================================================

function esc(
  x = ''
) {

  return String(x)
    .replace(
      /[&<>"']/g,

      c => ({

        '&':
          '&amp;',

        '<':
          '&lt;',

        '>':
          '&gt;',

        '"':
          '&quot;',

        "'":
          '&#39;'

      }[c])
    );
}


// ============================================================
// RENDER REGISTER
// ============================================================

function render() {

  const searchBox =
    $('#search');

  const q =
    searchBox
      ? searchBox.value
        .toLowerCase()
      : '';


  const a =
    records.filter(x =>

      (
        filter === 'All' ||
        x.status === filter
      )

      &&

      Object.values(x)
        .join(' ')
        .toLowerCase()
        .includes(q)

    );


  $('#total').textContent =
    records.length;


  $('#progress').textContent =
    records.filter(
      x =>
        x.status ===
        'In Progress'
    ).length;


  $('#closed').textContent =
    records.filter(
      x =>
        x.status ===
        'Closed Out'
    ).length;


  $('#hold').textContent =
    records.filter(
      x =>
        x.status ===
        'On Hold'
    ).length;


  rows.innerHTML =
    a.map(x => `

      <tr>

        <td>

          <b>
            ${esc(x.zone)}
          </b>

          <br>

          <small>
            ${esc(x.drawing)}
          </small>

        </td>


        <td>
          ${esc(x.level)}
        </td>


        <td>
          ${esc(x.trade)}
        </td>


        <td>

          ${esc(x.contractor)}

          <br>

          <small>
            ${esc(x.foreman)}
          </small>

        </td>


        <td>
          ${esc(x.description)}
        </td>


        <td>

          <span
            class="status ${esc(
              x.status.split(' ')[0]
            )}"
          >

            ${esc(x.status)}

          </span>

        </td>


        <td>
          ${esc(x.handover)}
        </td>


        <td>
          ${esc(x.closedDate || '')}
        </td>


        <td>

          <button
            data-edit="${x.id}"
          >
            Edit
          </button>

        </td>

      </tr>

    `).join('');


  $('#empty')
    .classList
    .toggle(
      'hidden',
      a.length > 0
    );


  document
    .querySelectorAll(
      '[data-edit]'
    )
    .forEach(button => {

      button.onclick =
        () => {

          const record =
            records.find(
              x =>
                x.id ===
                button.dataset.edit
            );


          open(record);

        };

    });

}


// ============================================================
// OPEN HANDOVER
// ============================================================

function open(x) {

  editing =
    x || null;


  $('#formTitle')
    .textContent =
      x
        ? 'Edit handover'
        : 'New handover';


  $('#delete')
    .classList
    .toggle(
      'hidden',
      !x
    );


  form.reset();


  clearSignature(
    $('#contractorSignature')
  );


  clearSignature(
    $('#dgslSignature')
  );


  $('#photoPreview')
    .innerHTML = '';


  const defaults =
    x || {
      handoverDate:
        today()
    };


  for (
    const [key, value]
    of Object.entries(
      defaults
    )
  ) {

    if (
      form.elements[key]
    ) {

      form.elements[key]
        .value =
          value || '';

    }

  }


  if (x) {

    drawSavedSignature(
      $('#contractorSignature'),
      x.contractorSignature
    );


    drawSavedSignature(
      $('#dgslSignature'),
      x.dgslSignature
    );


    showSavedPhotos(
      x.photos
    );

  }


  dlg.showModal();
}


// ============================================================
// NEW HANDOVER
// ============================================================

$('#newZone').onclick =
  () => open();


// ============================================================
// CANCEL
// ============================================================

$('#cancel').onclick =
$('#cancel2').onclick =
  () =>
    dlg.close();


// ============================================================
// SAVE HANDOVER
// ============================================================

form.onsubmit =
  async e => {

    e.preventDefault();


    try {

      const x =
        Object.fromEntries(
          new FormData(form)
        );


      x.id =
        editing?.id ||
        crypto.randomUUID();


      if (
        x.status ===
          'Closed Out' &&
        !x.closedDate
      ) {

        x.closedDate =
          today();

      }


      // Save signatures

      x.contractorSignature =
        $('#contractorSignature')
          .toDataURL(
            'image/png'
          );


      x.dgslSignature =
        $('#dgslSignature')
          .toDataURL(
            'image/png'
          );


      // Keep previously saved photos

      if (editing) {

        x.photos =
          editing.photos || '';

      } else {

        x.photos = '';

      }


      // Save new photos

      const files =
        Array.from(
          $('#photos').files
        );


      if (
        files.length > 0
      ) {

        const newPhotos =
          await convertPhotosToData(
            files
          );


        const oldPhotos =
          x.photos
            ? x.photos.split('|')
            : [];


        x.photos =
          [
            ...oldPhotos,
            ...newPhotos
          ]
          .filter(Boolean)
          .join('|');

      }


      const databaseRecord =
        toDatabase(x);


      if (editing) {

        const {
          error
        } =
          await supabaseClient
            .from('handovers')
            .update(
              databaseRecord
            )
            .eq(
              'id',
              x.id
            );


        if (error) {
          throw error;
        }

      } else {

        const {
          error
        } =
          await supabaseClient
            .from('handovers')
            .insert(
              databaseRecord
            );


        if (error) {
          throw error;
        }

      }


      dlg.close();


      await loadRecords();

    } catch (error) {

      console.error(
        'Save error:',
        error
      );


      alert(
        'There was a problem saving the handover.'
      );

    }

  };


// ============================================================
// DELETE
// ============================================================

$('#delete').onclick =
  async () => {

    if (!editing) {
      return;
    }


    if (
      !confirm(
        'Delete this handover record?'
      )
    ) {

      return;

    }


    try {

      const {
        error
      } =
        await supabaseClient
          .from('handovers')
          .delete()
          .eq(
            'id',
            editing.id
          );


      if (error) {
        throw error;
      }


      dlg.close();


      await loadRecords();

    } catch (error) {

      console.error(
        'Delete error:',
        error
      );


      alert(
        'There was a problem deleting the handover.'
      );

    }

  };


// ============================================================
// FILTERS
// ============================================================

document
  .querySelectorAll(
    '[data-filter]'
  )
  .forEach(button => {

    button.onclick =
      () => {

        filter =
          button.dataset.filter;


        document
          .querySelectorAll(
            '[data-filter]'
          )
          .forEach(x => {

            x.classList.toggle(
              'active',
              x === button
            );

          });


        render();

      };

  });


// ============================================================
// SEARCH
// ============================================================

$('#search').oninput =
  render;


// ============================================================
// CONVERT PHOTOS TO DATA
// ============================================================

async function convertPhotosToData(
  files
) {

  const photos = [];


  for (
    const file
    of files
  ) {

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      continue;

    }


    const data =
      await readFileAsDataURL(
        file
      );


    photos.push(
      data
    );

  }


  return photos;
}


// ============================================================
// DISPLAY SAVED PHOTOS
// ============================================================

function showSavedPhotos(
  photoString
) {

  const preview =
    $('#photoPreview');


  preview.innerHTML = '';


  if (!photoString) {
    return;
  }


  const photos =
    photoString
      .split('|')
      .filter(Boolean);


  photos.forEach(
    photo => {

      const img =
        document.createElement(
          'img'
        );


      img.src =
        photo;


      img.style.width =
        '110px';


      img.style.height =
        '80px';


      img.style.objectFit =
        'cover';


      img.style.borderRadius =
        '6px';


      img.style.border =
        '1px solid #ccc';


      img.style.marginRight =
        '6px';


      img.style.marginBottom =
        '6px';


      preview.appendChild(
        img
      );

    }
  );
}


// ============================================================
// NEW PHOTO PREVIEW
// ============================================================

$('#photos').onchange =
  e => {

    const preview =
      $('#photoPreview');


    const files =
      Array.from(
        e.target.files
      );


    files.forEach(
      file => {

        if (
          !file.type.startsWith(
            'image/'
          )
        ) {

          return;

        }


        const img =
          document.createElement(
            'img'
          );


        img.style.width =
          '110px';


        img.style.height =
          '80px';


        img.style.objectFit =
          'cover';


        img.style.borderRadius =
          '6px';


        img.style.border =
          '1px solid #ccc';


        img.style.marginRight =
          '6px';


        img.style.marginBottom =
          '6px';


        img.src =
          URL.createObjectURL(
            file
          );


        preview.appendChild(
          img
        );

      }
    );

  };


// ============================================================
// SIGNATURE PAD
// ============================================================

function setupSignature(
  canvas
) {

  const ctx =
    canvas.getContext(
      '2d'
    );


  ctx.lineWidth =
    2;


  ctx.lineCap =
    'round';


  ctx.lineJoin =
    'round';


  let drawing =
    false;


  function position(e) {

    const rect =
      canvas.getBoundingClientRect();


    const source =
      e.touches
        ? e.touches[0]
        : e;


    return {

      x:
        (
          source.clientX -
          rect.left
        ) *
        (
          canvas.width /
          rect.width
        ),

      y:
        (
          source.clientY -
          rect.top
        ) *
        (
          canvas.height /
          rect.height
        )

    };

  }


  function start(e) {

    e.preventDefault();


    drawing =
      true;


    const p =
      position(e);


    ctx.beginPath();


    ctx.moveTo(
      p.x,
      p.y
    );

  }


  function move(e) {

    if (!drawing) {
      return;
    }


    e.preventDefault();


    const p =
      position(e);


    ctx.lineTo(
      p.x,
      p.y
    );


    ctx.stroke();

  }


  function stop(e) {

    if (!drawing) {
      return;
    }


    e.preventDefault();


    drawing =
      false;


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
    {
      passive: false
    }
  );


  canvas.addEventListener(
    'touchmove',
    move,
    {
      passive: false
    }
  );


  canvas.addEventListener(
    'touchend',
    stop,
    {
      passive: false
    }
  );

}


// ============================================================
// CLEAR SIGNATURE
// ============================================================

function clearSignature(
  canvas
) {

  if (!canvas) {
    return;
  }


  const ctx =
    canvas.getContext(
      '2d'
    );


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

}


// ============================================================
// RESTORE SAVED SIGNATURE
// ============================================================

function drawSavedSignature(
  canvas,
  dataUrl
) {

  if (
    !canvas ||
    !dataUrl
  ) {

    return;

  }


  const ctx =
    canvas.getContext(
      '2d'
    );


  const img =
    new Image();


  img.onload =
    () => {

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );


      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

    };


  img.src =
    dataUrl;
}


// ============================================================
// SET UP SIGNATURES
// ============================================================

setupSignature(
  $('#contractorSignature')
);


setupSignature(
  $('#dgslSignature')
);


// ============================================================
// CLEAR BUTTONS
// ============================================================

$('#clearContractorSignature')
  .onclick =
    () =>
      clearSignature(
        $('#contractorSignature')
      );


$('#clearDgslSignature')
  .onclick =
    () =>
      clearSignature(
        $('#dgslSignature')
      );


// ============================================================
// EXPORT BACKUP
// ============================================================

$('#export').onclick =
  () => {

    const link =
      document.createElement(
        'a'
      );


    link.href =
      URL.createObjectURL(

        new Blob(

          [
            JSON.stringify(
              records,
              null,
              2
            )
          ],

          {
            type:
              'application/json'
          }

        )

      );


    link.download =
      `DGSL-site-register-${today()}.json`;


    link.click();


    URL.revokeObjectURL(
      link.href
    );

  };


// ============================================================
// IMPORT BACKUP
// ============================================================

$('#import').onchange =
  async e => {

    const file =
      e.target.files[0];


    if (!file) {
      return;
    }


    const reader =
      new FileReader();


    reader.onload =
      async () => {

        try {

          const imported =
            JSON.parse(
              reader.result
            );


          if (
            !Array.isArray(
              imported
            )
          ) {

            throw new Error(
              'Invalid backup'
            );

          }


          for (
            const record
            of imported
          ) {

            const databaseRecord =
              toDatabase(record);


            const {
              error
            } =
              await supabaseClient
                .from('handovers')
                .upsert(
                  databaseRecord
                );


            if (error) {
              throw error;
            }

          }


          await loadRecords();


          alert(
            'Backup imported.'
          );


        } catch (error) {

          console.error(error);


          alert(
            'That file is not a valid DGSL backup.'
          );

        }

      };


    reader.readAsText(
      file
    );

  };


// ============================================================
// PDF GENERATION
// ============================================================

$('#generatePdf').onclick =
  async () => {

    try {

      const {
        jsPDF
      } =
        window.jspdf;


      const pdf =
        new jsPDF({

          orientation:
            'portrait',

          unit:
            'mm',

          format:
            'a4'

        });


      const margin =
        15;


      const pageWidth =
        210;


      let y =
        20;


      // TITLE

      pdf.setFontSize(
        20
      );


      pdf.setFont(
        undefined,
        'bold'
      );


      pdf.text(
        'DGSL SITE HANDOVER',
        margin,
        y
      );


      y += 8;


      pdf.setFontSize(
        10
      );


      pdf.setFont(
        undefined,
        'normal'
      );


      pdf.text(
        'Site Handover Record',
        margin,
        y
      );


      y += 10;


      pdf.line(
        margin,
        y,
        pageWidth - margin,
        y
      );


      y += 8;


      const data =
        Object.fromEntries(
          new FormData(form)
        );


      function addField(
        label,
        value
      ) {

        pdf.setFont(
          undefined,
          'bold'
        );


        pdf.setFontSize(
          10
        );


        pdf.text(
          `${label}:`,
          margin,
          y
        );


        pdf.setFont(
          undefined,
          'normal'
        );


        const lines =
          pdf.splitTextToSize(

            value || '',

            pageWidth -
              margin * 2 -
              35

          );


        pdf.text(
          lines,
          margin + 35,
          y
        );


        y +=
          Math.max(
            6,
            lines.length * 5
          );

      }


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


      pdf.setFont(
        undefined,
        'bold'
      );


      pdf.text(
        'Work Description',
        margin,
        y
      );


      y += 6;


      pdf.setFont(
        undefined,
        'normal'
      );


      const descriptionLines =
        pdf.splitTextToSize(

          data.description || '',

          pageWidth -
            margin * 2

        );


      pdf.text(
        descriptionLines,
        margin,
        y
      );


      y +=
        Math.max(
          8,
          descriptionLines.length * 5
        );


      // NOTES

      y += 3;


      pdf.setFont(
        undefined,
        'bold'
      );


      pdf.text(
        'Notes / Outstanding Items',
        margin,
        y
      );


      y += 6;


      pdf.setFont(
        undefined,
        'normal'
      );


      const noteLines =
        pdf.splitTextToSize(

          data.notes || '',

          pageWidth -
            margin * 2

        );


      pdf.text(
        noteLines,
        margin,
        y
      );


      y +=
        Math.max(
          12,
          noteLines.length * 5
        );


      // SIGNATURES

      if (
        y > 230
      ) {

        pdf.addPage();


        y = 20;

      }


      pdf.setFont(
        undefined,
        'bold'
      );


      pdf.text(
        'Signatures',
        margin,
        y
      );


      y += 8;


      pdf.setFont(
        undefined,
        'normal'
      );


      pdf.text(
        `Contractor / Foreman: ${
          data.contractorSigner || ''
        }`,
        margin,
        y
      );


      y += 5;


      pdf.addImage(

        $('#contractorSignature')
          .toDataURL(
            'image/png'
          ),

        'PNG',

        margin,

        y,

        80,

        24

      );


      y += 32;


      pdf.text(
        `DGSL Representative: ${
          data.dgslSigner || ''
        }`,
        margin,
        y
      );


      y += 5;


      pdf.addImage(

        $('#dgslSignature')
          .toDataURL(
            'image/png'
          ),

        'PNG',

        margin,

        y,

        80,

        24

      );


      // ======================================================
      // PHOTOS
      // ======================================================

      const newPhotoFiles =
        Array.from(
          $('#photos').files
        );


      const savedPhotos =
        editing?.photos
          ? editing.photos
              .split('|')
              .filter(Boolean)
          : [];


      if (
        newPhotoFiles.length ||
        savedPhotos.length
      ) {

        pdf.addPage();


        y = 20;


        pdf.setFontSize(
          16
        );


        pdf.setFont(
          undefined,
          'bold'
        );


        pdf.text(
          'SITE PHOTOS',
          margin,
          y
        );


        y += 10;


        // NEW PHOTOS

        for (
          const file
          of newPhotoFiles
        ) {

          if (
            !file.type.startsWith(
              'image/'
            )
          ) {

            continue;

          }


          const imageData =
            await readFileAsDataURL(
              file
            );


          y =
            await addImageToPdf(
              pdf,
              imageData,
              y,
              margin
            );

        }


        // SAVED PHOTOS

        for (
          const imageData
          of savedPhotos
        ) {

          y =
            await addImageToPdf(
              pdf,
              imageData,
              y,
              margin
            );

        }

      }


      // SAVE

      const safeZone =
        (
          data.zone ||
          'Handover'
        )

          .replace(
            /[^a-z0-9-_ ]/gi,
            ''
          )

          .replace(
            /\s+/g,
            '-'
          );


      pdf.save(
        `DGSL-${safeZone}-Handover-${today()}.pdf`
      );


    } catch (error) {

      console.error(
        'PDF error:',
        error
      );


      alert(
        'There was a problem creating the PDF.'
      );

    }

  };


// ============================================================
// ADD IMAGE TO PDF
// ============================================================

async function addImageToPdf(
  pdf,
  imageData,
  y,
  margin
) {

  if (
    y > 260
  ) {

    pdf.addPage();


    y = 20;

  }


  const dimensions =
    await getImageDimensions(
      imageData
    );


  const maxWidth =
    80;


  const maxHeight =
    65;


  let width =
    maxWidth;


  let height =
    (
      dimensions.height /
      dimensions.width
    ) *
    width;


  if (
    height >
    maxHeight
  ) {

    height =
      maxHeight;


    width =
      (
        dimensions.width /
        dimensions.height
      ) *
      height;

  }


  if (
    y + height >
    280
  ) {

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


  return y +
    height +
    8;
}


// ============================================================
// FILE READER
// ============================================================

function readFileAsDataURL(
  file
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();


      reader.onload =
        () =>
          resolve(
            reader.result
          );


      reader.onerror =
        reject;


      reader.readAsDataURL(
        file
      );

    }
  );

}


// ============================================================
// IMAGE DIMENSIONS
// ============================================================

function getImageDimensions(
  src
) {

  return new Promise(
    resolve => {

      const img =
        new Image();


      img.onload =
        () => {

          resolve({

            width:
              img.width,

            height:
              img.height

          });

        };


      img.src =
        src;

    }
  );

}


// ============================================================
// START APPLICATION
// ============================================================

async function startApp() {

  try {

    await loadSupabase();


    await loadRecords();


    setupRealtime();


  } catch (error) {

    console.error(
      'Startup error:',
      error
    );


    alert(
      'The DGSL Site Register could not connect to Supabase.'
    );

  }

}


startApp();
