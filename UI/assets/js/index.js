window.addEventListener('load', () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = 'login.html';  // or your login page path
  }
});

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarHeader = document.getElementById('sidebar-header');
const sidebarLogo = document.getElementById('sidebar-logo');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatWindow = document.getElementById('chat-window');
const fileUpload = document.getElementById('file-upload');
const addFileBtn = document.getElementById('add-file-btn');
let uploadedFile = null;
let aiLoaderMessage = null;
let uploadedFileName = null;

// Sidebar toggle functionality
let sessionId = sessionStorage.getItem('session_id');
if (!sessionId) {
    sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem('session_id', sessionId);
}
console.log("Session ID:", sessionId);

// Sidebar toggle functionality
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    sidebarHeader.classList.toggle('collapsed-header');
    sidebarLogo.classList.toggle('collapsed-logo');
    if (sidebar.classList.contains('collapsed')) {
        sidebarToggle.querySelector('i').classList.replace('fa-bars', 'fa-arrow-right');
    } else {
        sidebarToggle.querySelector('i').classList.replace('fa-arrow-right', 'fa-bars');
    }
});

// Auto-resize textarea
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
});

// Send message functionality
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// File upload functionality
addFileBtn.addEventListener('click', () => {
    fileUpload.click();
});

fileUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        if (file.type === 'application/pdf') {
            uploadedFile = file;
            displayUploadedFileName(file.name);
        } else {
            alert('Please upload a PDF file.');
            fileUpload.value = '';
        }
    }
});

function displayUploadedFileName(fileName) {
    const existingFileDisplay = document.querySelector('.uploaded-file');
    if (existingFileDisplay) {
        existingFileDisplay.remove();
    }

    const chatInputArea = document.getElementById('chat-input-area');
    const fileDiv = document.createElement('div');
    fileDiv.className = 'uploaded-file';
    fileDiv.innerHTML = `
        <i class="fas fa-file-pdf"></i>
        <span>${fileName}</span>
        <i class="fas fa-times remove-file"></i>
    `;
    chatInputArea.insertBefore(fileDiv, chatInput);

    fileDiv.querySelector('.remove-file').addEventListener('click', () => {
        uploadedFile = null;
        fileUpload.value = '';
        fileDiv.remove();
    });
}

// Improved detection for HTML content with paragraph tags
function isHTMLContent(text) {
    if (!text || typeof text !== 'string') return false;
    
    // Check for HTML paragraph tags specifically
    const hasHTMLTags = /<p>|<\/p>|<b>|<\/b>|<i>|<\/i>|<strong>|<\/strong>/i.test(text);
    const hasMultipleParagraphs = (text.match(/<p>/gi) || []).length >= 2;
    
    return hasHTMLTags && hasMultipleParagraphs;
}

function isDocumentExtraction(text) {
    if (!text || typeof text !== 'string') return false;
    
    // Check if it's a save success message - should not be treated as extracted content
    if (text.includes('Successfully saved the extracted content') || 
        text.includes('Reference URL:') || 
        text.includes('Failed to save chat response')) {
        return false;
    }
    
    // Check for HTML content first
    if (isHTMLContent(text)) {
        return true;
    }
    
    // Fallback to original detection logic
    const hasMultipleLines = (text.match(/\n/g) || []).length >= 3;
    const hasStructuredData = /[:\-\|\/\\]/.test(text);
    const hasNumbers = /\d/.test(text);
    const hasSpecialFormatting = /\s{2,}|\t/.test(text);
    const isLongContent = text.length > 150;
    
    const hasDatePattern = /\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}|\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4}/.test(text);
    const hasAddressPattern = /\d+\s+\w+|\w+\s+\d+|[A-Z]{2,}\s+\d+/.test(text);
    const hasMoneyPattern = /[\$€£¥₹]\s*\d+|\d+\s*[\$€£¥₹]|\d+[.,]\d{2}/.test(text);
    const hasIDPattern = /\b[A-Z0-9]{3,}\b|\b\d{4,}\b/.test(text);
    
    let score = 0;
    if (hasMultipleLines) score += 2;
    if (hasStructuredData) score += 2;
    if (hasNumbers) score += 1;
    if (hasSpecialFormatting) score += 1;
    if (isLongContent) score += 1;
    if (hasDatePattern) score += 2;
    if (hasAddressPattern) score += 1;
    if (hasMoneyPattern) score += 1;
    if (hasIDPattern) score += 1;
    
    return score >= 4;
}

async function sendMessage() {
    const query = chatInput.value.trim();
    if (query === '' && !uploadedFile) {
        return;
    }

    appendMessage(query, 'user', uploadedFile);
    showAiLoader();

    try {
        const formData = new FormData();
        formData.append('message', query || 'Empty Message');
        
        if (uploadedFile) {
            uploadedFileName = uploadedFile.name
            formData.append('file', uploadedFile);
        }

        if (sessionId) {
            formData.append('session_id', sessionId);
        }

        const response = await fetch( api_url +'/chat', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        hideAiLoader();
        if (data.data.session_id) {
            sessionId = data.data.session_id;
        }
        if (query.toLowerCase().includes("extract table") || query.toLowerCase().includes("táblázat") || query.toLowerCase().includes("table")|| query.toLowerCase().includes("kinyerési táblázat") || data.message.toLowerCase().includes("table")||data.message.toLowerCase().includes("táblázat")) {
                const replyText = data.data?.reply || data.message || "No reply.";
                const fileUrl = data.data?.url || data.data?.file_path;
                const titlePhrase = data.data?.identifiers?.document_title_phrase || 'Extracted_Result';
                const confidenceScore = data.data?.overall_confidence;

                let finalMessage = replyText;
                if (confidenceScore !== undefined) {
                    finalMessage += `\nConfidence Score: ${(confidenceScore * 100).toFixed(2)}%`;
                }

                if (fileUrl) {
                    await appendMessageWithActions(finalMessage, fileUrl, titlePhrase);
                } else {
                    appendMessagetable(finalMessage, 'ai');
                }
            } else {
                let aiResponse = 'Response received successfully';
                let confidence = null;
                let blobUrl = null;

                // Handle the specific response format you provided
                if (data.statusCode === 200 && data.data) {
                    if (typeof data.data.response === 'object' && data.data.response.response) {
                        aiResponse = data.data.response.response;
                        confidence = data.data.response.confidence || null;
                        blobUrl = data.data.response.blob_url || null;
                    } else if (typeof data.data.response === 'string') {
                        aiResponse = data.data.response;
                        confidence = data.data.confidence || null;
                        blobUrl = data.data.blob_url || null;
                    } else if (data.data.reply) {
                        aiResponse = data.data.reply;
                    }
                } else if (data.response) {
                    if (typeof data.response === 'object' && data.response.response) {
                        aiResponse = data.response.response;
                        confidence = data.response.confidence || null;
                        blobUrl = data.response.blob_url || null;
                    } else if (typeof data.response === 'string') {
                        aiResponse = data.response;
                        confidence = data.confidence || null;
                        blobUrl = data.blob_url || null;
                    }
                } 
                // else if (data.message) {
                //     aiResponse = data.message;
                // }

                appendMessage(aiResponse, 'ai', null, confidence, blobUrl);
            }

    } catch (error) {
        hideAiLoader();
        let errorMsg = "An error occurred while communicating with the server.";
        if (error instanceof TypeError) {
            errorMsg += " Please check your internet connection or try again later.";
        } else {
            errorMsg += `\nDetails: ${error.message}`;
        }

        appendMessage(errorMsg, 'ai');
        console.error('Backend error details:', error);
    }

    // Clear input and file
    chatInput.value = '';
    chatInput.style.height = 'auto';
    uploadedFile = null;
    fileUpload.value = '';
    const existingFileDisplay = document.querySelector('.uploaded-file');
    if (existingFileDisplay) {
        existingFileDisplay.remove();
    }
}

function appendSaveSuccessMessage(referenceUrl) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container ai';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar ai';
    avatar.textContent = 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai';

    const successDiv = document.createElement('div');
    successDiv.className = 'save-success-message';
    successDiv.innerHTML = `
        <div><i class="fas fa-check-circle"></i> Successfully saved the extracted content to your records.</div>
        <a href="${referenceUrl}" target="_blank" download>
            <i class="fas fa-download"></i> Download Reference File
        </a>
    `;
    
    bubble.appendChild(successDiv);
    messageContainer.append(avatar, bubble);
    chatWindow.appendChild(messageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function saveChatResponse(blobUrl, saveButton) {
    try {
        const originalButtonContent = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        const response = await fetch(api_url+'/save-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ blob_url: blobUrl }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Save API response:', data);
        
        appendSaveSuccessMessage(data.data.permanent_blob_url);
        saveButton.style.display = 'none';

    } catch (error) {
        console.error('Error saving chat response:', error);
        appendMessage('Failed to save chat response. Please try again.', 'ai');
        
        // Reset button
        saveButton.innerHTML = originalButtonContent;
        saveButton.disabled = false;
    }
}

function appendMessage(text, sender, file = null, confidence = null, blobUrl = null) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${sender}`;
    if (blobUrl) {
        messageContainer.dataset.blobUrl = blobUrl;
    }

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${sender}`;
    avatar.textContent = sender === 'user' ? 'You' : 'AI';

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;

    if (text) {
        const isExtractedContent = isDocumentExtraction(text);
        
        if (isExtractedContent) {
            const extractedContainer = document.createElement('div');
            extractedContainer.className = 'extracted-content';
            
            const header = document.createElement('div');
            header.className = 'extracted-header';
            header.innerHTML = '<i class="fas fa-file-text"></i> Extracted Content:';
            extractedContainer.appendChild(header);
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'extracted-text';
            
            // Check if content contains HTML tags
            if (isHTMLContent(text)) {
                // Render HTML content directly
                contentDiv.innerHTML = text;
            } else {
                // Handle plain text content
                contentDiv.textContent = text;
            }
            
            extractedContainer.appendChild(contentDiv);
            
            if (confidence !== null) {
                const confidenceDiv = document.createElement('div');
                confidenceDiv.className = 'confidence-score';
                const confidencePercent = (confidence * 100).toFixed(1);
                confidenceDiv.innerHTML = `<i class="fas fa-chart-bar"></i> Confidence: ${confidencePercent}%`;
                extractedContainer.appendChild(confidenceDiv);
            }

            if (sender === 'ai' && blobUrl) {
                const saveBtn = document.createElement('button');
                saveBtn.className = 'save-extracted-content-btn';
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
                
                saveBtn.addEventListener('click', () => {
                    const urlToSave = messageContainer.dataset.blobUrl;
                    if (urlToSave) {
                        saveChatResponse(urlToSave, saveBtn);
                    } else {
                        console.error('Blob URL not found for this message.');
                    }
                });
                extractedContainer.appendChild(saveBtn);
            }
            
            bubble.appendChild(extractedContainer);
        } else {
            // Regular message - check if it contains HTML
            if (text.includes('<') && text.includes('>')) {
                bubble.innerHTML = text;
            } else {
                bubble.textContent = text;
            }
        }
    }

    if (file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file-in-chat';
        fileElement.innerHTML = `<i class="fas fa-file-pdf"></i> ${file.name}`;
        bubble.prepend(fileElement);
    }

    if (sender === 'user') {
        messageContainer.append(bubble, avatar);
    } else {
        messageContainer.append(avatar, bubble);
    }

    chatWindow.appendChild(messageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMessagetable(text, sender, file = null) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${sender}`;
    avatar.textContent = sender === 'user' ? 'You' : 'AI';

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;
    if (text) bubble.textContent = text;

    if (file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file-in-chat';
        fileElement.innerHTML = `<i class="fas fa-file-pdf"></i> ${file.name}`;
        bubble.prepend(fileElement);
    }

    if (sender === 'user') {
        messageContainer.append(bubble, avatar);
    } else {
        messageContainer.append(avatar, bubble);
    }

    chatWindow.appendChild(messageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function detectLangFromBackend(text) {
  try {
    const res = await fetch(api_url+'/detect-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    return data.language || 'en';
  } catch (e) {
    console.error("Language detection failed:", e);
    return 'en';
  }
}

const translations = {
  hu: {
    downloadInfo: "Ha meg szeretné tekinteni a fájlt, kattintson a Letöltés gombra.",
    download: "Letöltés",
    saveInfo: "Ha el szeretné menteni a fájlt, kattintson a Mentés gombra.",
    save: "Mentés",
    savedSuccess: "A fájl sikeresen el lett mentve mint",
    saveFailed: "A mentés nem sikerült!",
  },
  en: {
    downloadInfo: "If you want to preview the file, click on the Download button.",
    download: "Download",
    saveInfo: "If you want to save the file, click on the Save button.",
    save: "Save",
    savedSuccess: "File was successfully saved  as ",
    saveFailed: "Save failed!",
  }
};

async function appendMessageWithActions(text, fileUrl, titlePhrase) {
  const lang = await detectLangFromBackend(text);
  const t = translations[lang] || translations.en;

  const messageContainer = document.createElement('div');
  messageContainer.className = 'message-container ai';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar ai';
  avatar.textContent = 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble ai';

  const textDiv = document.createElement('div');
  textDiv.textContent = text;
  bubble.appendChild(textDiv);

  const infoText1 = document.createElement('p');
  infoText1.textContent = t.downloadInfo;

  const downloadBtn = document.createElement('a');
  downloadBtn.href = fileUrl;
  downloadBtn.download = 'ExtractedData.xlsx';
  downloadBtn.target = '_blank';
  downloadBtn.textContent = t.download;
  downloadBtn.className = 'btn btn-sm btn-primary me-2 mt-2';

  const infoText2 = document.createElement('p');
  infoText2.textContent = t.saveInfo;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = t.save;
  saveBtn.className = 'btn btn-sm btn-success mt-2';

  saveBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(api_url+'/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titlePhrase,
          url: fileUrl,
          original_filename: uploadedFileName
        }),
      });

      const result = await response.json();
      appendMessage(t.savedSuccess+ result.message, 'ai');
    } catch (error) {
      console.error('Save failed:', error);
      appendMessage(t.saveFailed, 'ai');
    }
  });
  bubble.appendChild(infoText1);
  bubble.appendChild(downloadBtn);
  bubble.appendChild(infoText2);
  bubble.appendChild(saveBtn);

  messageContainer.appendChild(avatar);
  messageContainer.appendChild(bubble);
  chatWindow.appendChild(messageContainer);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
function showAiLoader() {
    if (aiLoaderMessage) {
        aiLoaderMessage.remove();
    }

    aiLoaderMessage = document.createElement('div');
    aiLoaderMessage.className = 'message-container ai ai-loader-container';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar ai';
    avatar.textContent = 'AI';

    const loaderBubble = document.createElement('div');
    loaderBubble.className = 'loader';
    loaderBubble.innerHTML = `<span></span><span></span><span></span>`;

    aiLoaderMessage.append(avatar, loaderBubble);
    chatWindow.appendChild(aiLoaderMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
function hideAiLoader() {
    if (aiLoaderMessage) {
        aiLoaderMessage.remove();
        aiLoaderMessage = null;
    }
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';  // or your login page
});
