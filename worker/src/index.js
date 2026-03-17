import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { CURSIVE_FONT_BASE64 } from './cursive-font.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PDF_URL = 'https://kineticop1958-lab.github.io/kineticop/forms/Patient_Info_Medical_History_HIPAA_AOB.pdf';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// PDF coordinate helper
// pdfplumber: y=0 at top, increases downward
// pdf-lib: y=0 at bottom, increases upward
// To place text just ABOVE a line at pdfplumber y: pdf-lib y = 792 - pdfplumberY + offset
// Lines are underscores; text sits ~3pts above the line
function aboveLine(lineY) {
  return 792 - lineY + 3;
}

// For checkboxes (small rects), place X centered in the box
// Box top in pdfplumber coords, pdf-lib needs bottom-up
function inBox(boxTop) {
  return 792 - boxTop - 8;
}

async function fillOriginalPdf(fields) {
  const pdfResponse = await fetch(PDF_URL);
  const pdfBytes = await pdfResponse.arrayBuffer();
  const pdf = await PDFDocument.load(pdfBytes);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const cursiveFontBytes = Uint8Array.from(atob(CURSIVE_FONT_BASE64), c => c.charCodeAt(0));
  const cursiveFont = await pdf.embedFont(cursiveFontBytes);
  const fontSize = 9;
  const color = rgb(0, 0, 0.6);

  const pages = pdf.getPages();
  const p1 = pages[0];
  const p2 = pages[1];
  const p3 = pages[2];

  function draw(page, text, x, pdfLibY) {
    if (!text) return;
    page.drawText(String(text), { x, y: pdfLibY, size: fontSize, font, color });
  }

  // ===== PAGE 1: PATIENT INFORMATION =====
  // Lines extracted from PDF (pdfplumber y coords):
  // PATIENT NAME line: x0=216.5 y=145 to x1=474
  // DOB line: x0=507 y=145 to x1=568
  draw(p1, fields.patientName, 218, aboveLine(145));
  draw(p1, fields.dob, 508, aboveLine(145));

  // ADDRESS line: x0=193 y=161 to x1=568
  draw(p1, fields.address, 194, aboveLine(161));

  // CITY line: x0=169.5 y=177 to x1=394
  // STATE line: x0=436.5 y=177 to x1=462
  // ZIP line: x0=489 y=177 to x1=568
  draw(p1, fields.city, 171, aboveLine(177));
  draw(p1, fields.state, 438, aboveLine(177));
  draw(p1, fields.zip, 490, aboveLine(177));

  // CELL PHONE line: x0=207 y=193 to x1=344
  // HOME PHONE line: x0=418.5 y=193 to x1=568
  draw(p1, fields.cellPhone, 208, aboveLine(193));
  draw(p1, fields.homePhone, 420, aboveLine(193));

  // EMERGENCY CONTACT line: x0=317 y=209 to x1=568
  const emergencyContact = [fields.emergencyName, fields.emergencyPhone].filter(Boolean).join(' ');
  draw(p1, emergencyContact, 318, aboveLine(209));

  // EMAIL line: x0=177 y=225 to x1=568
  draw(p1, fields.email, 178, aboveLine(225));

  // HEIGHT line: x0=183 y=241 to x1=264
  // WEIGHT line: x0=313 y=241 to x1=372
  draw(p1, fields.height, 184, aboveLine(241));
  draw(p1, fields.weight, 314, aboveLine(241));

  // DIABETIC: circle the printed YES or NO text
  // YES at x0=429.5 x1=447.5 y0=232.9 y1=241.9 | NO at x0=463.5 x1=477.0 y0=232.9 y1=241.9
  if (fields.diabetic === 'Yes') {
    p1.drawEllipse({ x: 439, y: 792 - 237, xScale: 14, yScale: 8, borderColor: color, borderWidth: 1.5 });
  } else if (fields.diabetic === 'No') {
    p1.drawEllipse({ x: 470, y: 792 - 237, xScale: 12, yScale: 8, borderColor: color, borderWidth: 1.5 });
  }

  // PRIMARY INSURANCE line: x0=246.5 y=281 to x1=568
  draw(p1, fields.primaryInsurance, 248, aboveLine(281));
  // POLICY # line: x0=190 y=297 to x1=364
  // GROUP # line: x0=417.5 y=297 to x1=568
  draw(p1, fields.primaryPolicy, 191, aboveLine(297));
  draw(p1, fields.primaryGroup, 419, aboveLine(297));
  // PHONE line: x0=181 y=313 to x1=364
  draw(p1, fields.primaryPhone, 182, aboveLine(313));

  // SECONDARY INSURANCE line: x0=262.5 y=342 to x1=568
  draw(p1, fields.secondaryInsurance, 264, aboveLine(342));
  // POLICY # line: x0=190 y=358 to x1=364
  // GROUP # line: x0=417.5 y=358 to x1=568
  draw(p1, fields.secondaryPolicy, 191, aboveLine(358));
  draw(p1, fields.secondaryGroup, 419, aboveLine(358));
  // PHONE line: x0=181 y=374 to x1=364
  draw(p1, fields.secondaryPhone, 182, aboveLine(374));

  // REFERRING PHYSICIAN line: x0=253.5 y=403 to x1=424
  // PHONE line: x0=469 y=403 to x1=568
  draw(p1, fields.referringPhysician, 255, aboveLine(403));
  draw(p1, fields.referringPhone, 470, aboveLine(403));
  // PRIMARY PHYSICIAN line: x0=242 y=419 to x1=424
  // PHONE line: x0=469 y=419 to x1=568
  draw(p1, fields.primaryPhysician, 243, aboveLine(419));
  draw(p1, fields.primaryPhysicianPhone, 470, aboveLine(419));
  // DIABETIC PHYSICIAN line: x0=243 y=435 to x1=424
  // PHONE line: x0=469 y=435 to x1=568
  draw(p1, fields.diabeticPhysician, 244, aboveLine(435));
  draw(p1, fields.diabeticPhysicianPhone, 470, aboveLine(435));

  // MEDICAL HISTORY on page 1
  // Checkboxes for accidents (rects):
  // Employment: x0=144 y0=470 to y1=478
  // Auto: x0=144 y0=484 to y1=492
  // Other: x0=144 y0=498 to y1=506
  if (fields.employmentAccident === 'Yes') draw(p1, 'X', 145, inBox(470));
  if (fields.autoAccident === 'Yes') draw(p1, 'X', 145, inBox(484));
  if (fields.otherAccident === 'Yes') draw(p1, 'X', 145, inBox(498));

  // Explain line: x0=435.1 y=506 to x1=568 (short), then full line x0=144 y=520
  if (fields.accidentDescription) {
    const desc = String(fields.accidentDescription);
    if (desc.length <= 26) {
      draw(p1, desc, 436, aboveLine(506));
    } else {
      draw(p1, desc.substring(0, 26), 436, aboveLine(506));
      draw(p1, desc.substring(26, 110), 146, aboveLine(520));
    }
  }

  // General Health checkboxes (rects):
  // Poor: x0=214.5 y0=528 to y1=536
  // Fair: x0=248.5 y0=528 to y1=536
  // Good: x0=279 y0=528 to y1=536
  // Excellent: x0=316 y0=528 to y1=536
  const healthBoxX = { Poor: 215, Fair: 249, Good: 280, Excellent: 317 };
  if (fields.generalHealth && healthBoxX[fields.generalHealth]) {
    draw(p1, 'X', healthBoxX[fields.generalHealth], inBox(528));
  }

  // Any health issues line: x0=315.1 y=550 to x1=568
  draw(p1, fields.otherHealthIssues, 316, aboveLine(550));

  // Reason for visit line: x0=239.5 y=564 to x1=568, continuation: x0=144 y=578
  if (fields.reasonForVisit) {
    const rv = String(fields.reasonForVisit);
    if (rv.length <= 65) {
      draw(p1, rv, 241, aboveLine(564));
    } else {
      draw(p1, rv.substring(0, 65), 241, aboveLine(564));
      draw(p1, rv.substring(65, 149), 146, aboveLine(578));
    }
  }

  // Same/similar device line: x0=335.6 y=592
  if (fields.similarDevice === 'Yes') draw(p1, 'Yes', 337, aboveLine(592));
  if (fields.similarDevice === 'No') draw(p1, 'No', 337, aboveLine(592));

  // When line: x0=194.5 y=606 to x1=294
  // From what company line: x0=392.5 y=606 to x1=568
  draw(p1, fields.similarDeviceWhen, 196, aboveLine(606));
  draw(p1, fields.similarDeviceCompany, 394, aboveLine(606));

  // Activities/Hobbies line: x0=221.5 y=620 to x1=568, continuation: x0=144 y=634
  if (fields.activities) {
    const act = String(fields.activities);
    if (act.length <= 69) {
      draw(p1, act, 223, aboveLine(620));
    } else {
      draw(p1, act.substring(0, 69), 223, aboveLine(620));
      draw(p1, act.substring(69, 153), 146, aboveLine(634));
    }
  }


  // ===== PAGE 2: MEDICAL HISTORY (detailed) =====
  // Lines: Visit Date x0=96.9 y=133, Patient Name x0=111.3 y=155, DOB x0=467.7 y=155
  draw(p2, fields.signatureDate, 98, aboveLine(133));
  draw(p2, fields.patientName, 113, aboveLine(155));
  draw(p2, fields.dob, 469, aboveLine(155));

  // All checkboxes from exact PDF rect extraction:
  // General Health: Excellent x=124.6,y=173 | Good x=184.2,y=173 | Fair x=227.6,y=173
  if (fields.generalHealth === 'Excellent') draw(p2, 'X', 126, inBox(173));
  if (fields.generalHealth === 'Good') draw(p2, 'X', 186, inBox(173));
  if (fields.generalHealth === 'Fair') draw(p2, 'X', 229, inBox(173));

  // Tobacco: Yes x=116.2,y=195 | No x=152.5,y=195
  if (fields.tobaccoUse === 'Yes') draw(p2, 'X', 118, inBox(195));
  if (fields.tobaccoUse === 'No') draw(p2, 'X', 154, inBox(195));

  // Falls: Yes x=179.6,y=217 | No x=215.8,y=217
  if (fields.falls === 'Yes') draw(p2, 'X', 181, inBox(217));
  if (fields.falls === 'No') draw(p2, 'X', 217, inBox(217));

  // Hospital/ER: Yes x=320.7,y=239 | No x=357.0,y=239
  if (fields.hospitalVisit === 'Yes') draw(p2, 'X', 322, inBox(239));
  if (fields.hospitalVisit === 'No') draw(p2, 'X', 358, inBox(239));

  // Employment Accident: Yes x=190.1,y=267 | No x=226.4,y=267
  if (fields.employmentAccident === 'Yes') draw(p2, 'X', 192, inBox(267));
  if (fields.employmentAccident === 'No') draw(p2, 'X', 228, inBox(267));
  // Employment Date line: x0=281.8 y=275, State line: x0=408.6 y=275
  draw(p2, fields.accidentDate, 283, aboveLine(275));
  draw(p2, fields.accidentState, 410, aboveLine(275));
  // Description of Accident line: x0=192.3 y=293
  if (fields.accidentDescription) draw(p2, fields.accidentDescription, 194, aboveLine(293));

  // Auto Accident: Yes x=127.9,y=307 | No x=164.1,y=307
  if (fields.autoAccident === 'Yes') draw(p2, 'X', 129, inBox(307));
  if (fields.autoAccident === 'No') draw(p2, 'X', 166, inBox(307));
  // Auto Date line: x0=219.6 y=315, State line: x0=376.4 y=315
  if (fields.autoAccident === 'Yes') {
    draw(p2, fields.accidentDate, 221, aboveLine(315));
    draw(p2, fields.accidentState, 378, aboveLine(315));
  }

  // Other Accident line: x0=125.8 y=337
  if (fields.otherAccident === 'Yes') draw(p2, fields.accidentDescription, 127, aboveLine(337));

  // Condition Since Birth: Yes x=162.3,y=353 | No x=198.6,y=353
  if (fields.otherAccident === 'Yes') draw(p2, 'X', 164, inBox(353));
  if (fields.otherAccident === 'No') draw(p2, 'X', 200, inBox(353));

  // Same/Similar Device: Yes x=356.4,y=379 | No x=392.6,y=379
  if (fields.similarDevice === 'Yes') draw(p2, 'X', 358, inBox(379));
  if (fields.similarDevice === 'No') draw(p2, 'X', 394, inBox(379));
  // Details line: x0=252.3 y=405
  const deviceDetails = [fields.similarDeviceWhen, fields.similarDeviceCompany].filter(Boolean).join(', ');
  if (deviceDetails) draw(p2, deviceDetails, 254, aboveLine(405));

  // Amputation: Yes x=190.7,y=419 | No x=226.9,y=419
  if (fields.amputation === 'Yes') draw(p2, 'X', 192, inBox(419));
  if (fields.amputation === 'No') draw(p2, 'X', 228, inBox(419));

  // Medical conditions - exact checkbox positions from PDF rects
  const conditionMap = {
    'Heart Problems':          { x: 44, cy: 482 },
    'Hepatitis C':             { x: 224, cy: 482 },
    'Alzheimer Disease':       { x: 404, cy: 482 },
    'Hypertension':            { x: 44, cy: 510 },
    'HIV Positive':            { x: 224, cy: 510 },
    'Psychiatric Problems':    { x: 404, cy: 510 },
    'Vascular Disease':        { x: 44, cy: 538 },
    'Rheumatoid Arthritis':    { x: 224, cy: 538 },
    'Alcoholism':              { x: 404, cy: 538 },
    'Stroke':                  { x: 44, cy: 566 },
    'Obesity':                 { x: 224, cy: 566 },
    'Pacemaker/Defibrillator': { x: 404, cy: 566 },
    'Diabetes':                { x: 44, cy: 594 },
    'Osteoarthritis':          { x: 224, cy: 594 },
    'Seizure Disorder':        { x: 404, cy: 594 },
    'Kidney Disease':          { x: 44, cy: 622 },
    'Pulmonary Disease (TB)':  { x: 224, cy: 622 },
    'Hearing Loss':            { x: 404, cy: 622 },
    'Osteoporosis':            { x: 44, cy: 650 },
    'Vision Problems':         { x: 224, cy: 650 },
    'Currently Pregnant':      { x: 404, cy: 650 },
    'Hepatitis A or B':        { x: 44, cy: 678 },
    'Parkinson Disease':       { x: 224, cy: 678 },
    'MRSA':                    { x: 404, cy: 678 },
  };

  if (fields.conditions && fields.conditions !== 'None') {
    const checked = fields.conditions.split(', ');
    for (const condition of checked) {
      const pos = conditionMap[condition];
      if (pos) {
        draw(p2, 'X', pos.x + 1, inBox(pos.cy));
      }
    }
  }


  // ===== PAGE 3: HIPAA / AGREEMENTS / SIGNATURE =====
  // Lines: signature x0=158 y=706, date x0=460 y=706, printed name x0=158 y=736
  // Communication auth email
  draw(p3, fields.email, 310, aboveLine(211));

  // Signature name - cursive font
  if (fields.signatureName) {
    p3.drawText(String(fields.signatureName), { x: 160, y: aboveLine(706), size: 14, font: cursiveFont, color });
  }
  // Date
  draw(p3, fields.signatureDate, 462, aboveLine(706));
  // Printed name / relation
  const nameRelation = fields.signatureName + (fields.signatureRelation ? ' / ' + fields.signatureRelation : '');
  draw(p3, nameRelation, 160, aboveLine(736));

  return await pdf.save();
}

async function handleContactForm(formData, env) {
  const firstName = formData.get('firstName') || '';
  const lastName = formData.get('lastName') || '';
  const email = formData.get('email') || '';
  const phone = formData.get('phone') || '';
  const subject = formData.get('subject') || '';
  const message = formData.get('message') || '';
  const file = formData.get('file');

  const html = `
    <h2>New Contact Form Submission</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px;">
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${firstName} ${lastName}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${phone || 'Not provided'}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Subject</td><td style="padding:8px;border-bottom:1px solid #eee;">${subject || 'Not specified'}</td></tr>
    </table>
    <h3 style="margin-top:20px;">Message</h3>
    <p style="white-space:pre-wrap;">${message}</p>
  `;

  const payload = {
    from: env.FROM_EMAIL,
    to: env.TO_EMAIL,
    subject: `Kinetic O&P Contact: ${subject || 'New Message'} — ${firstName} ${lastName}`,
    html,
    bcc: ['REDACTED_EMAIL'],
    reply_to: email,
  };

  if (file && file.size > 0) {
    const base64 = toBase64(await file.arrayBuffer());
    payload.attachments = [{ filename: file.name, content: base64 }];
  }

  return payload;
}

async function handleIntakeForm(formData, env) {
  const fields = {};
  for (const [key, value] of formData.entries()) {
    if (key !== 'formType') fields[key] = value;
  }

  const patientName = fields.patientName || 'Patient';
  const email = fields.email || '';

  const pdfBytes = await fillOriginalPdf(fields);
  const pdfBase64 = toBase64(pdfBytes);

  const html = `
    <h2>New Patient Intake Form Submission</h2>
    <p>A completed patient intake form has been submitted online by <strong>${patientName}</strong>.</p>
    <table style="border-collapse:collapse;width:100%;max-width:600px;">
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Patient</td><td style="padding:8px;border-bottom:1px solid #eee;">${patientName}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">DOB</td><td style="padding:8px;border-bottom:1px solid #eee;">${fields.dob || ''}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Cell Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${fields.cellPhone || ''}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Insurance</td><td style="padding:8px;border-bottom:1px solid #eee;">${fields.primaryInsurance || ''}</td></tr>
    </table>
    <p style="margin-top:16px;">The complete intake form is attached as a PDF.</p>
  `;

  return {
    from: env.FROM_EMAIL,
    to: env.TO_EMAIL,
    subject: `Kinetic O&P Intake Form — ${patientName}`,
    html,
    bcc: ['REDACTED_EMAIL'],
    reply_to: email,
    attachments: [{
      filename: `Intake_${patientName.replace(/\s+/g, '_')}.pdf`,
      content: pdfBase64,
    }],
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();

      // Honeypot check — if filled, it's a bot
      const honeypot = formData.get('website');
      if (honeypot) {
        return jsonResponse({ success: true }); // silently pretend success
      }

      // Turnstile verification — required for all submissions
      const turnstileToken = formData.get('cf-turnstile-response');
      if (!turnstileToken) {
        return jsonResponse({ success: false, error: 'Verification required' }, 403);
      }
      if (env.TURNSTILE_SECRET) {
        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${env.TURNSTILE_SECRET}&response=${turnstileToken}`,
        });
        const turnstileData = await turnstileRes.json();
        if (!turnstileData.success) {
          return jsonResponse({ success: false, error: 'Bot verification failed' }, 403);
        }
      }

      const formType = formData.get('formType');

      const isTest = formData.get('isTest') === 'true';

      let payload;
      if (formType === 'intake') {
        payload = await handleIntakeForm(formData, env);
      } else {
        payload = await handleContactForm(formData, env);
      }

      if (isTest) {
        payload.subject = '[TEST] ' + payload.subject;
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Resend error:', error);
        return jsonResponse({ success: false, error: 'Failed to send email', detail: error }, 500);
      }

      return jsonResponse({ success: true });

    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ success: false, error: 'Server error', detail: String(err) }, 500);
    }
  },
};
