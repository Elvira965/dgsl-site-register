// ============================================================
// DGSL SITE REGISTER
// Supabase Database + OneDrive PDFs
// Photos are NOT stored separately
// One Save button = Save + Generate PDF + OneDrive
// ============================================================

// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
'https://mgxbsxqgjxpdvdjsixqi.supabase.co';

const SUPABASE_KEY =
'sb_publishable_XWLtSyttiEMQA86unKN37A_ZC9OY19j';

// ============================================================
// MICROSOFT / ONEDRIVE
// ============================================================

// Paste your Application (client) ID here.

const MICROSOFT_CLIENT_ID =
'766b9298-9e69-4225-8999-d54a4d3838c2';

// Paste your Directory (tenant) ID here.

const MICROSOFT_TENANT_ID =
'88017a10-78cc-4c91-b10e-70f020b2be42';

const ONEDRIVE_FOLDER =
'DGSL Site Handover PDFs';

const GRAPH_SCOPE =
'Files.ReadWrite';

const MICROSOFT_REDIRECT_URI =
window.location.origin +
window.location.pathname;

// ============================================================
// APPLICATION VARIABLES
// ============================================================

let supabaseClient = null;

let records = [];

let editing = null;

let filter = 'All';

let msalInstance = null;

let microsoftAccount = null;

// ============================================================
// DOM HELPERS
// ============================================================

const $ =
s =>
document.querySelector(s);

const rows =
$('#rows');

const dlg =
$('#formDialog');

const form =
$('#handoverForm');

const today =
() =>
new Date()
.toISOString()
.slice(
0,
10
);

// ============================================================
// START SUPABASE
// ============================================================

async function loadSupabase() {

if (!window.supabase) {

```
await new Promise(
  (
    resolve,
    reject
  ) => {

    const script =
      document.createElement(
        'script'
      );


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
```

}

supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

}

// ============================================================
// START MICROSOFT AUTHENTICATION
// ============================================================

async function loadMicrosoft() {

if (
!window.msal
) {

```
throw new Error(
  'Microsoft authentication library did not load.'
);
```

}

msalInstance =
new msal.PublicClientApplication({

```
  auth: {

    clientId:
      MICROSOFT_CLIENT_ID,

    authority:
      `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`,

    redirectUri:
      MICROSOFT_REDIRECT_URI

  },


  cache: {

    cacheLocation:
      'localStorage',

    storeAuthStateInCookie:
      false

  }

});
```

await msalInstance.initialize();

const response =
await msalInstance
.handleRedirectPromise();

if (
response &&
response.account
) {

```
microsoftAccount =
  response.account;
```

}

const accounts =
msalInstance
.getAllAccounts();

if (
!microsoftAccount &&
accounts.length > 0
) {

```
microsoftAccount =
  accounts[0];
```

}

}

// ============================================================
// MICROSOFT LOGIN
// ============================================================

async function signIntoMicrosoft() {

if (
!msalInstance
) {

```
await loadMicrosoft();
```

}

if (
microsoftAccount
) {

```
return microsoftAccount;
```

}

const loginResponse =
await msalInstance
.loginPopup({

```
    scopes: [
      GRAPH_SCOPE
    ]

  });
```

microsoftAccount =
loginResponse.account;

return microsoftAccount;

}

// ============================================================
// GET MICROSOFT GRAPH ACCESS TOKEN
// ============================================================

async function getMicrosoftToken() {

const account =
await signIntoMicrosoft();

try {

```
const response =
  await msalInstance
    .acquireTokenSilent({

      scopes: [
        GRAPH_SCOPE
      ],

      account:
        account

    });


return response.accessToken;
```

} catch (error) {

```
console.log(
  'Silent token failed. Asking Microsoft to sign in again.'
);


const response =
  await msalInstance
    .acquireTokenPopup({

      scopes: [
        GRAPH_SCOPE
      ],

      account:
        account

    });


return response.accessToken;
```

}

}

// ============================================================
// DATABASE → WEBSITE
// ============================================================

function fromDatabase(
x
) {

return {

```
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
  []
```

};

}

// ============================================================
// WEBSITE → DATABASE
// ============================================================

function toDatabase(
x
) {

return {

```
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

notes:
  x.notes || null,

contractor_signer:
  x.contractorSigner || null,

dgsl_signer:
  x.dgslSigner || null,

contractor_signature:
  x.contractorSignature || null,

dgsl_signature:
  x.dgslSignature || null
```

};

}

// ============================================================
// LOAD RECORDS
// ============================================================

async function loadRecords() {

try {

```
const {
  data,
  error
} =
  await supabaseClient
    .from(
      'handovers'
    )
    .select('*');


if (error) {

  throw error;

}


records =
  (data || [])
    .map(
      fromDatabase
    );


render();
```

} catch (error) {

```
console.error(
  'Load error:',
  error
);


alert(
  'Could not load the handover register.'
);
```

}

}

// ============================================================
// REAL-TIME UPDATES
// ============================================================

function setupRealtime() {

supabaseClient

```
.channel(
  'handovers-live'
)

.on(

  'postgres_changes',

  {

    event:
      '*',

    schema:
      'public',

    table:
      'handovers'

  },

  async () => {

    await loadRecords();

  }

)

.subscribe();
```

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

```
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
```

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

```
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
```

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
filtered
.map(
x => `

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

<span class="status">

${esc(x.status)}

</span>

</td>

<td>
${esc(x.handover)}
</td>

<td>

<button
type="button"
data-edit="${esc(x.id)}"

>

Edit </button>

</td>

</tr>

`
)
.join('');

$('#empty')
.classList
.toggle(
'hidden',
filtered.length > 0
);

document
.querySelectorAll(
'[data-edit]'
)
.forEach(
button => {

```
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
```

}

// ============================================================
// OPEN FORM
// ============================================================

function open(
x
) {

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

```
  handoverDate:
    today()

};
```

for (
const [
key,
value
]
of Object.entries(
values
)
) {

```
const element =
  form.elements[key];


if (!element) {

  continue;

}


if (
  element.type ===
  'file'
) {

  continue;

}


if (
  key ===
  'photos'
) {

  continue;

}


element.value =
  value || '';
```

}

if (x) {

```
drawSavedSignature(
  $('#contractorSignature'),
  x.contractorSignature
);


drawSavedSignature(
  $('#dgslSignature'),
  x.dgslSignature
);
```

}

dlg.showModal();

}

// ============================================================
// NEW HANDOVER
// ============================================================

$('#newZone').onclick =
() =>
open();

// ============================================================
// CANCEL
// ============================================================

$('#cancel').onclick =
$('#cancel2').onclick =
() =>
dlg.close();

// ============================================================
// SAVE + PDF + ONEDRIVE
// ============================================================

form.onsubmit =
async e => {

```
e.preventDefault();


const saveButton =
  form.querySelector(
    '.form-actions .primary'
  );


try {

  if (saveButton) {

    saveButton.disabled =
      true;

    saveButton.textContent =
      'Saving...';

  }


  const x =
    Object.fromEntries(
      new FormData(
        form
      )
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
  // PHOTOS ARE NOT SAVED
  // ------------------------------------------------------

  x.photos =
    [];


  // ------------------------------------------------------
  // SAVE RECORD TO SUPABASE
  // ------------------------------------------------------

  const databaseRecord =
    toDatabase(
      x
    );


  if (editing) {

    const {
      error
    } =
      await supabaseClient
        .from(
          'handovers'
        )
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
        .from(
          'handovers'
        )
        .insert(
          databaseRecord
        );


    if (error) {

      throw error;

    }

  }


  // ------------------------------------------------------
  // GENERATE PDF
  // ------------------------------------------------------

  if (saveButton) {

    saveButton.textContent =
      'Generating PDF...';

  }


  const pdfBlob =
    await generatePdfBlob(
      x
    );


  // ------------------------------------------------------
  // SAVE PDF TO ONEDRIVE
  // ------------------------------------------------------

  if (saveButton) {

    saveButton.textContent =
      'Saving PDF to OneDrive...';

  }


  await uploadPdfToOneDrive(
    pdfBlob,
    x
  );


  // ------------------------------------------------------
  // COMPLETE
  // ------------------------------------------------------

  dlg.close();


  await loadRecords();


  alert(
    'Handover and PDF saved successfully.'
  );


} catch (error) {

  console.error(
    'Save error:',
    error
  );


  alert(
    'There was a problem saving the handover or PDF.\n\n' +
    error.message
  );


} finally {

  if (saveButton) {

    saveButton.disabled =
      false;

    saveButton.textContent =
      'Save handover';

  }

}
```

};

// ============================================================
// CREATE SAFE PDF FILENAME
// ============================================================

function getPdfFilename(
x
) {

const safeZone =
(
x.zone ||
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

// The ID is included so that editing the SAME
// handover always replaces the same PDF.

return (
`DGSL-${safeZone}-${x.id}.pdf`
);

}

// ============================================================
// FIND / CREATE ONEDRIVE FOLDER AND UPLOAD PDF
// ============================================================

async function uploadPdfToOneDrive(
pdfBlob,
record
) {

const token =
await getMicrosoftToken();

const filename =
getPdfFilename(
record
);

const encodedFolder =
encodeURIComponent(
ONEDRIVE_FOLDER
);

const encodedFilename =
encodeURIComponent(
filename
);

const url =
`https://graph.microsoft.com/v1.0/me/drive/root:/${encodedFolder}/${encodedFilename}:/content`;

const response =
await fetch(
url,
{

```
    method:
      'PUT',

    headers: {

      Authorization:
        `Bearer ${token}`,

      'Content-Type':
        'application/pdf'

    },

    body:
      pdfBlob

  }
);
```

if (
!response.ok
) {

```
const text =
  await response.text();


throw new Error(
  `OneDrive upload failed (${response.status}): ${text}`
);
```

}

return response.json();

}

// ============================================================
// GENERATE PDF BLOB
// ============================================================

async function generatePdfBlob(
data
) {

const {
jsPDF
} =
window.jspdf;

const pdf =
new jsPDF({

```
  orientation:
    'portrait',

  unit:
    'mm',

  format:
    'a4'

});
```

const margin =
15;

const pageWidth =
210;

let y =
20;

// ----------------------------------------------------------
// TITLE
// ----------------------------------------------------------

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

// ----------------------------------------------------------
// FIELD HELPER
// ----------------------------------------------------------

function addField(
label,
value
) {

```
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
      40
  );


pdf.text(
  lines,
  margin + 40,
  y
);


y +=
  Math.max(
    6,
    lines.length * 5
  );
```

}

// ----------------------------------------------------------
// DETAILS
// ----------------------------------------------------------

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
'Sub-Contractor',
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

// ----------------------------------------------------------
// WORK DESCRIPTION
// ----------------------------------------------------------

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

// ----------------------------------------------------------
// NOTES
// ----------------------------------------------------------

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

// ----------------------------------------------------------
// SIGNATURES
// ----------------------------------------------------------

if (
y > 230
) {

```
pdf.addPage();

y = 20;
```

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
`Sub-Contractor: ${
      data.contractorSigner || ''
    }`,
margin,
y
);

y += 5;

if (
data.contractorSignature
) {

```
pdf.addImage(
  data.contractorSignature,
  'PNG',
  margin,
  y,
  80,
  24
);
```

}

y += 32;

pdf.text(
`DGSL Representative: ${
      data.dgslSigner || ''
    }`,
margin,
y
);

y += 5;

if (
data.dgslSignature
) {

```
pdf.addImage(
  data.dgslSignature,
  'PNG',
  margin,
  y,
  80,
  24
);
```

}

// ----------------------------------------------------------
// CURRENT PHOTOS ONLY
// ----------------------------------------------------------

const photoFiles =
Array.from(
$('#photos').files
);

if (
photoFiles.length > 0
) {

```
pdf.addPage();


y =
  20;


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


for (
  const file
  of photoFiles
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
    addImageToPdf(
      pdf,
      imageData,
      y,
      margin
    );

}
```

}

return pdf.output(
'blob'
);

}

// ============================================================
// ADD IMAGE TO PDF
// ============================================================

function addImageToPdf(
pdf,
imageData,
y,
margin
) {

const img =
new Image();

img.src =
imageData;

const dimensions = {

```
width:
  img.naturalWidth ||
  img.width,

height:
  img.naturalHeight ||
  img.height
```

};

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

```
height =
  maxHeight;


width =
  (
    dimensions.width /
    dimensions.height
  ) *
  height;
```

}

if (
y + height >
280
) {

```
pdf.addPage();

y =
  20;
```

}

pdf.addImage(
imageData,
'JPEG',
margin,
y,
width,
height
);

return (
y +
height +
8
);

}

// ============================================================
// FILE → DATA URL
// ============================================================

function readFileAsDataURL(
file
) {

return new Promise(
(
resolve,
reject
) => {

```
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
```

);

}

// ============================================================
// PHOTO PREVIEW
// ============================================================

$('#photos').onchange =
e => {

```
const preview =
  $('#photoPreview');


preview.innerHTML =
  '';


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


    img.src =
      URL.createObjectURL(
        file
      );


    preview.appendChild(
      img
    );

  }
);
```

};

// ============================================================
// DELETE HANDOVER
// ============================================================

$('#delete').onclick =
async () => {

```
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
      .from(
        'handovers'
      )
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
```

};

// ============================================================
// FILTERS
// ============================================================

document
.querySelectorAll(
'[data-filter]'
)
.forEach(
button => {

```
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
```

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

```
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
```

}

function start(e) {

```
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
```

}

function move(e) {

```
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
```

}

function stop(e) {

```
if (!drawing) {

  return;

}


e.preventDefault();


drawing =
  false;


ctx.closePath();
```

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
passive:
false
}
);

canvas.addEventListener(
'touchmove',
move,
{
passive:
false
}
);

canvas.addEventListener(
'touchend',
stop,
{
passive:
false
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

```
return;
```

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

```
return;
```

}

const ctx =
canvas.getContext(
'2d'
);

const img =
new Image();

img.onload =
() => {

```
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
```

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

```
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
```

};

// ============================================================
// IMPORT BACKUP
// ============================================================

$('#import').onchange =
async e => {

```
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
          toDatabase(
            record
          );


        const {
          error
        } =
          await supabaseClient
            .from(
              'handovers'
            )
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
```

};

// ============================================================
// START APPLICATION
// ============================================================

async function startApp() {

try {

```
await loadSupabase();


await loadMicrosoft();


await loadRecords();


setupRealtime();
```

} catch (error) {

```
console.error(
  'Startup error:',
  error
);


alert(
  'The DGSL Site Register could not start correctly.'
);
```

}

}

startApp();
