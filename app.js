// ============================================================
// DGSL SITE REGISTER
// Supabase Database + Storage + Live Updates
// Photos + Signatures + PDF + Backup
// ============================================================

const SUPABASE_URL =
  'https://mgxbsxqgjxpdvdjsixqi.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_XWLtSyttiEMQA86unKN37A_ZC9OY19j';

const PHOTO_BUCKET =
  'handover-photos';

let supabaseClient = null;
let records = [];
let editing = null;
let filter = 'All';

const $ = s => document.querySelector(s);

const rows = $('#rows');
const dlg = $('#formDialog');
const form = $('#handoverForm');

const today = () =>
  new Date().toISOString().slice(0, 10);


// ============================================================
// START SUPABASE
// ============================================================

async function loadSupabase() {

  if (!window.supabase) {

    await new Promise((resolve, reject) => {

      const script =
        document.createElement('script');

      script.src =
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);

    });

  }

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
}


// ============================================================
// DATABASE → WEBSITE
// ============================================================

function fromDatabase(x) {

  let photos = [];

  try {

    photos =
      x.photos
        ? JSON.parse(x.photos)
        : [];

  } catch {

    photos = [];

  }

  return {

    id: x.id,

    zone: x.zone || '',

    level: x.level || '',

    drawing: x.drawing || '',

    trade: x.trade || '',

    contractor: x.contractor || '',

    foreman: x.foreman || '',

    healthSafetyScaffolding:
      x.health_safety_scaffolding || '',

    description:
      x.description || '',

    status:
      x.status || '',

    handover:
      x.handover || '',

    handoverDate:
      x.handover_date || '',

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

    photos: photos

  };

}


// ============================================================
// WEBSITE → DATABASE
// ============================================================

function toDatabase(x) {

  return {

    id: x.id,

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

    health_safety_scaffolding:
      x.healthSafetyScaffolding || null,

    description:
      x.description || null,

    status:
      x.status || null,

    handover:
      x.handover || null,

    handover_date:
      x.handoverDate || null,

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
      JSON.stringify(
        x.photos || []
      )

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
        .select('*');

    if (error) {
      throw error;
    }

    records =
      (data || [])
        .map(fromDatabase);

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
// REAL-TIME UPDATES
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
// HTML ESCAPE
// ============================================================

function esc(x = '') {

  return String(x)
    .replace(
      /[&<>"']/g,

      c => ({

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'

      }[c])

    );

}


// ============================================================
// RENDER
// ============================================================

function render() {

  const q =
    $('#search')
      ? $('#search')
        .value
        .toLowerCase()
      : '';

  const filtered =
    records.filter(
      x =>

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


  // ----------------------------------------------------------
  // SUMMARY COUNTERS
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // REGISTER TABLE
  // ONLY THESE COLUMNS:
  // Zone / Area
  // Sub-Contractor
  // Work Description
  // Status
  // Handover Date
  // ----------------------------------------------------------

  rows.innerHTML =
    filtered
      .map(
        x => `

        <tr>

          <td>
            <b>
              ${esc(x.zone)}
            </b>
          </td>


          <td>
            ${esc(x.contractor)}
          </td>


          <td>
            ${esc(x.description)}
          </td>


          <td>

            <span class="status">
              ${esc(x.status)}
            </span>

          </td>


          <td>
            ${esc(x.handoverDate)}
          </td>


          <td>

            <button
              type="button"
              data-edit="${esc(x.id)}"
            >
              Edit
            </button>

          </td>

        </tr>

        `
      )
      .join('');


  // ----------------------------------------------------------
  // EMPTY MESSAGE
  // ----------------------------------------------------------

  $('#empty')
    .classList
    .toggle(
      'hidden',
      filtered.length > 0
    );


  // ----------------------------------------------------------
  // EDIT BUTTONS
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      '[data-edit]'
    )
    .forEach(
      button => {

        button.onclick =
          function () {

            const id =
              this.getAttribute(
                'data-edit'
              );


            const record =
              records.find(
                x =>
                  String(x.id) ===
                  String(id)
              );


            if (record) {

              open(
                record
              );

            }

          };

      }
    );

}

// ============================================================
// OPEN FORM
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


  const values =
    x || {
      handoverDate:
        today()
    };


  for (
    const [key, value]
    of Object.entries(values)
  ) {

    const element =
      form.elements[key];

    if (!element) {
      continue;
    }


    if (
      element.type === 'file'
    ) {
      continue;
    }


    if (
      key === 'photos'
    ) {
      continue;
    }


    element.value =
      value || '';

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
  () => dlg.close();


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


      // ------------------------------------------------------
      // SIGNATURES
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // EXISTING PHOTOS
      // ------------------------------------------------------

      x.photos =
        editing?.photos
          ? [...editing.photos]
          : [];


      // ------------------------------------------------------
      // NEW PHOTOS
      // ------------------------------------------------------

      const files =
        Array.from(
          $('#photos').files
        );


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


        const photoUrl =
          await uploadPhoto(
            file,
            x.id
          );


        if (photoUrl) {

          x.photos.push(
            photoUrl
          );

        }

      }


      // ------------------------------------------------------
      // SAVE DATABASE RECORD
      // ------------------------------------------------------

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
// UPLOAD PHOTO
// ============================================================

async function uploadPhoto(
  file,
  handoverId
) {

  const extension =
    (
      file.name
        .split('.')
        .pop() ||
      'jpg'
    )
      .toLowerCase();


  const filename =
    `${handoverId}/${crypto.randomUUID()}.${extension}`;


  const {
    error
  } =
    await supabaseClient
      .storage
      .from(
        PHOTO_BUCKET
      )
      .upload(
        filename,
        file,
        {
          cacheControl:
            '3600',

          upsert:
            false
        }
      );


  if (error) {
    throw error;
  }


  const {
    data
  } =
    supabaseClient
      .storage
      .from(
        PHOTO_BUCKET
      )
      .getPublicUrl(
        filename
      );


  return data.publicUrl;

}


// ============================================================
// SHOW SAVED PHOTOS
// ============================================================

function showSavedPhotos(
  photos
) {

  const preview =
    $('#photoPreview');


  preview.innerHTML = '';


  if (
    !Array.isArray(photos)
  ) {

    return;

  }


  photos.forEach(
    url => {

      const img =
        document.createElement(
          'img'
        );


      img.src =
        url;


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
// PHOTO PREVIEW
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
// DELETE HANDOVER
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

      if (
        Array.isArray(
          editing.photos
        )
      ) {

        for (
          const url
          of editing.photos
        ) {

          await deletePhoto(
            url
          );

        }

      }


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
// DELETE PHOTO
// ============================================================

async function deletePhoto(
  url
) {

  try {

    const marker =
      `/object/public/${PHOTO_BUCKET}/`;


    const index =
      url.indexOf(
        marker
      );


    if (
      index === -1
    ) {

      return;

    }


    const path =
      decodeURIComponent(
        url.substring(
          index +
          marker.length
        )
      );


    await supabaseClient
      .storage
      .from(
        PHOTO_BUCKET
      )
      .remove(
        [path]
      );


  } catch (error) {

    console.error(
      'Photo delete error:',
      error
    );

  }

}


// ============================================================
// FILTERS
// ============================================================

document
  .querySelectorAll(
    '[data-filter]'
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          filter =
            button.dataset.filter;


          document
            .querySelectorAll(
              '[data-filter]'
            )
            .forEach(
              x => {

                x.classList.toggle(
                  'active',
                  x === button
                );

              }
            );


          render();

        };

    }
  );


// ============================================================
// SEARCH
// ============================================================

$('#search').oninput =
  render;


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
// RESTORE SIGNATURE
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
// INITIALISE SIGNATURES
// ============================================================

setupSignature(
  $('#contractorSignature')
);


setupSignature(
  $('#dgslSignature')
);


// ============================================================
// CLEAR SIGNATURE BUTTONS
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

          console.error(
            error
          );


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
