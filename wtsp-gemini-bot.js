
require('dotenv').config();
const wa = require('@open-wa/wa-automate');
const DatabaseUtils = require('./db-utils');
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');
const { createOverlay } = require('./overlay-text');

const DATABASE_URL = process.env.DATABASE_URL;

// Valid wards for Anushaktinagar (172)
const VALID_WARDS = [140, 141, 143, 144, 145, 146, 147, 148];

// Initialize database connection
let dbUtils = null;
if (DATABASE_URL) {
  try {
    dbUtils = new DatabaseUtils(DATABASE_URL);
    console.log('✅ Database connection initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
} else {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

// Session state management
const userSessions = new Map();
const SESSIONS_DIR = path.join(__dirname, 'sessions');

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Rate limiting
const searchLimits = new Map(); // phone -> { date, count }
const appealSent = new Map(); // phone -> boolean (per session)

/**
 * Get session file path for a phone number
 */
function getSessionFilePath(phone) {
  // Sanitize phone number for filename
  const sanitized = phone.replace(/[^a-zA-Z0-9]/g, '_');
  return path.join(SESSIONS_DIR, `${sanitized}.json`);
}

/**
 * Save session to file
 */
function saveSessionToFile(phone, session) {
  try {
    const filePath = getSessionFilePath(phone);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  } catch (error) {
    console.error(`❌ Error saving session for ${phone}:`, error);
  }
}

/**
 * Load session from file
 */
function loadSessionFromFile(phone) {
  try {
    const filePath = getSessionFilePath(phone);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`❌ Error loading session for ${phone}:`, error);
  }
  return null;
}

/**
 * Delete session file
 */
function deleteSessionFile(phone) {
  try {
    const filePath = getSessionFilePath(phone);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`❌ Error deleting session for ${phone}:`, error);
  }
}

/**
 * Get or create user session
 */
function getUserSession(phone) {
  if (!userSessions.has(phone)) {
    // Try to load from file first
    const savedSession = loadSessionFromFile(phone);
    if (savedSession) {
      userSessions.set(phone, savedSession);
    } else {
      const newSession = {
        state: 'default',
        language: null,
        ward: null,
        searchMethod: null,
        searchResults: null,
        selectedVoter: null,
        appealSent: false,
        createdAt: Date.now()
      };
      userSessions.set(phone, newSession);
      saveSessionToFile(phone, newSession);
    }
  }
  return userSessions.get(phone);
}

/**
 * Update and persist session
 */
function updateSession(phone, updates) {
  const session = getUserSession(phone);
  Object.assign(session, updates);
  saveSessionToFile(phone, session);
  return session;
}

/**
 * Reset user session
 */
function resetSession(phone) {
  userSessions.delete(phone);
  appealSent.delete(phone);
  deleteSessionFile(phone);
}

/**
 * Check daily search limit
 */
function checkSearchLimit(phone) {
  const today = new Date().toDateString();
  const limit = searchLimits.get(phone);
  
  if (!limit || limit.date !== today) {
    searchLimits.set(phone, { date: today, count: 0 });
    return true;
  }
  
  // Allow 10 searches per day
  if (limit.count >= 10) {
    return false;
  }
  
  limit.count++;
  return true;
}

/**
 * Get image path for a step
 * Images should be in a 'images' folder: images/jpeg01.jpg, jpeg02.jpg, etc.
 */
function getImagePath(stepNumber) {
  const imagePath = path.join(__dirname, 'images', `jpeg${String(stepNumber).padStart(2, '0')}.jpg`);
  // Fallback if image doesn't exist
  if (!fs.existsSync(imagePath)) {
    console.warn(`⚠️  Image not found: ${imagePath}`);
    return null;
  }
  return imagePath;
}

function getWardImagePath(wardNumber) {
  const imagePath = path.join(__dirname, 'images', 'ward',`${wardNumber}.jpeg`);
  if (!fs.existsSync(imagePath)) {
    console.warn(`⚠️  Image not found: ${imagePath}`);
    return null;
  }
  return imagePath;
}

/**
 * Send JPEG image to user
 */
async function sendImage(client, chatId, imagePath, caption = '') {
  try {
    if (!imagePath || !fs.existsSync(imagePath)) {
      // Fallback: send text message if image not found
      await client.sendText(chatId, caption || 'Image not available');
      return;
    }
    
    await client.sendImage(chatId, imagePath, 'image', caption);
    // console.log(`📤 Sent image: ${path.basename(imagePath)}`);
    if (caption) {
      console.log(`📤 Sent image: ${path.basename(imagePath)} with caption: ${caption}`);
    } else {
      console.log(`📤 Sent image: ${path.basename(imagePath)}`);
    }
  } catch (error) {
    console.error('Error sending image:', error);
    // Fallback to text
    await client.sendText(chatId, caption || 'Error loading image');
  }
}

/**
 * Step 0: Introduction on default message
 */
async function handleDefaultMessage(client, chatId) {
  await sendImage(client, chatId, getImagePath(1), 'मतदार शोध सेवा अणुशक्ती नगर (१७२) प्रभाग\n\nSelect your language\n\n1. मराठी\n2. हिंदी\n3. English\n\nReply with number (1, 2, or 3)');
  const session = getUserSession(chatId);
  session.state = 'language_selection';
  session.language = null;
  session.ward = null;
  session.searchMethod = null;
  session.searchResults = null;
  session.selectedVoter = null;
  session.appealSent = false;
  session.createdAt = Date.now();
  return true;
}
/**
 * Step 1: Language Selection (JPEG 01)
 */
async function handleLanguageSelection(client, chatId, messageText) {
  console.log(`📤 Handling language selection for chatId: ${chatId} with messageText: ${messageText}`);
  const session = getUserSession(chatId);
  
  if (messageText === '1' || messageText === '2' || messageText === '3') {
    session.language = messageText === '1' ? 'marathi' : messageText === '2' ? 'hindi' : 'english';
    session.state = 'ward_selection';
    
    // Send JPEG 02 - Ward Selection
    // const imagePath = getImagePath(2);
    // await sendImage(client, chatId, imagePath, caption);
    const response = {
      '1': 'कृपया प्रभाग (वार्ड) नंबर निवडा:\n\n1. 140\n2. 141\n3. 143\n4. 144\n5. 145\n6. 146\n7. 147\n8. 148\n\nक्रमांक उत्तर म्हणून पाठवा (1-8)',
      '2': 'कृपया वार्ड नंबर चुनें:\n\n1. 140\n2. 141\n3. 143\n4. 144\n5. 145\n6. 146\n7. 147\n8. 148\n\nक्रमांक उत्तर के रूप में भेजें (1-8)',
      '3': 'Please choose a ward number:\n\n1. 140\n2. 141\n3. 143\n4. 144\n5. 145\n6. 146\n7. 147\n8. 148\n\nReply with number (1-8)',
    }
    console.log(`📤 Sending text: ${response[messageText]}`);
    await client.sendText(chatId, response[messageText]);
    return true;
  }
  
  // Invalid input, resend JPEG 01
  const imagePath = getImagePath(1);
  await sendImage(client, chatId, imagePath);
  return true;
}

/**
 * Step 2: Ward Selection (JPEG 02)
 */
async function handleWardSelection(client, chatId, messageText) {
  const session = getUserSession(chatId);
  const ward = parseInt(messageText);
  
  if (VALID_WARDS[Number(ward) - 1]) {
    session.ward = VALID_WARDS[Number(ward) - 1];
    session.state = 'search_method';
    
    // Send JPEG 03 - Search Method (with ward number in heading)
    const imagePath = getWardImagePath(VALID_WARDS[Number(ward) - 1]);
    let caption;
    if (session.language === 'marathi') {
      caption = `प्रभाग ${session.ward} मध्ये मतदार शोध सेवा अणुशक्ती नगर (१७२) प्रभाग\n\nशोधण्याची पद्धत निवडा\n\n1. नावानुसार शोधा\n2. EPIC नुसार शोधा\n3. भाग/बूथ नुसार शोधा\n4. मदत चालू करा\n\nक्रमांक उत्तर म्हणून पाठवा (1-4)`;
    } else if (session.language === 'hindi') {
      caption = `प्रभाग ${session.ward} में मतदाता खोज सेवा आणुशक्ति नगर (१७२) वार्ड\n\nखोज विधि चुनें\n\n1. नाम से खोजें\n2. EPIC से खोजें\n3. भाग/बूथ द्वारा खोजें\n4. मदद प्रारंभ करें\n\nक्रमांक उत्तर के रूप में भेजें (1-4)`;
    } else {
      caption = `Voter Search Service, Anushakti Nagar (172) Ward, in Ward ${session.ward}\n\nSelect your search method\n\n1. Search by name\n2. Search by EPIC\n3. Search by part/booth\n4. Start help\n\nReply with number (1-4)`;
    }
    await sendImage(client, chatId, imagePath, caption);
    return true;
  }
  
  // Invalid ward, resend JPEG 02
  const imagePath = getImagePath(1);
  await sendImage(client, chatId, imagePath);
  return true;
}

/**
 * Step 3: Search Method Selection (JPEG 03)
 */
async function handleSearchMethod(client, chatId, messageText) {
  const session = getUserSession(chatId);
  
  if (messageText === '1' || messageText === '2' || messageText === '3' || messageText === '4') {
    session.searchMethod = messageText;
    
    if (messageText === '4') {
      // Help requested - send help message (you can create JPEG for this)
      await client.sendText(chatId, 'Help: Select 1 for name search, 2 for EPIC, 3 for house number');
      return true;
    }
    
    // Check search limit
    if (!checkSearchLimit(chatId)) {
      await client.sendText(chatId, 'Daily search limit reached. Please try again tomorrow.');
      return true;
    }
    
    // Send appropriate input prompt
    if (messageText === '1') {
      let caption;
      if (session.language === 'marathi') {
        caption = "नावाने शोधण्यासाठी मतदाराचे पूर्ण नाव टाका";
      } else if (session.language === 'hindi') {
        caption = "नाम से खोजने के लिए मतदाता का पूरा नाम दर्ज करें";
      } else {
        caption = "Please enter the full name of the voter to search";
      }
      await client.sendText(chatId, caption);
      session.state = 'name_input';
    } else if (messageText === '2') {
      let caption;
      if (session.language === 'marathi') {
        caption = "EPIC क्रमांकाने शोधण्यासाठी मतदाराचा EPIC क्रमांक टाका";
      } else if (session.language === 'hindi') {
        caption = "EPIC नंबर से खोजने के लिए मतदाता का EPIC नंबर दर्ज करें";
      } else {
        caption = "Please enter the voter's EPIC number to search";
      }
      await client.sendText(chatId, caption);
      session.state = 'epic_input';
    } else if (messageText === '3') {
      // House/Society number input
      let caption;
      if (session.language === 'marathi') {
        caption = "भाग/बूथ नंबराने शोधण्यासाठी मतदाराचा भाग/बूथ नंबर टाका";
      } else if (session.language === 'hindi') {
        caption = "भाग/बूथ नंबर से खोजने के लिए मतदाता का भाग/बूथ नंबर दर्ज करें";
      } else {
        caption = "Please enter the house/society number to search by house/society number";
      }
      await client.sendText(chatId, caption);
      session.state = 'house_input';
    }
    
    return true;
  }
  
  await client.sendText(chatId, 'Invalid input. Please try again.');
  return true;
}

/**
 * Step 4: Handle search input and show results
 */
async function handleSearchInput(client, chatId, messageText) {
  const session = getUserSession(chatId);
  
  if (!session.ward) {
    // Session corrupted, restart
    resetSession(chatId);
    await client.sendText(chatId, 'Something went wrong. Please start over.');
    return true;
  }
  
  try {
    let results = [];
    
    if (session.searchMethod === '1') {
      // Name search
      results = await dbUtils.searchVotersByName(messageText, 5, 0.2, session.ward);
    } else if (session.searchMethod === '2') {
      // EPIC search
      const voter = await dbUtils.getVoterByEpic(messageText);
      if (voter) {
        results = [voter];
      }
    } else if (session.searchMethod === '3') {
      // House number search
      results = await dbUtils.searchVotersByHouse(messageText, session.ward);
    }
    
    if (results.length === 0) {
      await client.sendText(chatId, 'No voters found. Please try again.');
      session.state = 'search_method';
      return true;
    }
    
    // Store results and show list
    session.searchResults = results;
    session.state = 'results_list';
    
    // Generate and send JPEG 05 - Results List
    await sendResultsList(client, chatId, results, session);
    
    return true;
  } catch (error) {
    console.error('Error in search:', error);
    await client.sendText(chatId, 'Error searching. Please try again.');
    return true;
  }
}

/**
 * Send results list (JPEG 05)
 */
async function sendResultsList(client, chatId, results, session) {
  // For now, send text format. You'll need to generate JPEG with proper formatting
  let header, ageLabel, genderLabel, footer;
  
  if (session.language === 'marathi') {
    header = `प्रभाग ${session.ward} मध्ये आढळलेले मतदार\n`;
    ageLabel = 'वय';
    genderLabel = 'लिंग';
    footer = '\nक्रमांक उत्तर म्हणून पाठवा';
  } else if (session.language === 'hindi') {
    header = `वार्ड ${session.ward} में पाए गए मतदाता\n`;
    ageLabel = 'आयु';
    genderLabel = 'लिंग';
    footer = '\nक्रमांक उत्तर के रूप में भेजें';
  } else {
    header = `Voters found in Ward ${session.ward}\n`;
    ageLabel = 'Age';
    genderLabel = 'Gender';
    footer = '\nReply with the number to select';
  }
  
  const lines = [header];
  
  results.slice(0, 5).forEach((voter, idx) => {
    lines.push(`${idx + 1}. ${voter.full_name} | ${ageLabel}: ${voter.age} | ${genderLabel}: ${voter.gender}`);
  });
  
  lines.push(footer);
  
  // TODO: Generate JPEG 05 with proper formatting
  // For now, send as text
  await client.sendText(chatId, lines.join('\n'));
}

/**
 * Step 5: Handle result selection
 */
async function handleResultSelection(client, chatId, messageText) {
  const session = getUserSession(chatId);
  const selection = parseInt(messageText);
  
  if (!session.searchResults || selection < 1 || selection > session.searchResults.length) {
    // Invalid selection, resend results
    await sendResultsList(client, chatId, session.searchResults, session);
    return true;
  }
  
  const selectedVoter = session.searchResults[selection - 1];
  session.selectedVoter = selectedVoter;
  session.state = 'voter_details';
  
  // Send JPEG 06 - Voter Details Card
  await sendVoterDetails(client, chatId, selectedVoter, session);
  
  return true;
}

/**
 * Send voter details card (JPEG 06) and voter slip automatically
 */
async function sendVoterDetails(client, chatId, voter, session) {
  // Fetch part/polling station details from PartNo table
  if (voter.part_no && dbUtils) {
    const partDetails = await dbUtils.getPartDetails(voter.part_no);
    console.log('partDetails', partDetails);
    if (partDetails) {
      voter.polling_station_name = partDetails.polling_station_name;
      voter.polling_station_address = partDetails.polling_station_address;
    }
  }

  // // Format voter details based on language
  // let labels;
  
  // if (session.language === 'marathi') {
  //   labels = {
  //     name: 'नाव',
  //     epic: 'EPIC',
  //     ward: 'प्रभाग',
  //     partBooth: 'भाग / बूथ क्रमांक',
  //     pollingStationName: 'मतदान केंद्राचे नाव व पत्ता',
  //     pollingStationAddress: 'मतदान केंद्राचे पत्ता'
  //   };
  // } else if (session.language === 'hindi') {
  //   labels = {
  //     name: 'नाम',
  //     epic: 'EPIC',
  //     ward: 'वार्ड',
  //     partBooth: 'भाग / बूथ क्रमांक',
  //     pollingStationName: 'मतदान केंद्र का नाम व पता',
  //     pollingStationAddress: 'मतदान केंद्र का पता'
  //   };
  // } else {
  //   labels = {
  //     name: 'Name',
  //     epic: 'EPIC',
  //     ward: 'Ward',
  //     partBooth: 'Part / Booth No',
  //     pollingStationName: 'Polling Station Name',
  //     pollingStationAddress: 'Polling Station Address'
  //   };
  // }
  
  // const details = [
  //   `${labels.name}: ${voter.full_name}`,
  //   `${labels.epic}: ${voter.epic_number}`,
  //   `${labels.ward}: ${session.ward}`,
  //   `${labels.partBooth}: ${voter.part_no}`,
  //   `${labels.pollingStationName}: ${voter.polling_station_name || 'N/A'}`
  //   `${labels.pollingStationAddress}: ${voter.polling_station_address || 'N/A'}`
  // ].join('\n');
  
  // await client.sendText(chatId, details);
  
  // Automatically send voter slip - no extra step needed
  await sendVoterSlip(client, chatId, voter, session);
  
  // Send search another message
  // await client.sendText(chatId, `\n${labels.searchAnother}`);
}

/**
 * Send candidate appeal (JPEG 07) - MANDATORY
 */
async function sendCandidateAppeal(client, chatId) {
  const imagePath = getImagePath(1);
  await sendImage(client, chatId, imagePath);
  // No text message, image only
}

/**
 * Handle voter details actions - now just handles search for another voter
 */
async function handleVoterDetailsAction(client, chatId, messageText) {
  const session = getUserSession(chatId);
  
  // Any text input is treated as a new name search
  if (messageText && messageText.length > 1) {
    session.searchResults = null;
    session.selectedVoter = null;
    session.state = 'awaiting_search';
    session.searchMethod = 'name';
    // Process the message as a new search query
    return await handleSearchInput(client, chatId, messageText);
  }
  
  return true;
}

/**
 * Generate voter slip image using Canvas (supports Devanagari/Marathi)
 */
async function generateVoterSlip(voter, session) {
  const slipWidth = 650;
  const slipHeight = 480;
  const padding = 25;
  const lineHeight = 38;
  
  // Create canvas
  const canvas = createCanvas(slipWidth, slipHeight);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, slipWidth, slipHeight);
  
  // Header background (gradient maroon/red - party color)
  const headerGradient = ctx.createLinearGradient(0, 0, slipWidth, 0);
  headerGradient.addColorStop(0, '#8B0000');
  headerGradient.addColorStop(0.5, '#C70039');
  headerGradient.addColorStop(1, '#8B0000');
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, slipWidth, 70);
  
  // Title text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('मतदार स्लिप / VOTER SLIP', slipWidth / 2, 32);
  
  // Ward subtitle
  ctx.font = 'bold 16px sans-serif';
  let wardText;
  if (session.language === 'marathi') {
    wardText = `वार्ड क्र. ${session.ward} - बृहन्मुंबई महानगरपालिका`;
  } else if (session.language === 'hindi') {
    wardText = `वार्ड नं. ${session.ward} - बृहन्मुंबई महानगरपालिका`;
  } else {
    wardText = `Ward No. ${session.ward} - BMC Elections 2026`;
  }
  ctx.fillText(wardText, slipWidth / 2, 56);
  
  // Draw separator line
  ctx.strokeStyle = '#C70039';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, 80);
  ctx.lineTo(slipWidth - padding, 80);
  ctx.stroke();
  
  // Voter details section
  let yPos = 105;
  
  // Labels based on language
  let labels;
  if (session.language === 'marathi') {
    labels = {
      name: 'नाव',
      epic: 'EPIC क्रमांक',
      ward: 'वार्ड / प्रभाग',
      booth: 'भाग / बूथ क्र.',
      srNo: 'अनुक्रमांक',
      age: 'वय',
      gender: 'लिंग',
      address: 'पत्ता',
      pollingStation: 'मतदान केंद्र'
    };
  } else if (session.language === 'hindi') {
    labels = {
      name: 'नाम',
      epic: 'EPIC नंबर',
      ward: 'वार्ड',
      booth: 'भाग / बूथ नं.',
      srNo: 'क्रमांक',
      age: 'आयु',
      gender: 'लिंग',
      address: 'पता',
      pollingStation: 'मतदान केंद्र'
    };
  } else {
    labels = {
      name: 'Name',
      epic: 'EPIC No.',
      ward: 'Ward',
      booth: 'Part / Booth No.',
      srNo: 'Sr. No.',
      age: 'Age',
      gender: 'Gender',
      address: 'Address',
      pollingStation: 'Polling Station'
    };
  }
  
  const details = [
    { label: labels.name, value: voter.full_name || 'N/A' },
    { label: labels.epic, value: voter.epic_number || 'N/A' },
    { label: labels.ward, value: String(session.ward || voter.ac_no || 'N/A') },
    { label: labels.booth, value: String(voter.part_no || 'N/A') },
    { label: labels.srNo, value: String(voter.sr_no || 'N/A') },
    { label: labels.age, value: String(voter.age || 'N/A') },
    { label: labels.gender, value: voter.gender || 'N/A' },
    { label: labels.pollingStation, value: (voter.polling_station_name || 'N/A').substring(0, 45) }
  ];
  
  ctx.textAlign = 'left';
  
  details.forEach(({ label, value }) => {
    // Label
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${label}:`, padding, yPos);
    
    // Value
    ctx.fillStyle = '#000000';
    ctx.font = '15px sans-serif';
    ctx.fillText(String(value), padding + 160, yPos);
    
    yPos += lineHeight;
  });
  
  // Footer separator
  ctx.strokeStyle = '#CCCCCC';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, slipHeight - 70);
  ctx.lineTo(slipWidth - padding, slipHeight - 70);
  ctx.stroke();
  
  // Footer - Election info
  ctx.fillStyle = '#C70039';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  
  let electionInfo;
  if (session.language === 'marathi') {
    electionInfo = 'मतदान: गुरुवार, दि. १५ जानेवारी २०२६ • वेळ: सकाळी ७:३० ते संध्याकाळी ५:३०';
  } else if (session.language === 'hindi') {
    electionInfo = 'मतदान: गुरुवार, १५ जनवरी २०२६ • समय: सुबह ७:३० से शाम ५:३०';
  } else {
    electionInfo = 'Voting: Thursday, 15th January 2026 • Time: 7:30 AM to 5:30 PM';
  }
  ctx.fillText(electionInfo, slipWidth / 2, slipHeight - 48);
  
  // Service info
  ctx.fillStyle = '#888888';
  ctx.font = '11px sans-serif';
  ctx.fillText('अणुशक्ती नगर (१७२) - मतदार शोध सेवा', slipWidth / 2, slipHeight - 28);
  
  // Party appeal text
  ctx.fillStyle = '#C70039';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('घड्याळ चिन्हासमोरील बटण दाबा! 🕐', slipWidth / 2, slipHeight - 10);
  
  // Generate unique filename
  const filename = `voter_slip_${voter.epic_number || Date.now()}.jpg`;
  const filepath = path.join(__dirname, 'temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Save image as JPEG
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.92 });
  fs.writeFileSync(filepath, buffer);
  
  return filepath;
}

/**
 * Generate campaign image with voter details overlaid on template
 */
async function generateCampaignImage(voter, session) {
  try {
    // Generate text based on language with full voter details
    let campaignText;
    
    if (session.language === 'marathi') {
      campaignText = [
        `नाव: ${voter.full_name || 'N/A'}`,
        `EPIC क्रमांक: ${voter.epic_number || 'N/A'}`,
        `वय: ${voter.age || 'N/A'} | लिंग: ${voter.gender || 'N/A'}`,
        `वार्ड क्र.: ${session.ward} | बूथ क्र.: ${voter.part_no || 'N/A'}`,
        `मतदान केंद्र: ${(voter.polling_station_name || 'N/A')}`,
        `मतदान केंद्र पत्ता: ${(voter.polling_station_address || 'N/A')}`
      ].join('\n');
    } else if (session.language === 'hindi') {
      campaignText = [
        `नाम: ${voter.full_name || 'N/A'}`,
        `EPIC नंबर: ${voter.epic_number || 'N/A'}`,
        `आयु: ${voter.age || 'N/A'} | लिंग: ${voter.gender || 'N/A'}`,
        `वार्ड नं.: ${session.ward} | बूथ नं.: ${voter.part_no || 'N/A'}`,
        `मतदान केंद्र: ${(voter.polling_station_name || 'N/A')}`,
        `मतदान केंद्र पत्ता: ${(voter.polling_station_address || 'N/A')}`
      ].join('\n');
    } else {
      campaignText = [
        `Name: ${voter.full_name || 'N/A'}`,
        `EPIC No.: ${voter.epic_number || 'N/A'}`,
        `Age: ${voter.age || 'N/A'} | Gender: ${voter.gender || 'N/A'}`,
        `Ward No.: ${session.ward} | Booth No.: ${voter.part_no || 'N/A'}`,
        `Polling Station: ${(voter.polling_station_name || 'N/A')}`,
        `Polling Station Address: ${(voter.polling_station_address || 'N/A')}`
      ].join('\n');
    }

    // Generate unique output filename
    const filename = `campaign_${voter.epic_number || Date.now()}.jpeg`;
    const outputPath = path.join(__dirname, 'temp', filename);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create the campaign image using overlay-text
    await createOverlay({
      templatePath: path.join(__dirname, 'images', 'template', `${session.ward}.jpeg`),
      outputPath: outputPath,
      text: campaignText,
      position: {
        x: 'left',
        y: [144, 145, 147,141].includes(session.ward) ? 380 : 340,
      },
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        fontColor: '#000000',
        textAlign: 'center',
        lineHeight: 1.5,
        maxWidth: 850,
      },
    });

    return outputPath;
  } catch (error) {
    console.error('Error generating campaign image:', error);
    return null;
  }
}

/**
 * Send voter slip (JPEG 08 or PDF)
 */
async function sendVoterSlip(client, chatId, voter, session) {
  try {
    // Generate and send campaign image with ward/booth info
    const campaignImagePath = await generateCampaignImage(voter, session);
    if (campaignImagePath && fs.existsSync(campaignImagePath)) {
      let caption;
      if (session.language === 'marathi') {
        caption = 'घड्याळ चिन्हासमोरील बटण दाबून यांना प्रचंड मतांनी विजयी करा!';
      } else if (session.language === 'hindi') {
        caption = 'घड़ी के चिह्न के सामने बटन दबाकर इन्हें भारी मतों से विजयी बनाएं!';
      } else {
        caption = 'Press the button in front of the clock symbol to make them win with massive votes!';
      }
      
      await client.sendImage(chatId, campaignImagePath, 'campaign.jpg', caption);
      
      // Clean up campaign image after a delay
      setTimeout(() => {
        try {
          fs.unlinkSync(campaignImagePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 5000);
    }
    
  } catch (error) {
    console.error('Error generating voter slip:', error);
    // Fallback to text if image generation fails
    const slip = `VOTER SLIP\n\nName: ${voter.full_name}\nEPIC: ${voter.epic_number}\nWard: ${session.ward || voter.ac_no}\nPart/Booth: ${voter.part_no}\nSr. No: ${voter.sr_no}\nAge: ${voter.age}\nPolling Station: ${voter.polling_station_name || 'N/A'}`;
    await client.sendText(chatId, slip);
  }
  
  // Set state to allow searching another voter
  session.state = 'voter_details';
  session.searchResults = null;
  session.selectedVoter = null;
}

/**
 * Main message processing function
 */
async function processMessage(client, message) {
  try {
    const chatId = message.from;
    const messageText = (message.body || '').trim();

    console.log(message.from);
    // return
    // Skip if message is empty or from a notification
    if (!messageText || message.isNotification || message.from !== '918669977207@c.us') {
      return;
    }

    console.log(`\n📨 New message from ${message.notifyName || chatId}:`);
    console.log(`   "${messageText}"`);

    const session = getUserSession(chatId);

    console.log(`📤 Session state: ${session.state}`);
    console.log(`📤 Session language: ${session.language}`);
    console.log(`📤 Session ward: ${session.ward}`);
    console.log(`📤 Session searchMethod: ${session.searchMethod}`);
    console.log(`📤 Session searchResults: ${session.searchResults}`);
    console.log(`📤 Session selectedVoter: ${session.selectedVoter}`);
    console.log(`📤 Session appealSent: ${session.appealSent}`);
    console.log(`📤 Session createdAt: ${session.createdAt}`);

    // Route based on current state
    switch (session.state) {
      case 'default':
        await handleDefaultMessage(client, chatId);
        break;
      case 'language_selection':
        await handleLanguageSelection(client, chatId, messageText);
        break;
        
      case 'ward_selection':
        await handleWardSelection(client, chatId, messageText);
        break;
        
      case 'search_method':
        await handleSearchMethod(client, chatId, messageText);
        break;
        
      case 'name_input':
      case 'epic_input':
      case 'house_input':
        await handleSearchInput(client, chatId, messageText);
        break;
        
      case 'results_list':
        await handleResultSelection(client, chatId, messageText);
        resetSession(chatId);
        break;
        
      case 'voter_details':
        // Slip already sent, restart
        await handleVoterDetailsAction(client, chatId, messageText);
        resetSession(chatId);
        break;
        
      case 'voter_slip':
        // Slip already sent, restart
        resetSession(chatId);
        const imagePath = getImagePath(1);
        await sendImage(client, chatId, imagePath);
        break;
        
      default:
        // Unknown state, start from beginning
        resetSession(chatId);
        const defaultImagePath = getImagePath(1);
        await sendImage(client, chatId, defaultImagePath, 'मतदार शोध सेवा अणुशक्ती नगर (१७२) प्रभाग\n\nSelect your language\n\n1. मराठी\n2. हिंदी\n3. English\n\nReply with number (1, 2, or 3)');
    }

  } catch (error) {
    console.error('❌ Error processing message:', error);
    try {
      await client.sendText(message.from, 'Sorry, I encountered an error. Please try again.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
}

/**
 * Initialize WhatsApp client
 */
wa.create({
  sessionId: "VOTER_SEARCH_BOT",
  multiDevice: true,
  authTimeout: 60,
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: 'PT_BR',
  logConsole: false,
  popup: true,
  qrTimeout: 0,
}).then(client => start(client));

async function start(client) {
  console.log('🚀 WhatsApp Voter Search Bot started!');
  console.log('📱 Waiting for messages...\n');

  // Send welcome message to new chats (optional)
  // Listen to all incoming messages
  client.onMessage(async (message) => {
    // Only respond to text messages
    if (message.type === 'chat' && message.body) {
      await processMessage(client, message);
    }
  });

  // Clean up old sessions periodically (optional)
  setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    for (const [phone, session] of userSessions.entries()) {
      if (now - session.createdAt > maxAge) {
        resetSession(phone);
      }
    }
  }, 60 * 60 * 1000); // Check every hour
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  if (dbUtils) {
    await dbUtils.close();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});
